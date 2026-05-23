# Create 8 BGM NarrativeBlocks for last_shift (one per act = transitions only
# between acts, as user requested).
# Uses gen-studio REST API: POST /bgm/projects/:projectId/blocks
# Style: minimalist Nils Frahm / Ólafur Arnalds / Sigur Rós ambient
# (anti-Black Mesa industrial — last_shift is depressive drama, not action).

$ErrorActionPreference = 'Stop'
$baseUri = 'http://localhost:4000'

$csv = Get-Content -Encoding UTF8 'E:\ComfyUI\tmp_acts.csv'

# Mood prompts per act, ACE-Step tags, English-only.
# Each ends with explicit no-vocals tail (defence-in-depth alongside the
# negative conditioning node in the workflow).
$blocks = @(
  @{ sceneKey='act_01_boarding'; slug='a1_boarding'; title='A1 — Boarding'; sortOrder=0;
     moodPrompt='slow ambient introduction, soft felt piano single notes, low sub-bass drone undercurrent, distant brushed snare rim clicks, warm tape saturation, melancholy autumn evening mood, 60 bpm, A minor, Nils Frahm Spaces influence, sodium lamp atmosphere, restrained dynamics, instrumental score, no vocals, no singing, no lyrics, no human voice' },
  @{ sceneKey='act_02_settling'; slug='a2_settling'; title='A2 — Settling'; sortOrder=1;
     moodPrompt='hushed ambient nocturne, sustained Mellotron string pad, sparse upright piano motif, deep sub bass pulse, soft tape hiss, restrained melancholy, 55 bpm, D minor, Ólafur Arnalds Re:member influence, train motion sway, sleep silence, instrumental score, no vocals, no singing, no lyrics, no human voice' },
  @{ sceneKey='act_03_deep_night'; slug='a3_deep_night'; title='A3 — Deep Night'; sortOrder=2;
     moodPrompt='tender lullaby motif, hushed felt piano with sustain pedal, soft solo cello melody, gentle music box texture, breath-like ambient pad, mother and child intimacy, bridal solitude, 50 bpm, F minor, Sigur Rós Heima influence, vulnerable hush, instrumental score, no vocals, no singing, no lyrics, no human voice' },
  @{ sceneKey='act_04_pre_dawn'; slug='a4_pre_dawn'; title='A4 — Pre-dawn'; sortOrder=3;
     moodPrompt='minimalist solo piano study, simple repeating motif slowly building, glassy harmonics, soft ambient drone underneath, tentative hopeful mood, first light, 65 bpm, C major, Nils Frahm Solo influence, comic relief lifting into hope, instrumental score, no vocals, no singing, no lyrics, no human voice' },
  @{ sceneKey='act_05_daylight'; slug='a5_daylight'; title='A5 — Daylight'; sortOrder=4;
     moodPrompt='warm cinematic minimalism, gentle motorik pulse, layered string section legato, soft piano counterpoint, light brushed snare four-on-the-floor, reconciliation warmth, 70 bpm, G major, Max Richter On the Nature of Daylight influence, birch trees strobing past, instrumental score, no vocals, no singing, no choir, no lyrics' },
  @{ sceneKey='act_06_midpoint'; slug='a6_midpoint'; title='A6 — Midpoint'; sortOrder=5;
     moodPrompt='slow rising emotional minimalism, fingerpicked acoustic guitar arpeggio, glistening synth pads, sub-bass swell, distant bowed cello held note, moment of recognition and quiet grief, 60 bpm, A minor with brief major lift, Ólafur Arnalds Saman influence, golden late afternoon, instrumental score, no vocals, no singing, no lyrics' },
  @{ sceneKey='act_07_crisis'; slug='a7_crisis'; title='A7 — Crisis'; sortOrder=6;
     moodPrompt='propulsive minimalism crescendo, urgent sixteenth-note arpeggiated felt piano, prepared piano inside-hits dissonance, dissonant bowed cello clusters, deep sub-bass drone building, soft industrial percussion ticks, tension building toward release, snowstorm intensity, 80 bpm, D minor, Hildur Guðnadóttir Joker influence, decisive crescendo, instrumental score, no vocals, no singing, no lyrics' },
  @{ sceneKey='act_08_resolution'; slug='a8_resolution'; title='A8 — Resolution'; sortOrder=7;
     moodPrompt='ethereal release ambient, sustained warm synth pads in major key, synthesized female-pad-like timbre (synth pad only, no actual human voice), glassy bell tones, warm tape saturation, slow fade-out tail, peace and freedom, morning fog atmosphere, 50 bpm, C major resolving from prior D minor, Sigur Rós Untitled #3 influence, instrumental score, no vocals, no singing, no choir, no lyrics, no human voice' }
)

# Build shotIds lookup from CSV
$shotIdsByScene = @{}
$projectId = $null
foreach ($line in $csv) {
  if (-not $line) { continue }
  $parts = $line -split '\|'
  if ($parts.Count -lt 3) { continue }
  $shotIdsByScene[$parts[0]] = ($parts[1] -split ',')
  $projectId = $parts[2]
}

Write-Host "Project ID: $projectId"
Write-Host ""

foreach ($b in $blocks) {
  $shotIds = $shotIdsByScene[$b.sceneKey]
  if (-not $shotIds) { Write-Warning "no shot IDs for $($b.sceneKey)"; continue }

  $body = @{
    slug       = $b.slug
    title      = $b.title
    sortOrder  = $b.sortOrder
    moodPrompt = $b.moodPrompt
    shotIds    = $shotIds
  } | ConvertTo-Json -Compress -Depth 10

  $uri = "$baseUri/bgm/projects/$projectId/blocks"
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $uri -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Host ("OK  {0,-12}  shots={1,3}  target={2,4}s  id={3}" -f $b.slug, $shotIds.Count, $resp.targetSeconds, $resp.id)
  } catch {
    Write-Host ("ERR {0,-12}  {1}" -f $b.slug, $_.Exception.Message) -ForegroundColor Red
    if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message -ForegroundColor DarkRed }
  }
}
