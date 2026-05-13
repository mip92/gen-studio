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
}
