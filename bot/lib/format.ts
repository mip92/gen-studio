import { InlineKeyboard } from 'grammy';
import type { JobType, QueueFilters, QueueRow, StatusFilter } from './api';

const TYPE_LABEL: Record<JobType, string> = {
  training:      'train',
  dataset:       'dataset',
  scene:         'scene',
  video:         'video',
  video_upscale: 'vid-up',
  tts:           'tts',
  bgm:           'bgm',
};

const ALL_TYPES: JobType[] = ['training', 'dataset', 'scene', 'video', 'video_upscale', 'tts', 'bgm'];

const TYPE_SHORT_TO_LONG: Record<string, JobType> = {
  tr: 'training',
  ds: 'dataset',
  sc: 'scene',
  vd: 'video',
  vu: 'video_upscale',
  tt: 'tts',
  bg: 'bgm',
};
const TYPE_LONG_TO_SHORT: Record<JobType, string> = Object.fromEntries(
  Object.entries(TYPE_SHORT_TO_LONG).map(([k, v]) => [v, k]),
) as Record<JobType, string>;

const STATUS_CODE: Record<StatusFilter, string> = {
  active: 'A', pending: 'P', running: 'R', finished: 'F',
};
const STATUS_FROM_CODE: Record<string, StatusFilter> = {
  A: 'active', P: 'pending', R: 'running', F: 'finished',
};

/**
 * Callback-data shape: "q:<status_code>:<type_shorts_csv>"
 * Example: "q:A:" (active, no type filter), "q:P:sc,vd" (pending, scene+video only).
 * Telegram caps callback_data at 64 bytes — this scheme stays under 30.
 */
export function encodeFilters(f: QueueFilters): string {
  const shorts = f.types.map((t) => TYPE_LONG_TO_SHORT[t]).join(',');
  return `q:${STATUS_CODE[f.status]}:${shorts}`;
}

export function decodeFilters(data: string): QueueFilters | null {
  if (!data.startsWith('q:')) return null;
  const parts = data.slice(2).split(':');
  if (parts.length !== 2) return null;
  const status = STATUS_FROM_CODE[parts[0]];
  if (!status) return null;
  const types = parts[1]
    ? parts[1].split(',').map((s) => TYPE_SHORT_TO_LONG[s]).filter(Boolean)
    : [];
  return { status, types };
}

export const DEFAULT_FILTERS: QueueFilters = { status: 'active', types: [] };

function ageShort(iso: string | null, now: number): string {
  if (!iso) return '-';
  const ms = now - Date.parse(iso);
  if (ms < 0)          return '0s';
  if (ms < 60_000)     return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000)  return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** "Age since whichever lifecycle marker is relevant to this status" — for a
 *  pending job that's queued time, for everything else it's elapsed run time
 *  (started → now, or started → completed if terminal). */
function ageOf(r: QueueRow, now: number): string {
  if (r.status === 'pending') return ageShort(r.queuedAt, now);
  if (r.completedAt) {
    if (!r.startedAt) return ageShort(r.queuedAt, Date.parse(r.completedAt));
    const ms = Date.parse(r.completedAt) - Date.parse(r.startedAt);
    return ageShort(new Date(now - ms).toISOString(), now);
  }
  return ageShort(r.startedAt ?? r.queuedAt, now);
}

/** Display target — project / specific subject of the job.
 *  - For training/dataset: project / character profile (profileCode).
 *  - For scene/video/upscale: project / shot code (profileCode).
 *  - For tts/bgm: project / shot or scene (profileCode). */
function fmtTarget(r: QueueRow): string {
  const proj = r.projectSlug || '-';
  const subj = r.profileCode || r.characterCode || '-';
  return `${proj} / ${subj}`;
}

export function renderQueueText(page: { rows: QueueRow[]; total: number }, f: QueueFilters): string {
  const now      = Date.now();
  const updated  = new Date(now).toLocaleTimeString('en-GB', { hour12: false });
  const statusLabel = f.status[0].toUpperCase() + f.status.slice(1);
  const typesLabel  = f.types.length === 0
    ? 'all types'
    : f.types.map((t) => TYPE_LABEL[t]).join(', ');
  const countLabel  = page.total === 1 ? '1 job' : `${page.total} jobs`;
  const truncated   = page.rows.length < page.total
    ? ` (showing ${page.rows.length})`
    : '';

  const headerHtml =
    `<b>Queue: ${escapeHtml(statusLabel)} · ${escapeHtml(typesLabel)}</b>\n` +
    `<b>${countLabel}</b>${truncated} · ${updated}`;

  if (page.rows.length === 0) {
    return `${headerHtml}\n\n<i>(empty)</i>`;
  }

  // Single <pre> block — guaranteed monospace + preserves the column padding.
  const tableHeader = ' #  status     type     age    target';
  const lines = page.rows.map((r, i) => {
    const idx  = String(i + 1).padStart(2);
    const st   = (r.status ?? '?').padEnd(10);
    const ty   = (TYPE_LABEL[r.type] ?? '?').padEnd(8);
    const age  = ageOf(r, now).padEnd(6);
    const tgt  = fmtTarget(r);
    return `${idx}  ${st} ${ty} ${age} ${tgt}`;
  });
  const body = [tableHeader, ...lines].join('\n');

  return `${headerHtml}\n<pre>${escapeHtml(body)}</pre>`;
}

export function buildKeyboard(f: QueueFilters): InlineKeyboard {
  const kb = new InlineKeyboard();

  // Row 1 — status filter. Active marked with bullet.
  const dot = (s: StatusFilter) => (f.status === s ? '● ' : '');
  kb.text(`${dot('active')}Active`,     encodeFilters({ ...f, status: 'active' }))
    .text(`${dot('pending')}Pending`,   encodeFilters({ ...f, status: 'pending' }))
    .text(`${dot('running')}Running`,   encodeFilters({ ...f, status: 'running' }))
    .text(`${dot('finished')}Finished`, encodeFilters({ ...f, status: 'finished' }))
    .row();

  // Row 2 — refresh same filters.
  kb.text('🔄 Refresh', encodeFilters(f));

  return kb;
}
