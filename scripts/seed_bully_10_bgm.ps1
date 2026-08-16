# =============================================================================
# «Тот, кого они слушались» (bully) — BGM blocks, one per act.
#
# Captions carry NO tempo, NO key and NO time signature: ACE-Step 1.5 appends the
# metas to the prompt as their own labelled block, so a caption that states its
# own bpm contradicts them and a 0.6B planner commits to neither — the documented
# cause of «битый ритм» across 369 of 385 previously seeded blocks. The numbers go
# on the block fields, which the render service reads.
#
# Each caption also carries exactly ONE percussion carrier (or states «no
# percussion»): two competing pulses is the other half of the same defect.
#
# Bodies go out as UTF-8 BYTES, not as a string — PowerShell 5.1 mangles Cyrillic
# titles otherwise (the block titles are Russian; the captions are English-only
# because that is what the encoder reads).
#
# Creates blocks and fills them with empty segments. Renders NOTHING: the gap
# between tag wording and sonic result is large, so the user hears one take per
# mood before anything is bulk-queued.
# =============================================================================

$ErrorActionPreference = 'Stop'
$api = 'http://localhost:4000'

$project = (Invoke-RestMethod "$api/projects") | Where-Object { $_.slug -eq 'bully' }
if (-not $project) { throw 'project "bully" not found' }
$scenes = (Invoke-RestMethod "$api/projects/$($project.id)/scenes").scenes

# sceneKey -> ordered shot ids
$byAct = @{}
foreach ($s in $scenes) { $byAct[$s.sceneKey] = @($s.shots | ForEach-Object { $_.id }) }

$blocks = @(
  @{ act='A1'; slug='bgm_act1'; title='Акт 1 — Сверло'; bpm=92; keyscale='A minor';
     mood='dry procedural minimalism, one clock-like woodblock pulse, prepared piano notes struck sparsely, low bowed double bass, muted metallic room tone, tension that is handled rather than felt, cold workshop light, dry close reverb, instrumental, no vocals' },

  @{ act='A2'; slug='bgm_act2'; title='Акт 2 — Оргстекло'; bpm=68; keyscale='F major';
     mood='warm domestic minimalism, no percussion, felt piano played softly, celesta figures above it, sustained string pad underneath, the fragile pride of something made by hand, lamplight on a small desk, intimate close-mic, instrumental, no vocals' },

  @{ act='A3'; slug='bgm_act3'; title='Акт 3 — Прозвище'; bpm=104; keyscale='A minor';
     mood='minimal repetitive motif, steady muted marimba pulse, dry electric piano chords, sustained string pad behind them, a small thing spreading faster than anyone decided, corridor light in bands, dry close reverb, instrumental, no vocals' },

  @{ act='A4'; slug='bgm_act4'; title='Акт 4 — Портфель'; bpm=60; keyscale='D minor';
     mood='sparse chamber stillness, no percussion, solo cello held on long bowed notes, low sustained strings beneath it, a single struck piano note left to decay, the weight of a room that will not speak, grey window light, hall reverb, instrumental, no vocals' },

  @{ act='A5'; slug='bgm_act5'; title='Акт 5 — Котельная'; bpm=48; keyscale='Eb minor';
     mood='dark ambient cinematic drone, no beat, bowed double bass drone, faint metallic scrape, distant low brass swell, cold dread while nothing visibly happens, frozen brick and soot, wide cold reverb, instrumental, no vocals' },

  @{ act='A6'; slug='bgm_act6'; title='Акт 6 — Возврат'; bpm=76; keyscale='Bb major';
     mood='hesitant warm minimalism, no percussion, fingerpicked acoustic guitar, felt piano answering it, soft string pad rising once, a small mercy that does not hold, late winter daylight, warm analogue production, instrumental, no vocals' },

  @{ act='A7'; slug='bgm_act7'; title='Акт 7 — Оргстекло ломается'; bpm=54; keyscale='G minor';
     mood='inexorable orchestral swell, no percussion, tight string cluster building without release, low piano struck once and held, faint cello underneath, something breaking that cannot be taken back, hard corridor light, wide hall reverb, instrumental, no vocals' },

  @{ act='A8'; slug='bgm_act8'; title='Акт 8 — Тридцать лет'; bpm=72; keyscale='F# minor';
     mood='hollow detuned piano, no percussion, tape hiss under the notes, muted trumpet far back, sustained low pad, thirty years that resolved into nothing, warm hall light against a cold street, warm analogue production, instrumental, no vocals' },

  @{ act='A9'; slug='bgm_final'; title='Финал — Ящик'; bpm=50; keyscale='D minor';
     mood='neoclassical chamber close, no percussion, solo cello on long bowed notes, felt piano struck slowly, sustained low drone fading under them, quiet work done too late to matter, one lamp in a dark space, intimate close-mic, instrumental, no vocals' }
)

$i = 0
foreach ($b in $blocks) {
  $i++
  $ids = $byAct[$b.act]
  if (-not $ids -or $ids.Count -eq 0) { throw "no shots found for act $($b.act)" }

  $payload = @{
    slug          = $b.slug
    title         = $b.title
    sortOrder     = $i
    moodPrompt    = $b.mood
    bpm           = $b.bpm
    keyscale      = $b.keyscale
    timesignature = '4'
    shotIds       = $ids
  } | ConvertTo-Json -Depth 5 -Compress

  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $block = Invoke-RestMethod -Uri "$api/bgm/projects/$($project.id)/blocks" -Method Post `
             -Body $bytes -ContentType 'application/json; charset=utf-8'

  # Empty segments only — no GPU work happens here.
  $filled = Invoke-RestMethod -Uri "$api/bgm/blocks/$($block.id)/fill" -Method Post

  "$($b.act)  $($b.slug)  shots=$($ids.Count)  target=$($block.targetSeconds)s  segments=$(@($filled.segments).Count)"
}
