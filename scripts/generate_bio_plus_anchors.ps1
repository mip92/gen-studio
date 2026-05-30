# Generate 8 anchor portrait references for bio_plus characters via ComfyUI.
# Each anchor becomes the IP-Adapter reference image for that character's
# face-lock across all 200 shots. Uses gen_anchor_portrait_graphic_novel_api.json.
#
# Prerequisites:
#   - gen-studio backend running on http://localhost:4000
#   - ComfyUI running on http://127.0.0.1:8188
#   - Graphic_Novel_Illustration-000007.safetensors in ComfyUI/models/loras/style/
#   - dreamshaperXL_lightningDPMSDE.safetensors in ComfyUI/models/checkpoints/sdxl/
#
# Run:
#   cd E:\ComfyUI\gen-studio\scripts
#   .\generate_bio_plus_anchors.ps1
#
# Outputs:
#   E:\ComfyUI\gen-studio\data\bio_plus\reference\<PROFILE_CODE>_anchor.png

$ErrorActionPreference = "Stop"

$COMFY_URL = "http://127.0.0.1:8188"
$GENSTUDIO_URL = "http://localhost:4000"
$PROJECT_SLUG = "bio_plus"
$WORKFLOW_PATH = "E:\ComfyUI\gen-studio\data\bio_plus\comfy\gen_anchor_portrait_graphic_novel_api.json"
$REFERENCE_DIR = "E:\ComfyUI\gen-studio\data\bio_plus\reference"
$COMFY_OUTPUT_DIR = "E:\ComfyUI\output"

$STYLE_PREFIX = "cinematic graphic novel illustration, illustrated comic book panel, cell-shaded coloring, hard black ink outline with variable line weight, flat color blocks with subtle hatching for shadow, 16:9 cinematic composition, no photorealism, no 3D render, no plastic skin"
$PORTRAIT_COMPOSITION = "three-quarter portrait facing camera, head-and-shoulders framing, neutral pale grey backdrop, soft north-window light, anchor reference portrait"
$ANCHOR_NEGATIVE = "photograph, photorealistic, 3D render, CGI, plastic skin, smooth gradient shading, hyperrealistic, real human face, raytraced, deformed hands, extra fingers, two heads, watermark, text overlay, blurry, low quality, anime, manga, chibi, kawaii, oversaturated color, glamour photography, fashion shoot, full body, multiple people, group photo, profile only, back view"

# 1. Ensure reference dir exists
New-Item -ItemType Directory -Force -Path $REFERENCE_DIR | Out-Null

# 2. Fetch all character profiles for bio_plus
Write-Host "Fetching bio_plus character profiles..."
$projectsResp = Invoke-RestMethod -Uri "$GENSTUDIO_URL/projects" -Method Get
$project = $projectsResp | Where-Object { $_.slug -eq $PROJECT_SLUG } | Select-Object -First 1
if (-not $project) { throw "Project '$PROJECT_SLUG' not found via gen-studio API" }

$charsResp = Invoke-RestMethod -Uri "$GENSTUDIO_URL/projects/$($project.id)/characters" -Method Get
$profiles = @()
foreach ($char in $charsResp) {
    foreach ($prof in $char.profiles) {
        if ($prof.promptBase -and $prof.promptBase.Trim().Length -gt 0) {
            $profiles += [PSCustomObject]@{
                ProfileId   = $prof.id
                ProfileCode = $prof.profileCode
                CharCode    = $char.code
                PromptBase  = $prof.promptBase
                Negative    = if ($prof.negative) { $prof.negative } else { $ANCHOR_NEGATIVE }
            }
        }
    }
}
Write-Host "Found $($profiles.Count) profiles to generate anchors for:"
$profiles | ForEach-Object { Write-Host "  - $($_.ProfileCode) (char $($_.CharCode))" }

# 3. Load workflow template
$workflowTemplate = Get-Content -Path $WORKFLOW_PATH -Raw

# 4. For each profile: build prompt, send to ComfyUI, wait, copy result
foreach ($p in $profiles) {
    $anchorPath = Join-Path $REFERENCE_DIR "$($p.ProfileCode)_anchor.png"
    if (Test-Path $anchorPath) {
        Write-Host "[$($p.ProfileCode)] anchor exists, skipping (delete file to regenerate)"
        continue
    }

    Write-Host ""
    Write-Host "[$($p.ProfileCode)] generating anchor..."

    # Build positive prompt: style + portrait composition + character identity
    $positive = "$STYLE_PREFIX, $PORTRAIT_COMPOSITION, $($p.PromptBase)"
    $negative = if ($p.Negative) { $p.Negative } else { $ANCHOR_NEGATIVE }

    # Clone workflow + fill in fields
    $wf = $workflowTemplate | ConvertFrom-Json -Depth 32 -AsHashtable
    $wf["3"].inputs.text = $positive
    $wf["4"].inputs.text = $negative
    $wf["6"].inputs.seed = Get-Random -Maximum 2147483647
    $wf["8"].inputs.filename_prefix = "anchor_$($p.ProfileCode)"

    $payload = @{ prompt = $wf } | ConvertTo-Json -Depth 32 -Compress

    # Queue prompt
    $queueResp = Invoke-RestMethod -Method Post -Uri "$COMFY_URL/prompt" -ContentType "application/json" -Body $payload
    $promptId = $queueResp.prompt_id
    Write-Host "  queued: prompt_id=$promptId"

    # Poll history until done (max 5 min per anchor)
    $deadline = (Get-Date).AddMinutes(5)
    $done = $false
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 2
        try {
            $history = Invoke-RestMethod -Uri "$COMFY_URL/history/$promptId" -Method Get
            if ($history.$promptId -and $history.$promptId.outputs) {
                $outputs = $history.$promptId.outputs
                $node8 = $outputs."8"
                if ($node8 -and $node8.images -and $node8.images.Count -gt 0) {
                    $img = $node8.images[0]
                    $srcPath = Join-Path $COMFY_OUTPUT_DIR $img.filename
                    if (Test-Path $srcPath) {
                        Copy-Item -Path $srcPath -Destination $anchorPath -Force
                        Write-Host "  saved: $anchorPath"
                        $done = $true
                        break
                    }
                }
            }
        } catch {
            # 404 or transient — keep polling
        }
    }
    if (-not $done) {
        Write-Warning "[$($p.ProfileCode)] timeout waiting for ComfyUI output. Check Comfy UI history manually."
    }
}

Write-Host ""
Write-Host "Done. Anchor portraits in $REFERENCE_DIR :"
Get-ChildItem -Path $REFERENCE_DIR -Filter "*_anchor.png" | ForEach-Object {
    Write-Host "  $($_.Name)  $([math]::Round($_.Length / 1KB, 1)) KB"
}
