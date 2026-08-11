import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { createReadStream, statSync } from 'fs';
import { CharactersService } from './characters.service';
import { AnchorRenderService } from './anchor-render.service';
import { AnchorValidationService } from '../validation/anchor-validation.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly chars:  CharactersService,
    private readonly anchor: AnchorRenderService,
    private readonly anchorVal: AnchorValidationService,
  ) {}

  @Get(':profileId')
  @ApiOperation({ summary: 'Get a character profile by id (with character + project)' })
  findOne(@Param('profileId') profileId: string) {
    return this.chars.findProfileById(profileId);
  }

  @Get(':profileId/summary')
  @ApiOperation({
    summary: 'Per-profile readiness summary (dataset count, LoRA, last jobs, phase)',
    description: 'Project-independent. Drives the persona detail page (/characters/:profileId) without any project context.',
  })
  summary(@Param('profileId') profileId: string) {
    return this.chars.profileSummary(profileId);
  }

  @Patch(':profileId')
  @ApiOperation({ summary: 'Update editable profile fields (prompts, age, target, trigger)' })
  update(@Param('profileId') profileId: string, @Body() dto: UpdateProfileDto) {
    return this.chars.updateProfile(profileId, dto as Record<string, unknown>);
  }

  @Get(':profileId/loras')
  @ApiOperation({ summary: 'Rescan + list LoRA variants for this profile (final + epochs)' })
  listLoras(@Param('profileId') profileId: string) {
    return this.chars.listLoras(profileId);
  }

  @Post(':profileId/loras/active')
  @ApiOperation({ summary: 'Mark one LoRA variant as the default (sets profile.loraPath)' })
  setActiveLora(
    @Param('profileId') profileId: string,
    @Body() body: { filename?: string },
  ) {
    if (!body?.filename) throw new BadRequestException('filename is required');
    return this.chars.setActiveLora(profileId, body.filename);
  }

  @Delete(':profileId/loras/:filename')
  @ApiOperation({ summary: 'Delete a LoRA variant (file + DB list); repoints active if needed' })
  deleteLora(
    @Param('profileId') profileId: string,
    @Param('filename')  filename:  string,
  ) {
    return this.chars.deleteLora(profileId, filename);
  }

  // ── Anchor inheritance (derived profiles: same person, aged/changed) ───────

  @Get(':profileId/base-profile')
  @ApiOperation({
    summary: 'Base-profile link of this profile + selectable sibling profiles',
    description: 'A profile with a base link renders its anchor as a Qwen-Image-Edit of the base profile\'s '
      + 'anchor ("the same person, matching this profile\'s promptBase") so age/state variants keep the face. '
      + 'Options list the character\'s other profiles with their anchor status.',
  })
  getBaseProfile(@Param('profileId') profileId: string) {
    return this.anchor.getBaseProfileInfo(profileId);
  }

  @Get(':profileId/chain')
  @ApiOperation({
    summary: 'Anchor-inheritance chain of this profile\'s character, in story-time order',
    description: 'One entry per state: age (+ where the age came from), base link, whether the anchor is '
      + 'installed, how many shots reference it, and whether an anchor render is allowed right now '
      + '(canRenderAnchor / blockedReason — a derived state cannot render before its donor is approved). '
      + '`chainLinked: false` means the states are still unlinked and would render as unrelated faces.',
  })
  getChain(@Param('profileId') profileId: string) {
    return this.anchor.getProfileChain(profileId);
  }

  @Post(':profileId/link-chain')
  @ApiOperation({
    summary: 'Link this profile\'s character into an age-ordered inheritance chain',
    description: 'Orders the character\'s profiles by ageLabel (first integer; code suffix only when the '
      + 'label has no digits) and points each state at the previous one. `dryRun` returns the plan; '
      + '`overwrite: false` (default) fills only empty links so a hand-tuned chain survives. '
      + 'Links ONLY — nothing is rendered, no existing anchor is invalidated.',
  })
  async linkChain(
    @Param('profileId') profileId: string,
    @Body() body: { dryRun?: boolean; overwrite?: boolean },
  ) {
    const profile = await this.chars.findProfileById(profileId);
    return this.anchor.linkChainForCharacter(profile.characterId, {
      dryRun:    body?.dryRun    === true,
      overwrite: body?.overwrite === true,
    });
  }

  @Patch(':profileId/base-profile')
  @ApiOperation({
    summary: 'Set or clear the base-profile link (baseProfileId: uuid | null)',
    description: 'Base must be another profile of the SAME character; self-links and cycles are rejected. '
      + 'Clearing (null) returns the profile to independent text-to-image anchor rendering.',
  })
  setBaseProfile(
    @Param('profileId') profileId: string,
    @Body() body: { baseProfileId?: string | null },
  ) {
    const v = body?.baseProfileId;
    if (v !== null && v !== undefined && typeof v !== 'string') {
      throw new BadRequestException('baseProfileId must be a profile uuid or null');
    }
    return this.anchor.setBaseProfile(profileId, (v ?? null) as string | null);
  }

  // ── Anchor portrait (cartoon-style identity) ───────────────────────────────

  @Post(':profileId/generate-anchor')
  @ApiOperation({
    summary: 'Queue anchor portrait render for a character profile',
    description:
      'Enqueues an anchor-render job (anchor_render_jobs table). PipelineQueueService '
      + 'picks it up on the next tick (5s), auto-starts ComfyUI if not running, '
      + 'submits to the project\'s anchor workflow, polls for completion, and '
      + 'copies the resulting PNG into data/<projectSlug>/reference/<profileCode>_anchor.png. '
      + 'Returns the new job row immediately — UI polls GET /profiles/:id/anchor-jobs '
      + 'or GET /profiles/:id/anchor to learn completion status. Cartoon-style identity '
      + 'pipeline only (graphic_novel_cell_shaded etc.); photoreal projects use character-LoRA.',
  })
  async generateAnchor(@Param('profileId') profileId: string) {
    return this.anchor.enqueue(profileId);
  }

  @Get(':profileId/anchor-jobs')
  @ApiOperation({
    summary: 'List anchor-render jobs for a profile (newest first, 50 max)',
    description: 'UI polls this to learn job status — pending / running / completed / failed.',
  })
  async listAnchorJobs(@Param('profileId') profileId: string) {
    return this.anchor.list(profileId);
  }

  // ── Anchor NEURAL VALIDATION (Ollama vision QC of the anchor candidates) ─────

  @Get(':profileId/anchor-validation-jobs')
  @ApiOperation({
    summary: 'List anchor-validation jobs (vision QC of anchor candidates), newest first',
    description: 'Each completed job holds per-candidate verdicts (score / matchesPrompt / severe / anime issues) '
      + 'and either chosenFilename (installed as the anchor) or a suggestedPrompt when nothing passed.',
  })
  listAnchorValidationJobs(@Param('profileId') profileId: string) {
    return this.anchorVal.list(profileId);
  }

  @Post(':profileId/validate-anchor')
  @ApiOperation({
    summary: 'Re-run vision validation over the anchor candidates on disk',
    description: 'Scores the candidate portraits against the character identity spec, HARD-rejects anime, '
      + 'and installs the best clean portrait as the anchor. Queued (ComfyUI stopped during scoring). '
      + 'No-op with a reason if there are no candidates on disk yet.',
  })
  validateAnchor(@Param('profileId') profileId: string) {
    return this.anchorVal.revalidate(profileId);
  }

  @Post(':profileId/apply-suggested-anchor-prompt')
  @ApiOperation({
    summary: 'Apply an improved promptBase (from anchor validation) to the profile; optionally re-render',
    description: 'When validation found no acceptable portrait it proposes a better promptBase. The user '
      + 'reviews/edits it and applies it here — it is written to CharacterProfile.promptBase. With '
      + 'rerender=true, a fresh anchor render is queued using the new promptBase.',
  })
  async applySuggestedAnchorPrompt(
    @Param('profileId') profileId: string,
    @Body() body: { prompt?: string; rerender?: boolean },
  ) {
    const prompt = (body?.prompt ?? '').trim();
    if (!prompt) throw new BadRequestException('prompt is required');
    const profile = await this.chars.updateProfile(profileId, { promptBase: prompt });
    const rerenderJob = body?.rerender ? await this.anchor.enqueue(profileId) : null;
    return { profile, rerenderJob };
  }

  @Get(':profileId/anchor')
  @ApiOperation({
    summary: 'Get anchor portrait path for a profile (if it exists)',
    description: 'Returns null if no anchor has been generated yet. Path is absolute on disk.',
  })
  async getAnchor(@Param('profileId') profileId: string) {
    const p = await this.anchor.getAnchorPath(profileId);
    return { profileId, anchorPath: p, exists: p !== null };
  }

  // ── Anchor CANDIDATES (best-of-N gallery + manual selection) ────────────────

  @Get(':profileId/anchor-candidates')
  @ApiOperation({
    summary: 'List anchor candidate portraits with validation verdicts and current selection',
    description: 'Every portrait the last anchor render produced (reference/_candidates/<code>/), each merged with '
      + 'its vision-QC verdict (score / issues / severe / anime), the validator\'s own pick (chosenByAI) and the '
      + 'currently installed anchor (selected, by content hash). The user reviews this gallery and can install '
      + 'any candidate via POST /profiles/:id/anchor/select.',
  })
  listAnchorCandidates(@Param('profileId') profileId: string) {
    return this.anchor.listCandidates(profileId);
  }

  @Get(':profileId/anchor-candidates/:filename/raw')
  @ApiOperation({
    summary: 'Stream one anchor candidate image (for <img src=...>)',
  })
  async getAnchorCandidateRaw(
    @Param('profileId') profileId: string,
    @Param('filename')  filename:  string,
    @Res()              res:       Response,
  ) {
    const p = await this.anchor.getCandidatePath(profileId, filename);
    const stat = statSync(p);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', stat.size);
    // Candidates are immutable per render batch (re-render replaces the dir),
    // so a longer client cache is safe; the UI keys by filename anyway.
    res.setHeader('Cache-Control', 'private, max-age=300');
    createReadStream(p).pipe(res);
  }

  @Post(':profileId/anchor/select')
  @ApiOperation({
    summary: 'Manually install one anchor candidate as the profile anchor',
    description: 'The user\'s override of the validator\'s automatic pick: copies the candidate portrait over '
      + 'data/<slug>/reference/<profileCode>_anchor.png. The gallery recomputes "selected" by content hash.',
  })
  async selectAnchorCandidate(
    @Param('profileId') profileId: string,
    @Body() body: { filename?: string },
  ) {
    const filename = (body?.filename ?? '').trim();
    if (!filename) throw new BadRequestException('filename is required');
    return this.anchor.selectCandidate(profileId, filename);
  }

  @Post(':profileId/anchor/approve')
  @ApiOperation({
    summary: 'Approve the installed anchor portrait',
    description:
      "The vision validator installs its own pick as soon as a render finishes, so an installed "
      + 'anchor.png only means the machine produced one. This is the user signing off on it. '
      + 'Until it is called the profile shows up on /actions as approve_anchor, every shot the '
      + 'character appears in refuses to render, and derived age-states stay blocked. '
      + 'Picking a candidate via /anchor/select or uploading a file approves implicitly.',
  })
  approveAnchor(@Param('profileId') profileId: string) {
    return this.anchor.approveAnchor(profileId);
  }

  @Delete(':profileId/anchor')
  @ApiOperation({
    summary: 'Delete the anchor portrait PNG for this profile',
    description:
      'Removes the anchor file from data/<slug>/reference/. Returns the deleted '
      + 'paths. Idempotent — safe to call when no anchor exists (returns empty list).',
  })
  async deleteAnchor(@Param('profileId') profileId: string) {
    const deleted = await this.anchor.deleteAnchor(profileId);
    return { profileId, deleted, count: deleted.length };
  }

  @Get(':profileId/anchor/raw')
  @ApiOperation({
    summary: 'Stream the anchor PNG file (for <img src=...>)',
    description: '200 + image/png stream on success; 404 if no anchor generated yet.',
  })
  async getAnchorRaw(
    @Param('profileId') profileId: string,
    @Res()              res:       Response,
  ) {
    const p = await this.anchor.getAnchorPath(profileId);
    if (!p) throw new NotFoundException(`No anchor for profile ${profileId}`);
    const stat = statSync(p);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', stat.size);
    // Short cache — anchor can be regenerated; UI cache-busts with mtime query.
    res.setHeader('Cache-Control', 'private, max-age=10');
    createReadStream(p).pipe(res);
  }

  @Post(':profileId/upload-anchor')
  @ApiOperation({
    summary: 'Upload an externally-supplied anchor portrait (PNG/JPG) for a profile',
    description:
      'Stores the uploaded file as data/<slug>/reference/<profileCode>_anchor.png, '
      + 'overwriting any existing anchor. Use this when you already have a portrait '
      + '(from a photo shoot, Nano Banana, or any other source) and prefer not to '
      + 'regenerate via ComfyUI. multipart/form-data, field name "file", max 10 MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAnchor(
    @Param('profileId') profileId: string,
    @UploadedFile()     file:      Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('field "file" is required (multipart/form-data)');
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) throw new BadRequestException(`file too large (${file.size}); max ${MAX}`);
    const anchorPath = await this.anchor.uploadAnchor(profileId, file.buffer);
    return { profileId, anchorPath, sizeBytes: file.size };
  }

  @Get(':profileId/style-readiness')
  @ApiOperation({
    summary: 'Per-style identity-asset readiness for a profile',
    description:
      'Returns readiness flag + asset paths for EACH registered visual style. '
      + 'Photoreal styles need a trained LoRA (loraPath); cartoon styles need '
      + 'an anchor portrait PNG (anchorPath). UI uses this to badge characters '
      + 'with "photoreal-ready / cartoon-ready / neither" indicators and to '
      + 'route the user to the right generate-button. See docs/VISUAL_STYLE_ARCHITECTURE.md.',
  })
  async styleReadiness(@Param('profileId') profileId: string) {
    return this.anchor.getStyleReadiness(profileId);
  }
}
