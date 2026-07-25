/** Mirrors JobType in src/pipeline/queue-entry.types.ts — keep the two in step.
 *  `video_post` is the combined upscale+RIFE job that replaced the old
 *  video_upscale/video_interp pair. */
export type JobType =
  | 'training' | 'dataset' | 'scene' | 'video' | 'video_post' | 'tts'
  | 'bgm' | 'anchor' | 'validation' | 'anchor_validation' | 'caption';

/** Mirrors the /pipeline/queue row shape (one row per attempt, from the queue ledger). */
export interface QueueRow {
  type:           JobType;
  /** Queue entry id — the handle the reorder/cancel endpoints take. */
  entryId:        string;
  /** Id of the row in the type-specific table. */
  jobId:          string;
  attemptNumber:  number;
  status:         string;
  /** What is being worked on (shot code, music block, profile…). */
  label:          string;
  /** Where it sits — scene key, character code, or music block. */
  context:        string | null;
  projectSlug:    string | null;
  projectId:      string | null;
  shotId:         string | null;
  profileCode:    string | null;
  /** 1-based place in the pending queue; null unless pending. */
  position:       number | null;
  queuedAt:       string;
  startedAt:      string | null;
  completedAt:    string | null;
  /** Real elapsed ms (live while running). */
  durationMs:     number | null;
  errorMessage:   string | null;
  /** 'useful' | 'wasted' | null (not decided yet). */
  outcome:        string | null;
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
