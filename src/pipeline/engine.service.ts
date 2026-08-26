import { Injectable, Logger } from '@nestjs/common';
import { execFileSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { connect } from 'net';
import { GPU_SERVICES, GpuService } from './queue-entry.types';

const COMFY_HEALTH_URL = process.env.COMFY_BASE_URL
  ? `${process.env.COMFY_BASE_URL}/system_stats`
  : 'http://127.0.0.1:8188/system_stats';

const COMFY_CMD_FRAGMENT = 'main.py';   // ComfyUI launches as `python main.py …`

const COMFY_DIR        = process.env.COMFY_DIR        ?? 'E:\\ComfyUI';
const COMFY_PYTHON     = process.env.COMFY_PYTHON     ?? 'python';
const COMFY_LAUNCH_ARGS = (process.env.COMFY_LAUNCH_ARGS ?? '--fast --enable-manager').split(/\s+/).filter(Boolean);

const COMFY_START_TIMEOUT_MS = 120_000;   // cold start ~ 30-60s; allow 2 min buffer
const COMFY_START_POLL_MS    = 2_000;

const OLLAMA_BASE = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
// Absolute by default rather than relying on PATH: `ollama` does resolve in an
// interactive shell here, but a service spawned by the backend does not
// necessarily inherit the same PATH, and this is the one place where getting it
// wrong is silent.
const OLLAMA_BIN  = process.env.OLLAMA_BIN ?? 'W:\\Programs\\Ollama\\app\\ollama.exe';
// Serving the API is quick (the slow part is loading a model, which happens on
// the first request, not here), but the Windows app adds a few seconds of
// indirection before it binds the port.
const OLLAMA_START_TIMEOUT_MS = 60_000;
const OLLAMA_START_POLL_MS    = 1_000;

// fish-speech S2-pro synthesises on a persistent api_server (scripts/
// tts_fish_s2.py autostarts it; it self-terminates after FISH_S2_IDLE_TIMEOUT_
// SEC). Matched by command line, like ComfyUI — the process is a python from the
// fish venv, so the script name is the only reliable marker.
const FISH_CMD_FRAGMENT = 'api_server.py';
const FISH_BASE = process.env.FISH_S2_URL ?? 'http://127.0.0.1:8880';

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
      // 8s, not 2s: a ComfyUI that is mid-render (GPU pegged) or loading a
      // checkpoint answers /system_stats slowly. A 2s timeout falsely reported
      // it dead, so the dispatcher respawned a SECOND instance on every render
      // ("comfy reopens each render" bug). 8s tolerates a busy-but-alive server.
      const ctl = AbortSignal.timeout(8000);
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

    // Not answering HTTP, but a ComfyUI process may be lingering — hung, or it
    // never bound its port. Kill any such zombie BEFORE spawning, otherwise we
    // accumulate duplicate instances fighting over port 8188 / VRAM (this is the
    // root of the "comfy reopens on every render" pile-up). Safe because the
    // pipeline is single-slot: no other startComfy is cold-starting concurrently.
    const stale = this.findComfyPids();
    if (stale.length > 0) {
      this.logger.warn(`startComfy: ${stale.length} ComfyUI process(es) running but not serving — killing stale PID(s) ${stale.join(', ')} before respawn`);
      for (const pid of stale) killPid(pid);
      await sleep(2000);
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

  // ── Ollama (vision validation) ──────────────────────────────────────────────

  /** True when the local Ollama server answers its API. */
  async isOllamaAlive(): Promise<boolean> {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5_000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Bring the Ollama server up, mirroring {@link startComfy}.
   *
   * Until 2026-08-10 nothing ever started it: `prepareEngine` dutifully stopped
   * ComfyUI for an `ollama`-class job and then called the API on faith. With the
   * server down that is an instant `fetch failed`, and the job died without ever
   * touching the GPU — six thumbnail-idea jobs went that way in one minute, and
   * the same failure is in the ledger from 03.08 and 08.08. ComfyUI had this
   * lifecycle from the start; Ollama simply never got its half.
   *
   * No-op when already alive. Launching the binary on Windows wakes the Ollama
   * app, which binds the port itself — so a "port already in use" exit from our
   * spawn is success, not failure, and we decide purely on the health check.
   */
  async startOllama(): Promise<{ alreadyAlive: boolean }> {
    if (await this.isOllamaAlive()) return { alreadyAlive: true };
    if (!existsSync(OLLAMA_BIN)) {
      throw new Error(`startOllama: binary not found: ${OLLAMA_BIN} (set OLLAMA_BIN)`);
    }

    this.logger.log(`startOllama: spawning ${OLLAMA_BIN} serve`);
    const proc = spawn(OLLAMA_BIN, ['serve'], { detached: true, stdio: 'ignore', windowsHide: true });
    proc.unref();

    const deadline = Date.now() + OLLAMA_START_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(OLLAMA_START_POLL_MS);
      if (await this.isOllamaAlive()) {
        this.logger.log('startOllama: alive');
        return { alreadyAlive: false };
      }
    }
    throw new Error(`startOllama: timeout — /api/tags did not respond within ${OLLAMA_START_TIMEOUT_MS}ms`);
  }

  /**
   * Ask the local Ollama server to unload any resident model (keep_alive:0), so
   * its VRAM is freed before ComfyUI cold-starts. Symmetric to stopComfy():
   * validation stops ComfyUI, and ComfyUI startup unloads the vision model —
   * the two GPU consumers are mutually exclusive on a 16 GB card. Best-effort:
   * if Ollama isn't running or the call fails, we just proceed.
   */
  async unloadOllama(): Promise<string[]> {
    try {
      // Ask which models are actually resident instead of guessing a name.
      // The old version unloaded one hardcoded model (OLLAMA_VALIDATION_MODEL,
      // the 8B validator) — so the 30B that thumbnail_ideas loads was never
      // released and kept its VRAM through every following job.
      const ps = await fetch(`${OLLAMA_BASE}/api/ps`, { signal: AbortSignal.timeout(5_000) });
      if (!ps.ok) return [];
      const body = await ps.json() as { models?: Array<{ name?: string; model?: string }> };
      const names = (body.models ?? []).map((m) => m.model ?? m.name).filter((n): n is string => !!n);
      if (names.length === 0) return [];

      for (const model of names) {
        // keep_alive:0 = "unload as soon as this (empty) request is done".
        await fetch(`${OLLAMA_BASE}/api/generate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ model, keep_alive: 0 }),
          signal:  AbortSignal.timeout(10_000),
        });
      }
      this.logger.log(`unloadOllama: released ${names.join(', ')} to free VRAM`);
      return names;
    } catch (e: any) {
      this.logger.warn(`unloadOllama: ${e?.message ?? e} (proceeding)`);
      return [];
    }
  }

  // ── fish-speech (S2-pro TTS) ───────────────────────────────────────────────

  /** True when the local fish api_server answers. Unreliable as a liveness
   *  probe on its own: the server loads its models INSIDE the /v1/tts handler,
   *  which blocks its event loop, so a loading server looks dead here. Use it
   *  only to decide "is it idle and ready", never "is the process gone". */
  async isFishAlive(): Promise<boolean> {
    try {
      const r = await fetch(`${FISH_BASE}/v1/health`, { signal: AbortSignal.timeout(3_000) });
      return r.ok;
    } catch {
      return false;
    }
  }

  /** True when something is listening on the fish port. Cheap (local TCP) and,
   *  unlike the health check, it also sees a server wedged in a model load —
   *  which is exactly the state in which it is holding the most VRAM. */
  private isFishPortOpen(timeoutMs = 700): Promise<boolean> {
    const [host, port] = FISH_BASE.split('//', 2)[1].split(':');
    return new Promise((resolve) => {
      const sock = connect({ host, port: Number(port || 80) });
      const done = (open: boolean) => { sock.destroy(); resolve(open); };
      sock.setTimeout(timeoutMs);
      sock.once('connect', () => done(true));
      sock.once('timeout', () => done(false));
      sock.once('error',   () => done(false));
    });
  }

  /** PIDs of fish api_server processes (matched by command line). */
  findFishPids(): number[] {
    return findPidsByCommandLine((cmd) =>
      cmd.includes(FISH_CMD_FRAGMENT) && /python(?:\.exe)?/i.test(cmd),
    );
  }

  /**
   * Stop the fish api_server so its ~9 GB is free before ComfyUI cold-starts.
   *
   * The mirror image of `unloadOllama()`, and needed for the same reason: the
   * card hosts ONE of these at a time. The server frees itself after 15 min of
   * idling, but the queue moves to the next job in seconds — without this the
   * ComfyUI that follows a TTS batch starts into a card that is still 9 GB
   * short. Best-effort: nothing running is the normal case.
   */
  async stopFish(maxWaitMs = 20_000): Promise<{ killed: number[] }> {
    const pids = this.findFishPids();
    if (pids.length === 0) return { killed: [] };
    this.logger.log(`stopFish: killing fish api_server PID(s) ${pids.join(', ')} to free VRAM`);
    for (const pid of pids) killPid(pid);

    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      if (pids.every((p) => !isPidAlive(p))) {
        this.logger.log('stopFish: confirmed down');
        return { killed: pids };
      }
      await sleep(500);
    }
    this.logger.warn(`stopFish: PID(s) still alive after ${maxWaitMs}ms — best-effort done`);
    return { killed: pids };
  }

  // ── arbitration ────────────────────────────────────────────────────────────

  /**
   * Free the card of every resident GPU service except `keep`.
   *
   * The system runs ONE heavy thing at a time — that is why the queue has a
   * single slot — so the rule is simply: whatever the next job does not run on,
   * switch off. Same service as the job before it (`keep` already up) means no
   * teardown and no reload, which is what makes a batch of one job type cheap.
   * Pass `null` for work that brings its own GPU process (whisper, kohya) and
   * wants the card empty.
   *
   * Each service is probed before it is touched, so the common case (nothing
   * else resident) costs two local HTTP calls and a TCP connect, and the
   * PowerShell process scans only run when there is really something to kill.
   *
   * Best-effort by design: a service we cannot reach is a service that is not
   * holding the card. Returns what was actually released, for the log line.
   */
  async releaseAllExcept(keep: GpuService | null): Promise<GpuService[]> {
    const freed: GpuService[] = [];
    for (const svc of GPU_SERVICES) {
      if (svc === keep) continue;
      if (await this.releaseService(svc)) freed.push(svc);
    }
    return freed;
  }

  /** Release one service. Returns true when it actually had to be freed. */
  private async releaseService(svc: GpuService): Promise<boolean> {
    switch (svc) {
      case 'comfy': {
        // Deliberately NOT gated on the health check: a ComfyUI wedged in an
        // OOM answers nothing while still holding every byte of VRAM. The pid
        // scan is the authority on whether it is really gone.
        const { killed } = await this.stopComfy();
        return killed.length > 0;
      }
      case 'ollama': {
        if (!await this.isOllamaAlive()) return false;
        return (await this.unloadOllama()).length > 0;
      }
      case 'fish': {
        if (!await this.isFishPortOpen()) return false;
        const { killed } = await this.stopFish();
        return killed.length > 0;
      }
    }
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
