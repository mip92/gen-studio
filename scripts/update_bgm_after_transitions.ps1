# PATCH BGM blocks for A3, A5, A6 after inserting 3 transition shots.
# Same pattern as update_bgm_after_establishing.ps1.

$ErrorActionPreference = 'Stop'
$baseUri   = 'http://localhost:4000'
$projectId = '07881a4a-818f-4a3b-af94-bdf6ebbe03ec'

$env:PGPASSWORD = 'gen_studio'
$rows = & psql -h localhost -U gen_studio -d gen_studio -t -A -F '|' -f 'E:\ComfyUI\tmp_dump.sql' 2>$null

$blockSlugByScene = @{
  'act_03_deep_night' = 'a3_deep_night'
  'act_05_daylight'   = 'a5_daylight'
  'act_06_midpoint'   = 'a6_midpoint'
}

$blocks = Invoke-RestMethod -Method Get -Uri "$baseUri/bgm/projects/$projectId/blocks"
$blockIdBySlug = @{}
foreach ($b in $blocks) { $blockIdBySlug[$b.slug] = $b.id }

foreach ($row in $rows) {
  if (-not $row) { continue }
  $parts = $row -split '\|'
  $sceneKey = $parts[0].Trim()
  if (-not $blockSlugByScene.ContainsKey($sceneKey)) { continue }
  $shotIds = $parts[1] -split ','
  $blockSlug = $blockSlugByScene[$sceneKey]
  $blockId = $blockIdBySlug[$blockSlug]
  if (-not $blockId) { continue }

  $body = @{ shotIds = $shotIds } | ConvertTo-Json -Compress -Depth 10
  Invoke-RestMethod -Method Patch -Uri "$baseUri/bgm/blocks/$blockId" `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) | Out-Null

  $recomp = Invoke-RestMethod -Method Post -Uri "$baseUri/bgm/blocks/$blockId/recompute-target"
  Write-Host ("OK  {0,-14}  shots={1,3}  target={2,4}s" -f $blockSlug, $shotIds.Count, $recomp.targetSeconds)
}
