export type JobType =
  | 'training' | 'dataset' | 'scene' | 'video' | 'video_upscale' | 'tts' | 'bgm';

export interface QueueRow {
  type:           JobType;
  id:             string;
  status:         string;
  profileCode:    string;
  characterCode:  string;
  projectSlug:    string;
  projectId:      string | null;
  shotId:         string | null;
  triggerToken:   string | null;
  queuedAt:       string;
  startedAt:      string | null;
  completedAt:    string | null;
  errorMessage:   string | null;
  isFirstPending: boolean;
  isLastPending:  boolean;
}

export interface QueuePage {
  rows:  QueueRow[];
  total: number;
  page:  number;
  limit: number;
  sort:  string;
  order: 'asc' | 'desc';
}

export type StatusFilter = 'active' | 'pending' | 'running' | 'finished';

export interface QueueFilters {
  status: StatusFilter;
  types:  JobType[];
}

const API_BASE = process.env.GEN_STUDIO_API_BASE ?? 'http://127.0.0.1:4000';

export async function fetchQueue(filters: QueueFilters, page = 1, limit = 40): Promise<QueuePage> {
  const qs = new URLSearchParams();
  switch (filters.status) {
    case 'active':   qs.set('finished', 'false'); break;
    case 'finished': qs.set('finished', 'true');  break;
    case 'pending':  qs.set('status', 'pending'); break;
    case 'running':  qs.set('status', 'running'); break;
  }
  if (filters.types.length > 0) qs.set('type', filters.types.join(','));
  qs.set('sort',  'queuedAt');
  qs.set('order', 'asc');
  qs.set('limit', String(limit));
  qs.set('page',  String(page));

  const url = `${API_BASE}/pipeline/queue?${qs.toString()}`;
  const ctrl = new AbortController();
  const to   = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
    return (await res.json()) as QueuePage;
  } finally {
    clearTimeout(to);
  }
}
