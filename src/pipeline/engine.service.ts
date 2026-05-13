import { Injectable, Logger } from '@nestjs/common';
import { execFileSync, spawn } from 'child_process';
import { existsSync } from 'fs';

const COMFY_HEALTH_URL = process.env.COMFY_BASE_URL
  ? `${process.env.COMFY_BASE_URL}/system_stats`
  : 'http://127.0.0.1:8188/system_stats';

const COMFY_CMD_FRAGMENT = 'main.py';   // ComfyUI launches as `python main.py …`

const COMFY_DIR        = process.env.COMFY_DIR        ?? 'E:\\ComfyUI';
const COMFY_PYTHON     = process.env.COMFY_PYTHON     ?? 'python';
const COMFY_LAUNCH_ARGS = (process.env.COMFY_LAUNCH_ARGS ?? '--fast --enable-manager').split(/\s+/).filter(Boolean);

const COMFY_START_TIMEOUT_MS = 120_000;   // cold start ~ 30-60s; allow 2 min buffer
const COMFY_START_POLL_MS    = 2_000;

/**
 * Single point of control for OS-level process lifecycle of GPU consumers:
 *   - ComfyUI (python main.py …, port 8188)
 *   - kohya_ss training subprocess (sdxl_train_network.py via accelerate)
 *
 * Pipeline queue uses this to ensure mutually-exclusive engines (training kills
 * ComfyUI before kohya loads its own checkpoint, otherwise VRAM contention
 * causes 0xC0000005 ACCESS_VIOLATION crashes — see git history for FATHER_BASE
 * 8 May incident).
 */
@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  /** PIDs of training subprocesses we spawned, keyed by trainingJob.id. */
  private readonly trackedKohyaPids = new Map<string, number>();

  // ── ComfyUI ────────────────────────────────────────────────────────────────

  async isComfyAlive(): Promise<boolean> {
    try {
      const ctl = AbortSignal.timeout(2000);
      const r = await fetch(COMFY_HEALTH_URL, { signal: ctl });
      return r.ok;
    } catch {
      return false;
    }
  }

  /**
   * Start ComfyUI as a detached child process from COMFY_DIR. Resolves once the
   * /system_stats endpoint responds (cold start typically 30-60s on a 16GB GPU
   * with the manager enabled — we give it COMFY_START_TIMEOUT_MS).
   *
   * Detached + unref() so ComfyUI survives a backend restart; we only kill it
   * via the explicit stopComfy() path (e.g. before training starts).
   *
   * No-op if ComfyUI is already alive.
   */
  async startComfy(): Promise<{ pid: number | null; alreadyAlive: boolean }> {
    if (await this.isComfyAlive()) {
      this.logger.log('startComfy: already alive');
      return { pid: null, alreadyAlive: true };
    }
    if (!existsSync(COMFY_DIR)) {
      throw new Error(`startComfy: COMFY_DIR not found: ${COMFY_DIR}`);
    }

    const argv = ['main.py', ...COMFY_LAUNCH_ARGS];
    this.logger.log(`startComfy: spawning ${COMFY_PYTHON} ${argv.join(' ')} (cwd=${COMFY_DIR})`);
    const proc = spawn(COMFY_PYTHON, argv, {
      cwd:      COMFY_DIR,
      detached: true,
      stdio:    'ignore',
      windowsHide: false,
    });
    proc.unref();
    const pid = proc.pid ?? null;

    const deadline = Date.now() + COMFY_START_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(COMFY_START_POLL_MS);
      if (await this.isComfyAlive()) {
        this.logger.log(`startComfy: alive (pid=${pid}, took ${(Date.now() - (deadline - COMFY_START_TIMEOUT_MS))/1000 | 0}s)`);
        return { pid, alreadyAlive: false };
      }
    }
    throw new Error(`startComfy: timeout — /system_stats did not respond within ${COMFY_START_TIMEOUT_MS}ms`);
  }

  /** Find PIDs of all ComfyUI processes (matched by command line). */
  findComfyPids(): number[] {
    return findPidsByCommandLine((cmd) =>
      cmd.includes(COMFY_CMD_FRAGMENT) && /python(?:\.exe)?/i.test(cmd),
    );
  }

  /**
   * Stop all ComfyUI processes. Returns once HTTP health-check fails AND the
   * PIDs are gone, or after maxWaitMs.
   */
  async stopComfy(maxWaitMs = 30_000): Promise<{ killed: number[] }> {
    const pids = this.findComfyPids();
    if (pids.length === 0) {
      this.logger.log('stopComfy: no ComfyUI process running');
      return { killed: [] };
    }
    this.logger.log(`stopComfy: killing PID(s) ${pids.join(', ')}`);
    for (const pid of pids) killPid(pid);

    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const stillAlive = pids.filter((p) => isPidAlive(p));
      if (stillAlive.length === 0 && !(await this.isComfyAlive())) {
        this.logger.log('stopComfy: confirmed down');
        return { killed: pids };
      }
      await sleep(500);
    }
    this.logger.warn(`stopComfy: PIDs still alive after ${maxWaitMs}ms — best-effort done`);
    return { killed: pids };
  }

  // ── kohya ──────────────────────────────────────────────────────────────────

  trackKohya(jobId: string, pid: number): void {
    if (pid > 0) this.trackedKohyaPids.set(jobId, pid);
  }

  forgetKohya(jobId: string): void {
    this.trackedKohyaPids.delete(jobId);
  }

  killKohya(jobId: string): boolean {
    const pid = this.trackedKohyaPids.get(jobId);
    if (!pid) return false;
    this.logger.log(`killKohya: killing job=${jobId} pid=${pid}`);
    killPid(pid);
    this.trackedKohyaPids.delete(jobId);
    return true;
  }

  /**
   * Find ANY orphaned kohya training process (e.g. backend restarted while
   * sdxl_train_network.py was running). Used by boot cleanup.
   */
  findOrphanedKohyaPids(): number[] {
    return findPidsByCommandLine((cmd) =>
      cmd.includes('sdxl_train_network.py') && /python(?:\.exe)?/i.test(cmd),
    );
  }

  killAllOrphanedKohya(): number[] {
    const pids = this.findOrphanedKohyaPids();
    for (const pid of pids) killPid(pid);
    if (pids.length > 0) this.logger.log(`killAllOrphanedKohya: killed ${pids.join(', ')}`);
    return pids;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Enumerate python processes via PowerShell + Win32_Process. Returns PIDs
 * whose CommandLine satisfies the predicate. Synchronous — used outside
 * hot paths so the brief block is acceptable.
 */
function findPidsByCommandLine(predicate: (cmdLine: string) => boolean): number[] {
  try {
    const psScript =
      `Get-CimInstance Win32_Process -Filter "Name='python.exe'" | ` +
      `Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress`;
    const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
      encoding: 'utf-8',
      windowsHide: true,
      timeout: 5000,
    });
    if (!out.trim()) return [];
    const parsed = JSON.parse(out);
    const rows: Array<{ ProcessId: number; CommandLine: string | null }> = Array.isArray(parsed) ? parsed : [parsed];
    return rows
      .filter((r) => r.CommandLine && predicate(r.CommandLine))
      .map((r) => r.ProcessId);
  } catch (e: any) {
    return [];
  }
}

function isPidAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function killPid(pid: number): void {
  try { process.kill(pid); } catch { /* already gone */ }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
