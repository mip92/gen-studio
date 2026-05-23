# Recover orphan ComfyUI_*.png files for completed dataset jobs whose REFINED
# outputs (nodes 400 + 399) were saved with default "ComfyUI" prefix before
# strategy fix. Attribution by mtime window per job (UTC -> +3h Kiev local).

$ErrorActionPreference = 'Stop'
$comfyOutput  = 'E:\ComfyUI\output'
$projectRoot  = 'E:\ComfyUI\gen-studio\data\last_shift'

$env:PGPASSWORD = 'gen_studio'
$jobsCsv = & psql -h localhost -U gen_studio -d gen_studio -t -A -F '|' -f 'E:\ComfyUI\tmp_jobs.sql'

foreach ($line in $jobsCsv) {
  if (-not $line) { continue }
  $parts = $line -split '\|'
  $profileCode  = $parts[0].Trim()
  $triggerToken = $parts[1].Trim()
  # SQL already converts to local TZ via "AT TIME ZONE 'UTC'", so no extra +3h here
  $startLocal   = [DateTime]::ParseExact($parts[2].Trim(), 'yyyy-MM-dd HH:mm:ss', $null)
  $endLocal     = [DateTime]::ParseExact($parts[3].Trim(), 'yyyy-MM-dd HH:mm:ss', $null).AddMinutes(5)

  $subsetDir = Join-Path $projectRoot "datasets\$profileCode\img\10_$triggerToken"
  if (-not (Test-Path $subsetDir)) {
    Write-Host "skip $profileCode (no subset dir: $subsetDir)" -ForegroundColor Yellow
    continue
  }

  $existing = Get-ChildItem $subsetDir -Filter "*.png" -File
  $nextN = 0
  foreach ($f in $existing) {
    if ($f.BaseName -match "_(\d+)_$") {
      $n = [int]$matches[1]
      if ($n -gt $nextN) { $nextN = $n }
    }
  }

  $orphans = Get-ChildItem $comfyOutput -Filter "ComfyUI_*.png" -File |
    Where-Object { $_.LastWriteTime -ge $startLocal -and $_.LastWriteTime -le $endLocal -and $_.Length -ge 50000 } |
    Sort-Object LastWriteTime

  if ($orphans.Count -eq 0) {
    Write-Host "$profileCode  no orphans in window" -ForegroundColor Yellow
    continue
  }

  $moved = 0
  foreach ($o in $orphans) {
    $nextN++
    $padded = $nextN.ToString('D5')
    $newName = $profileCode + '_' + $padded + '_.png'
    $dest = Join-Path $subsetDir $newName
    Move-Item $o.FullName $dest
    $moved++
  }
  $msg = $profileCode + '  recovered=' + $moved + '  start=' + $startLocal.ToString('HH:mm') + '  end=' + $endLocal.ToString('HH:mm')
  Write-Host $msg
}

Write-Host ''
Write-Host '=== Final dataset counts ==='
$datasetsRoot = Join-Path $projectRoot 'datasets'
Get-ChildItem $datasetsRoot -Directory | ForEach-Object {
  $profDir = $_
  $imgDir = Join-Path $profDir.FullName 'img'
  if (Test-Path $imgDir) {
    Get-ChildItem $imgDir -Directory | ForEach-Object {
      $sd = $_
      $count = (Get-ChildItem $sd.FullName -Filter '*.png' -File).Count
      $line = '  ' + $profDir.Name.PadRight(15) + ' ' + $sd.Name.PadRight(25) + ' ' + $count.ToString().PadLeft(4) + ' files'
      Write-Host $line
    }
  }
}
