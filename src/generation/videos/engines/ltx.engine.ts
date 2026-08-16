import { WorkflowTemplate } from '../../workflows/workflow.types';
import { VideoEngine, VideoFlow, VideoRenderRequest } from './video-engine';

/**
 * LTX-2.5 (Lightricks) — the second video engine, added 2026-08-16.
 *
 * The one reason it exists next to Wan: it generates a SYNCHRONISED AUDIO TRACK
 * from the same prompt. That is diegetic foley — footsteps, a lock, a train —
 * and it sits on the timeline as a third layer under f5 narration and ACE-Step
 * music, never as a replacement for either.
 *
 * ## Two templates, not a node swap
 *
 * Wan implements flf2v by rewriting one node in place, because
 * `WanImageToVideo` and `WanFirstLastFrameToVideo` take the same inputs. LTX has
 * no such pair: i2v runs `LTXVImgToVideoInplace` plus a latent-upscale second
 * sampler pass, while flf2v runs two `LTXVAddGuide` calls and a single pass.
 * They are different graphs with different node counts, so the flow picks the
 * FILE. That is why `workflowFor` takes the flow.
 *
 * ## Where the graphs come from
 *
 * `scripts/_convert_ltx25_template.py` flattens the shipped subgraph templates
 * into API format and validates every node against its `INPUT_TYPES`. The ids
 * below are the template's own; 900/901/902 are the three nodes the converter
 * adds, and it pins them deliberately so this file is not coupled to how many
 * nodes the upstream template happens to have.
 */

const I2V_WORKFLOW   = 'video_ltx2_5_i2v_api.json';
const FLF2V_WORKFLOW = 'video_ltx2_5_flf2v_api.json';

const ALLOWED = new Set([I2V_WORKFLOW, FLF2V_WORKFLOW]);

/** Nodes the converter appends, with fixed ids. */
const LOAD_FIRST = '900';
const LOAD_LAST  = '901';
const SAVE       = '902';

/**
 * Where each knob lives, per graph. Every entry is asserted against the node's
 * `class_type` before it is written: an upstream template revision that renumbers
 * its nodes must fail loudly here, because the silent version renders the
 * template's own demo prompt — an Egyptian royal walking through a desert — with
 * our filename on it.
 */
interface NodeMap {
  prompt:   string;   // PrimitiveStringMultiline
  negative: string;   // CLIPTextEncode
  enhance:  string;   // PrimitiveBoolean — the built-in prompt enhancer
  width:    string;   // PrimitiveInt
  height:   string;   // PrimitiveInt
  duration: string;   // PrimitiveInt — SECONDS, not frames
  fps:      string;   // PrimitiveInt
  seeds:    string[]; // RandomNoise, one per sampler pass
}

const MAPS: Record<VideoFlow, NodeMap> = {
  i2v: {
    prompt: '376', negative: '373', enhance: '383',
    width: '372', height: '360', duration: '362', fps: '361',
    // Two passes: 339 seeds the base sample, 338 the latent-upscale refinement.
    // Both move with the render's seed so a re-roll actually re-rolls.
    seeds: ['339', '338'],
  },
  flf2v: {
    prompt: '252', negative: '217', enhance: '250',
    width: '215', height: '216', duration: '198', fps: '205',
    seeds: ['196'],
  },
};

const EXPECTED_CLASS: Record<keyof Omit<NodeMap, 'seeds'>, string> = {
  prompt:   'PrimitiveStringMultiline',
  negative: 'CLIPTextEncode',
  enhance:  'PrimitiveBoolean',
  width:    'PrimitiveInt',
  height:   'PrimitiveInt',
  duration: 'PrimitiveInt',
  fps:      'PrimitiveInt',
};

/**
 * LTX-readable phrasing for our `Shot.cameraMove` vocabulary.
 *
 * Deliberately a SEPARATE map from Wan's rather than a shared constant. The
 * column is shared, the dialects are not, and a shared table would quietly force
 * one model's phrasing on the other the first time either needs to diverge. The
 * cost is real and is written down in `Skill(gen-studio-ltx25)` §3: a new
 * `cameraMove` value means editing four maps, not two.
 */
const CAMERA_CLAUSE: Record<string, string> = {
  static:        'the camera holds still',
  locked_off:    'the camera holds still',
  push_in:       'the camera pushes in slowly',
  pull_out:      'the camera pulls back slowly',
  track:         'the camera tracks alongside him',
  track_lateral: 'the camera tracks sideways',
  pan:           'the camera pans slowly',
  pan_left:      'the camera pans slowly to the left',
  pan_right:     'the camera pans slowly to the right',
  tilt_up:       'the camera tilts up slowly',
  tilt_down:     'the camera tilts down slowly',
  handheld:      'the camera drifts faintly as if handheld',
  window_pov:    'the camera holds a fixed view through the window',
  arc_left:      'the camera arcs around him to the left, keeping him centred',
  arc_right:     'the camera arcs around him to the right, keeping him centred',
};

const CAMERA_SECONDARY: Record<string, string> = {
  push_in:       'pushing in slowly',
  pull_out:      'pulling back slowly',
  track:         'tracking alongside him',
  track_lateral: 'tracking sideways',
  pan_left:      'panning to the left',
  pan_right:     'panning to the right',
  tilt_up:       'tilting up',
  tilt_down:     'tilting down',
  arc_left:      'arcing around him to the left',
  arc_right:     'arcing around him to the right',
};

/**
 * The one negation the dialect allows, and it is required rather than tolerated.
 *
 * Lightricks' own guide says to state whether there is music and to write
 * `no music` when an external soundtrack will be laid over the clip. Ours always
 * is — every film scores on ACE-Step — so without this the model writes its own
 * score under every shot and the mix has two.
 *
 * Appended only when absent: the `safecracker` corpus already carries it in all
 * 128 motion prompts, written there before this engine existed, and saying it
 * twice is not better than saying it once.
 */
const NO_MUSIC = 'no music';

/**
 * Snap a dimension the graphs can actually use.
 *
 * The checkpoint wants both dimensions divisible by 32, and the comic panel
 * registry only guarantees 16 — but 32 is not enough here. The i2v graph builds
 * its latent at HALF the requested size (`ComfyMathExpression` "a/2" →
 * `EmptyLTXVLatentVideo`) and doubles it back with `LTXVLatentUpsampler`, so the
 * half must be divisible by 32 as well. 64 satisfies both graphs; 352 would pass
 * for flf2v and silently floor to 320 inside i2v, giving two engines two
 * different frame sizes for the same panel.
 */
function snapSize(n: number): number {
  return Math.max(64, Math.floor(n / 64) * 64);
}

/**
 * Frames the model will actually produce, from the frames we asked for.
 *
 * The checkpoint accepts `n % 8 == 1` up to 121. The graph does not take a frame
 * count at all — it multiplies a duration in SECONDS by the frame rate and adds
 * one — so this returns the duration, and the caller's `length` is only ever a
 * request.
 */
function durationSeconds(length: number, fps: number): number {
  const frames = Math.min(121, Math.max(9, length));
  return Math.max(1, Math.round((frames - 1) / Math.max(1, fps)));
}

export class LtxVideoEngine implements VideoEngine {
  readonly id = 'ltx' as const;
  readonly displayName = 'LTX-2.5 (звук в кадре)';

  // 1024×576 is exact 16:9 AND both dimensions divide by 64 (see `snapSize`) —
  // 1280×720, the template's own default, does not (720 = 64 × 11.25) and gets
  // silently floored. 121 frames @ 24 fps = 5.04 s, the same clip length Wan
  // already delivers at 81 @ 16 fps, so changing engine does not change how the
  // timeline is cut.
  readonly defaults = { width: 1024, height: 576, length: 121, fps: 24 };

  supportsFlow(_flow: VideoFlow): boolean {
    return true;
  }

  workflowFor(mode?: string | null, flow?: VideoFlow): string {
    // `mode` is Wan's fast/cfg/guard axis and has no LTX equivalent: the
    // distilled checkpoint runs one fixed 8-step schedule at cfg 1. Ignored on
    // purpose rather than mapped onto something that merely looks analogous.
    return flow === 'flf2v' ? FLF2V_WORKFLOW : I2V_WORKFLOW;
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
    const wf   = structuredClone(template) as Record<string, any>;
    const flow: VideoFlow = p.endImage ? 'flf2v' : 'i2v';
    const map  = MAPS[flow];

    const expect = (id: string, cls: string, what: string) => {
      if (wf[id]?.class_type !== cls) {
        throw new Error(
          `LTX ${flow}: expected node ${id} (${what}) to be ${cls}, `
          + `found "${wf[id]?.class_type ?? 'nothing'}" — the template was renumbered upstream; `
          + `re-run scripts/_convert_ltx25_template.py and update MAPS in ltx.engine.ts`,
        );
      }
    };
    const set = (id: string, key: string, value: unknown) => { wf[id].inputs[key] = value; };

    for (const [key, cls] of Object.entries(EXPECTED_CLASS)) {
      expect(map[key as keyof typeof EXPECTED_CLASS], cls, key);
    }
    for (const seedId of map.seeds) expect(seedId, 'RandomNoise', 'seed');
    expect(LOAD_FIRST, 'LoadImage', 'first frame');
    expect(SAVE,       'SaveVideo', 'output');
    if (flow === 'flf2v') expect(LOAD_LAST, 'LoadImage', 'last frame');

    const width  = snapSize(p.width);
    const height = snapSize(p.height);

    set(LOAD_FIRST, 'image', p.sourceImage);
    if (p.endImage) set(LOAD_LAST, 'image', p.endImage);

    const prompt = p.motionPrompt.trim();
    set(map.prompt, 'value',
      prompt.toLowerCase().includes(NO_MUSIC) ? prompt : `${prompt}, ${NO_MUSIC}`);
    if (p.motionNegative !== undefined) set(map.negative, 'text', p.motionNegative);

    // The built-in enhancer rewrites a short prompt into a long cinematic one —
    // including its own sound design, which is exactly where the speech we ban
    // (§2.2 of the skill) comes back in. Off, always, and not a setting.
    //
    // It also pays for itself twice: the enhancer branch hangs off a
    // `ComfySwitchNode` whose inputs are lazy, so switching it off means its
    // 9.6 GB `gemma4_e2b_it_bf16` encoder is never loaded at all — which matters
    // on a 16 GB card already holding a 20 GB transformer.
    set(map.enhance, 'value', false);

    set(map.width,    'value', width);
    set(map.height,   'value', height);
    set(map.fps,      'value', p.fps);
    set(map.duration, 'value', durationSeconds(p.length, p.fps));
    for (const seedId of map.seeds) set(seedId, 'noise_seed', p.seed);

    set(SAVE, 'filename_prefix', p.filenamePrefix);
    return wf as WorkflowTemplate;
  }
}
