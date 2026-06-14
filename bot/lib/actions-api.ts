/**
 * Bot-side client for the /actions endpoint and the approval mutations.
 * Mirrors the shape of ActionsService.ActionItem; mutations call the same
 * REST endpoints the UI uses (PATCH /shots/:id/chosen-render etc.).
 */
const API_BASE = process.env.GEN_STUDIO_API_BASE ?? 'http://127.0.0.1:4000';

export type GateKey =
  | 'upload_dataset_images'
  | 'start_dataset'
  | 'start_training'
  | 'generate_anchor'
  | 'render_scene'
  | 'approve_render'
  | 'create_video'
  | 'approve_video'
  | 'upscale_video'
  | 'render_tts'
  | 'approve_tts'
  | 'approve_bgm';

export interface ActionItem {
  gate:    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  gateKey: GateKey;
  project: { id: string; slug: string; name: string };
  character?: { id: string; code: string; displayName: string | null };
  profile?:   { id: string; code: string };
  scene?:     { id: string; sceneKey: string; title: string | null };
  shot?:      { id: string; code: string };
  segment?:   {
    id:          string;
    sortOrder:   number;
    durationSec: number;
    prompt:      string | null;
    block:       { id: string; slug: string; title: string | null };
  };
  link:       string;
  action?: {
    method: 'POST' | 'PATCH';
    path:   string;
    body?:  Record<string, unknown>;
  };
}

export interface ShotRender {
  filename:    string;
  promptId?:   string;
  seed?:       number;
  strategyId?: string;
  createdAt?:  string;
}

export interface VideoRow {
  id:                 string;
  status:             string;
  outputFilename:     string | null;
  upscaleStatus:      string | null;
  upscaledFilename:   string | null;
}

export interface ShotFull {
  id:                 string;
  shotCode:           string;
  renderedImages:     ShotRender[] | null;
  chosenRender:       string | null;
  chosenVideoId:      string | null;
  narrationText:      string | null;
  approvedTTSJobId:   string | null;
  videoRenders?:      VideoRow[];
  ttsJobs?:           TtsJobRow[];
  project?:           { id: string; slug: string; name: string };
}

export interface TtsJobRow {
  id:             string;
  status:         string;
  text:           string;
  outputFilename: string | null;
  voice:          string;
  durationMs:     number | null;
  createdAt:      string;
}

export interface BgmJobRow {
  id:             string;
  status:         string;
  outputFilename: string | null;
  queuedAt:       string;
  completedAt:    string | null;
}

export interface BgmSegmentFull {
  id:            string;
  sortOrder:     number;
  durationSec:   number;
  prompt:        string | null;
  approvedJobId: string | null;
  block:         {
    id:        string;
    slug:      string;
    title:     string | null;
    projectId: string;
    project:   { slug: string };
  };
  jobs:          BgmJobRow[];
}

export async function fetchActions(projectSlug?: string): Promise<{ items: ActionItem[] }> {
  const qs = projectSlug ? `?project=${encodeURIComponent(projectSlug)}` : '';
  const res = await fetchWithTimeout(`${API_BASE}/actions${qs}`);
  if (!res.ok) throw new Error(`GET /actions → HTTP ${res.status}`);
  return (await res.json()) as { items: ActionItem[] };
}

export async function fetchShot(shotId: string): Promise<ShotFull> {
  const res = await fetchWithTimeout(`${API_BASE}/shots/${shotId}`);
  if (!res.ok) throw new Error(`GET /shots/${shotId} → HTTP ${res.status}`);
  return (await res.json()) as ShotFull;
}

// GET /shots/:id does NOT include videoRenders — that list lives on the
// generation controller. Fetch the two in parallel and merge.
export async function listShotVideos(shotId: string): Promise<VideoRow[]> {
  const res = await fetchWithTimeout(`${API_BASE}/generation/shots/${shotId}/videos`);
  if (!res.ok) throw new Error(`GET /generation/shots/${shotId}/videos → HTTP ${res.status}`);
  return (await res.json()) as VideoRow[];
}

export async function listShotTTSJobs(shotId: string): Promise<TtsJobRow[]> {
  const res = await fetchWithTimeout(`${API_BASE}/tts/shots/${shotId}/jobs`);
  if (!res.ok) throw new Error(`GET /tts/shots/${shotId}/jobs → HTTP ${res.status}`);
  return (await res.json()) as TtsJobRow[];
}

export async function fetchShotWithVideos(shotId: string): Promise<ShotFull> {
  const [shot, videos, tts] = await Promise.all([
    fetchShot(shotId),
    listShotVideos(shotId),
    // TTS jobs are nice-to-have — if the endpoint hiccups we still want the
    // shot view to render images/videos rather than failing the whole open.
    listShotTTSJobs(shotId).catch(() => [] as TtsJobRow[]),
  ]);
  return { ...shot, videoRenders: videos, ttsJobs: tts };
}

export async function approveTTSJob(jobId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/tts/jobs/${jobId}/approve`, { method: 'POST' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST tts approve → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function deleteTTSJob(jobId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/tts/jobs/${jobId}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DELETE tts → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function clearShotTTSApproval(shotId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/tts/shots/${shotId}/approve/clear`, { method: 'POST' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST tts clear → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

// ── BGM segment helpers ────────────────────────────────────────────────────

export async function fetchSegment(segmentId: string): Promise<BgmSegmentFull> {
  const res = await fetchWithTimeout(`${API_BASE}/bgm/segments/${segmentId}`);
  if (!res.ok) throw new Error(`GET /bgm/segments/${segmentId} → HTTP ${res.status}`);
  return (await res.json()) as BgmSegmentFull;
}

export async function approveBgmJob(segmentId: string, jobId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/bgm/segments/${segmentId}/approve/${jobId}`, { method: 'POST' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST bgm approve → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function clearBgmApproval(segmentId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/bgm/segments/${segmentId}/approve`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DELETE bgm approve → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function deleteBgmJob(jobId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/bgm/jobs/${jobId}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DELETE bgm job → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function setChosenRender(shotId: string, filename: string | null): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/shots/${shotId}/chosen-render`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ filename }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`PATCH chosen-render → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function setChosenVideo(shotId: string, videoId: string | null): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/shots/${shotId}/chosen-video`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ videoId }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`PATCH chosen-video → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function deleteRender(shotId: string, filename: string): Promise<void> {
  const res = await fetchWithTimeout(
    `${API_BASE}/shots/${shotId}/renders/${encodeURIComponent(filename)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DELETE render → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function deleteVideo(videoId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/generation/videos/${videoId}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DELETE video → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function startUpscale(videoId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/generation/videos/${videoId}/upscale`, { method: 'POST' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST upscale → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function enqueueSceneRender(shotId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/generation/shots/${shotId}/enqueue`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST scene enqueue → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

export async function startVideoRender(shotId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/generation/shots/${shotId}/videos`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ count: 1 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST video start → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

// Queue a TTS render for a shot (gate render_tts). Uses shot.narrationText when
// no text is passed. Backend: POST /tts/shots/:id.
export async function queueShotTTS(shotId: string): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/tts/shots/${shotId}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({}),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`POST tts queue → HTTP ${res.status} ${txt.slice(0, 200)}`);
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 10_000): Promise<Response> {
  const ctrl = new AbortController();
  const to   = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(to);
  }
}
