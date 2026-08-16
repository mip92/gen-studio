import { WorkflowTemplate } from '../../workflows/workflow.types';
import { VideoEngine, VideoFlow, VideoRenderRequest } from './video-engine';

/**
 * Wan 2.2 image-to-video — the project's original and, until 2026-08-16, only
 * video engine. Everything here was lifted verbatim out of
 * `video-render.service.ts`; behaviour is unchanged, which is the point of the
 * move.
 */

const FAST_WORKFLOW  = 'video_wan22_i2v_api.json';
// Alternative "quality" graph: full Wan2.2 dual-expert, no lightx2v speed LoRA,
// 20 steps @ cfg=4.0 → the negative prompt actually fires. MEASURED on 6 208
// completed renders (2026-07-30): median 980 s against the fast path's 150 s,
// i.e. 6.5× slower.
const CFG_WORKFLOW   = 'video_wan22_i2v_cfg_api.json';
// «страж» — the fast graph with cfg raised on the HIGH-NOISE sampler only
// (node 14, steps 0→2 @ cfg 2.5); node 15 stays at cfg 1.0. In an A14B MoE the
// high-noise expert decides composition, so this is where a negative prompt can
// stop a figure walking into an empty frame — 6 passes, ~196 s, against the cfg
// path's 40 passes and 980 s.
const GUARD_WORKFLOW = 'video_wan22_i2v_guard_api.json';

const ALLOWED = new Set([FAST_WORKFLOW, CFG_WORKFLOW, GUARD_WORKFLOW]);

/**
 * Wan-readable phrasing for our own `Shot.cameraMove` vocabulary.
 *
 * Alibaba's I2V prompt formula is `Motion + Camera movement`, and an i2v model
 * given no camera instruction does not hold still — it invents a drift, which at
 * 4 steps is where warping and «бред» live. Measured 2026-07-30: only 84 of
 * 5 671 animated shots named a camera anywhere in their motion prompt, while
 * `Shot.cameraMove` was populated on 6 205 of 6 425 — so the clause is DERIVED
 * from that column at dispatch rather than baked into thousands of strings.
 */
const CAMERA_CLAUSE: Record<string, string> = {
  static:        'the camera stays fixed',
  locked_off:    'the camera stays fixed',
  push_in:       'the camera pushes in slowly',
  pull_out:      'the camera pulls back slowly',
  track:         'the camera tracks slowly alongside',
  track_lateral: 'the camera tracks slowly sideways',
  pan:           'the camera pans slowly',
  pan_left:      'the camera pans slowly to the left',
  pan_right:     'the camera pans slowly to the right',
  tilt_up:       'the camera tilts up slowly',
  tilt_down:     'the camera tilts down slowly',
  handheld:      'a faint handheld drift',
  window_pov:    'the camera holds a fixed point of view through the window',
  // An ARC is the camera travelling around the subject, which `pan` is not — a
  // pan turns the camera on its own axis and the subject slides out of frame.
  arc_left:      'the camera arcs slowly around him to the left, keeping him centred',
  arc_right:     'the camera arcs slowly around him to the right, keeping him centred',
};

/** Second half of a compound move, as a `while …` clause. */
const CAMERA_SECONDARY: Record<string, string> = {
  push_in:       'pushing in slowly',
  pull_out:      'pulling back slowly',
  track:         'tracking alongside',
  track_lateral: 'tracking sideways',
  pan_left:      'panning to the left',
  pan_right:     'panning to the right',
  tilt_up:       'tilting up',
  tilt_down:     'tilting down',
  arc_left:      'arcing around him to the left',
  arc_right:     'arcing around him to the right',
};

export class WanVideoEngine implements VideoEngine {
  readonly id = 'wan' as const;
  readonly displayName = 'Wan 2.2 (i2v)';

  // 768×432 = exact 16:9, both dims divisible by 16. Chosen over 832×480 because
  // 832/480 = 1.733 ≠ 1920/1080, which would force crop or stretch on the FHD
  // upscale; 768×432 scales to FHD by a uniform 0.625 with no distortion.
  // 81 frames @ 16 fps is Wan's native clip — 5.06 s.
  readonly defaults = { width: 768, height: 432, length: 81, fps: 16 };

  supportsFlow(_flow: VideoFlow): boolean {
    // Both flows run on the same three templates: the two-frame flow is a node
    // swap inside whichever file the mode picked, not a separate graph.
    return true;
  }

  // `flow` is ignored: both flows run on the same three templates, because the
  // two-frame flow is a node swap inside whichever file the mode picked.
  workflowFor(mode?: string | null, _flow?: VideoFlow): string {
    if (mode === 'cfg')   return CFG_WORKFLOW;
    if (mode === 'guard') return GUARD_WORKFLOW;
    return FAST_WORKFLOW;
  }

  ownsWorkflow(filename: string): boolean {
    return ALLOWED.has(filename);
  }

  cameraClause(move: string): string | undefined {
    const parts = move.split('+').map((m) => m.trim()).filter(Boolean);
    const head  = CAMERA_CLAUSE[parts[0] ?? ''];
    if (!head) return undefined;
    const tail = parts[1] ? CAMERA_SECONDARY[parts[1]] : undefined;
    return tail ? `${head} while ${tail}` : head;
  }

  patch(template: WorkflowTemplate, p: VideoRenderRequest): WorkflowTemplate {
    const wf = structuredClone(template) as Record<string, any>;
    const set = (id: string, key: string, value: unknown) => {
      if (wf[id]) wf[id].inputs[key] = value;
    };
    // Source image goes through LoadImage (11) → ImageScale (12) → WanImageToVideo (13).
    set('11', 'image',  p.sourceImage);
    set('12', 'width',  p.width);
    set('12', 'height', p.height);
    set('13', 'width',  p.width);
    set('13', 'height', p.height);
    set('13', 'length', p.length);

    // ── Two-frame flow (flf2v) ───────────────────────────────────────────────
    // Swap node 13 to `WanFirstLastFrameToVideo` in place and feed it a second
    // image, mirroring 11→12→13 with two freshly allocated nodes.
    //
    // The swap is legal because both nodes take the SAME input names and return
    // the same three outputs (comfy_extras/nodes_wan.py); `end_image` is the only
    // addition. Done as a rewrite rather than three more JSONs because the flow
    // is orthogonal to the MODE — a flf2v twin of each file would be six files to
    // edit in lockstep forever.
    //
    // Ids are ALLOCATED, not hardcoded: the templates do not share a node-id
    // range (fast and cfg stop at 18, guard already uses 19), and a fixed id
    // would silently overwrite a real node in whichever template grows into it.
    if (p.endImage) {
      if (wf['13']?.class_type !== 'WanImageToVideo') {
        throw new Error(
          `flf2v: expected node 13 to be WanImageToVideo, found "${wf['13']?.class_type ?? 'nothing'}"`,
        );
      }
      const nextId  = Math.max(...Object.keys(wf).map(Number).filter(Number.isFinite)) + 1;
      const loadId  = String(nextId);
      const scaleId = String(nextId + 1);

      wf['13'].class_type = 'WanFirstLastFrameToVideo';
      wf[loadId]  = { class_type: 'LoadImage',  inputs: { image: p.endImage } };
      wf[scaleId] = {
        class_type: 'ImageScale',
        inputs: {
          image: [loadId, 0], upscale_method: 'lanczos',
          width: p.width, height: p.height, crop: 'center',
        },
      };
      wf['13'].inputs.end_image = [scaleId, 0];
    }

    // Positive on node 9, negative on node 10. The negative is only set when the
    // caller has one; otherwise the JSON's own text stays.
    set('9', 'text', p.motionPrompt);
    if (p.motionNegative !== undefined) set('10', 'text', p.motionNegative);

    // Both sampler stages share the seed (14 = high-noise, 15 = low-noise).
    set('14', 'noise_seed', p.seed);
    set('15', 'noise_seed', p.seed);

    set('17', 'fps',             p.fps);
    set('18', 'filename_prefix', p.filenamePrefix);
    return wf as WorkflowTemplate;
  }
}
