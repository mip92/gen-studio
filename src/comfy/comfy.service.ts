import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QueuePromptResult {
  promptId: string;
  number: number;
}

export interface HistoryEntry {
  status: { status_str: string; completed: boolean };
  outputs: Record<string, unknown>;
}

@Injectable()
export class ComfyService {
  private readonly logger = new Logger(ComfyService.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(projectComfyUrl?: string): string {
    return (
      projectComfyUrl ??
      this.config.get<string>('COMFY_BASE_URL') ??
      'http://127.0.0.1:8188'
    );
  }

  async queuePrompt(
    workflow: Record<string, unknown>,
    comfyBaseUrl?: string,
  ): Promise<QueuePromptResult> {
    const url = `${this.baseUrl(comfyBaseUrl)}/prompt`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ComfyUI /prompt error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as { prompt_id: string; number: number };
    this.logger.log(`Queued prompt ${data.prompt_id} (#${data.number})`);
    return { promptId: data.prompt_id, number: data.number };
  }

  async getHistory(
    promptId: string,
    comfyBaseUrl?: string,
  ): Promise<HistoryEntry | null> {
    const url = `${this.baseUrl(comfyBaseUrl)}/history/${promptId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, HistoryEntry>;
    return data[promptId] ?? null;
  }

  async getQueue(comfyBaseUrl?: string) {
    const url = `${this.baseUrl(comfyBaseUrl)}/queue`;
    const res = await fetch(url);
    return res.ok ? res.json() : null;
  }

  /** Interrupt whatever prompt ComfyUI is CURRENTLY executing (no id targeting —
   *  ComfyUI only ever runs one at a time). Best-effort. */
  async interrupt(comfyBaseUrl?: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl(comfyBaseUrl)}/interrupt`, { method: 'POST' });
      return res.ok;
    } catch (e) {
      this.logger.warn(`ComfyUI /interrupt failed: ${(e as Error).message}`);
      return false;
    }
  }

  /** Remove a still-PENDING prompt from ComfyUI's queue by id. Best-effort. */
  async deleteQueued(promptId: string, comfyBaseUrl?: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl(comfyBaseUrl)}/queue`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ delete: [promptId] }),
      });
      return res.ok;
    } catch (e) {
      this.logger.warn(`ComfyUI /queue delete ${promptId} failed: ${(e as Error).message}`);
      return false;
    }
  }

  /** Where a prompt currently sits in ComfyUI: running now, still pending, or
   *  neither (already finished, or LOST — e.g. ComfyUI was restarted). Reads the
   *  live queue; the promptId is item[1] of each running/pending tuple. */
  async promptPlacement(
    promptId: string,
    comfyBaseUrl?: string,
  ): Promise<'running' | 'pending' | 'absent' | 'unknown'> {
    const q = (await this.getQueue(comfyBaseUrl)) as
      | { queue_running?: unknown[][]; queue_pending?: unknown[][] }
      | null;
    if (!q) return 'unknown';
    const idOf = (row: unknown[]) => (Array.isArray(row) ? row[1] : undefined);
    if ((q.queue_running ?? []).some((r) => idOf(r) === promptId)) return 'running';
    if ((q.queue_pending ?? []).some((r) => idOf(r) === promptId)) return 'pending';
    return 'absent';
  }

  /** Cancel a specific prompt in ComfyUI: interrupt it if it's the one running,
   *  or drop it from the queue if still pending. No-op if it's already gone.
   *  Returns what was done so callers can log it. */
  async cancelPrompt(
    promptId: string,
    comfyBaseUrl?: string,
  ): Promise<'interrupted' | 'dequeued' | 'absent' | 'unknown'> {
    const where = await this.promptPlacement(promptId, comfyBaseUrl);
    if (where === 'running') { await this.interrupt(comfyBaseUrl);            return 'interrupted'; }
    if (where === 'pending') { await this.deleteQueued(promptId, comfyBaseUrl); return 'dequeued'; }
    return where; // 'absent' | 'unknown'
  }
}
