/**
 * One-off seed: create 5 NarrativeBlocks for the night_courier project, one
 * per scene, with Black Mesa-flavoured mood prompts (dark synthwave +
 * industrial + sci-fi cinematic, instrumental, no vocals). Block targetSeconds
 * is derived from each scene's shots' chosen video durations (BgmService does
 * the same arithmetic when the block is created via the REST endpoint).
 *
 * Run once after the BGM migration is applied:
 *   npx tsx scripts/seed_bgm_night_courier.ts
 *
 * Idempotent: re-running updates moodPrompt + shotIds for existing blocks
 * instead of duplicating rows.
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

const PROJECT_SLUG = 'night_courier';

/**
 * Mood arc: Joel Nielsen's Black Mesa OST shape — intro drone → exploration
 * pulse → industrial combat → dissonant climax → melancholic aftermath. All
 * tags are English (ACE-Step tokenizer requirement, [[feedback_db_english_only]])
 * and explicitly negate vocals at the tag level (defence-in-depth alongside
 * the workflow's anti-vocal negative conditioning node).
 */
const BLOCKS: Array<{
  slug:       string;
  sceneKey:   string;
  title:      string;
  sortOrder:  number;
  moodPrompt: string;
}> = [
  {
    slug:       'start',
    sceneKey:   'scene_01_start',
    title:      'Старт',
    sortOrder:  0,
    moodPrompt:
      // Reference shape: "Anomalous Materials" — calm intro, cold facility hum,
      // distant industrial pulse before anything goes wrong.
      'dark ambient intro, cinematic sci-fi opening, Joel Nielsen Black Mesa Anomalous Materials style, ' +
      'John Carpenter influence, slow brooding tempo 70 bpm, A minor key, sustained low synth drone, ' +
      'analog Moog bass undercurrent, Juno-60 string pad, distant arpeggiated sequencer, ' +
      'cold facility hum, subtle pulse, sparse rim-click percussion, soft industrial machinery texture, ' +
      'wide stereo reverb hall, tape saturation warmth, slow attack, no chord progression yet, ' +
      'anticipation, cinematic tension building from silence, restrained dynamics, ' +
      'instrumental score, no vocals, no singing, no lyrics, no voice, no narration, no dialog',
  },
  {
    slug:       'growth',
    sceneKey:   'scene_02_growth',
    title:      'Рост',
    sortOrder:  1,
    moodPrompt:
      // Reference shape: "Office Complex" / "We Got Hostiles" — propulsive
      // 16th-note arpeggio, motorik four-on-the-floor, building urgency.
      'driving synthwave momentum, urgent 16th-note sequencer arpeggio, Joel Nielsen Black Mesa ' +
      'Office Complex style, John Carpenter Assault on Precinct 13 influence, mid-tempo 100 bpm, ' +
      'F# minor key, motorik four-on-the-floor industrial drums, gated reverb snare, tight kick, ' +
      'closed hi-hat 16ths, propulsive Moog Taurus sub-bass, palm-muted analog lead, ' +
      'detuned saw pad, octave-jumping bassline, gritty Prophet-5 stabs, side-chained pad, ' +
      'rising harmonic tension, modal mixolydian flavour, dystopian retrofuture electronic, ' +
      'analog tape compression, mid-stereo dry mix with reverb sends, hypnotic forward drive, ' +
      'instrumental score, no vocals, no singing, no lyrics, no rap, no human voice',
  },
  {
    slug:       'overload',
    sceneKey:   'scene_03_overload',
    title:      'Перегруз',
    sortOrder:  2,
    moodPrompt:
      // Reference shape: "Surface Tension" / "Forget About Freeman" —
      // heavy distorted industrial combat at peak intensity.
      'aggressive industrial synthwave combat theme, Joel Nielsen Black Mesa Surface Tension style, ' +
      'Forget About Freeman heaviness, fast urgent 120 bpm, D minor key, ' +
      'distorted Moog bass growl, FM bass stab, pounding industrial four-on-the-floor kick, ' +
      'snare with metallic clang reverb, double-time hi-hat, tom rolls, mechanical noise loops, ' +
      'alarm-siren synth lead in minor second intervals, dissonant detuned brass-like saw stab, ' +
      'distorted electric guitar power chords low in the mix, gated metallic percussion, ' +
      'sub-bass pulse on every quarter, danger theme, sci-fi action peak intensity, ' +
      'thick layered production, heavy stereo width, parallel compression, broken radio static, ' +
      'instrumental score, no vocals, no singing, no lyrics, no rap, no shouting, no words',
  },
  {
    slug:       'breakpoint',
    sceneKey:   'scene_04_breakpoint',
    title:      'Срыв',
    sortOrder:  3,
    moodPrompt:
      // Reference shape: Xen tracks ("We Are Not Alone", "Xen, the Other Side")
      // — dissonant alien dread, fractured rhythm, broken harmony.
      'dissonant dark ambient climax, Joel Nielsen Black Mesa Xen alien dread, ' +
      'We Are Not Alone style, fractured tempo around 95 bpm, atonal harmony, ' +
      'detuned microtonal synth drones, screaming bent-pitch lead, prepared-piano-like inside hits, ' +
      'broken industrial percussion, mechanical glitch fills, sudden tom hits with deep reverb, ' +
      'sub-bass earthquake rumble, Mellotron choir-pad (no human voice, just synthesized timbre), ' +
      'reversed-cymbal swells, panicked irregular rhythm, polyrhythmic percussion clusters, ' +
      'wall of distorted reverb, granular delay textures, sci-fi horror climax, dystopian breakdown, ' +
      'cinematic peak crisis, instrumental score only, no vocals, no singing, no lyrics, no human voice, ' +
      'no speech, no chant, no whisper, synthesized timbres only',
  },
  {
    slug:       'aftermath',
    sceneKey:   'scene_05_aftermath',
    title:      'Тишина',
    sortOrder:  4,
    moodPrompt:
      // Reference shape: "Power Down" — slow fade, sparse piano, deep
      // reverb, melancholic resolution.
      'melancholic dark ambient epilogue, Joel Nielsen Black Mesa Power Down style, ' +
      'Vangelis Blade Runner influence, very slow 60 bpm, E minor key, ' +
      'sparse felt piano arpeggio with deep cathedral reverb tail, sustained Juno pad in minor seventh chords, ' +
      'low analog drone underneath, soft kick on downbeat every other bar, brushed snare ghost notes, ' +
      'no busy percussion, deep sub-bass swell, mournful low brass synth, ' +
      'fading distant industrial echo, isolation, cold emptiness, reflective quiet aftermath, ' +
      'long release tails, wide stereo reverb, tape hiss texture, lo-fi warmth, ' +
      'cinematic ending, sustained final chord with slow decay, sense of closure and exhaustion, ' +
      'instrumental score, no vocals, no singing, no lyrics, no human voice, no narration',
  },
];

const DEFAULT_SHOT_SECONDS = 5;

async function main() {
  const project = await prisma.project.findUnique({ where: { slug: PROJECT_SLUG } });
  if (!project) {
    console.error(`Project ${PROJECT_SLUG} not found`);
    process.exit(1);
  }

  for (const b of BLOCKS) {
    const scene = await prisma.scene.findFirst({
      where:   { projectId: project.id, sceneKey: b.sceneKey },
      include: {
        shots: {
          orderBy: { shotCode: 'asc' },
          include: { videoRenders: true },
        },
      },
    });
    if (!scene) {
      console.warn(`  ⚠ scene ${b.sceneKey} not found, skipping block ${b.slug}`);
      continue;
    }

    const shotIds = scene.shots.map((s) => s.id);
    let targetSeconds = 0;
    for (const s of scene.shots) {
      const chosen = s.chosenVideoId
        ? s.videoRenders.find((v) => v.id === s.chosenVideoId)
        : null;
      const params = (chosen?.params ?? null) as null | { length?: number; fps?: number };
      if (params?.length && params?.fps && params.fps > 0) {
        targetSeconds += Math.round(params.length / params.fps);
      } else {
        targetSeconds += DEFAULT_SHOT_SECONDS;
      }
    }

    const existing = await prisma.narrativeBlock.findUnique({
      where: { projectId_slug: { projectId: project.id, slug: b.slug } },
    });
    if (existing) {
      await prisma.narrativeBlock.update({
        where: { id: existing.id },
        data:  {
          title:      b.title,
          sortOrder:  b.sortOrder,
          moodPrompt: b.moodPrompt,
          shotIds:    shotIds as any,
          targetSeconds,
        },
      });
      console.log(`  ✓ updated block "${b.slug}" (${scene.shots.length} shots, ~${targetSeconds}s)`);
    } else {
      await prisma.narrativeBlock.create({
        data: {
          projectId:  project.id,
          slug:       b.slug,
          title:      b.title,
          sortOrder:  b.sortOrder,
          moodPrompt: b.moodPrompt,
          shotIds:    shotIds as any,
          targetSeconds,
          status:     'filling',
        },
      });
      console.log(`  + created block "${b.slug}" (${scene.shots.length} shots, ~${targetSeconds}s)`);
    }
  }

  console.log('\nDone. Next:');
  console.log('  POST /bgm/blocks/<id>/fill?chunkSeconds=60   — populate segments');
  console.log('  POST /bgm/segments/<id>/render               — queue ACE-Step');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
