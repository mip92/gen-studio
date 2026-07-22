import { IsBoolean, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

/** Body for POST /projects/:idOrSlug/youtube/upload. */
export class UploadVideoDto {
  /** Absolute path to the final rendered mp4 (user exports it from CapCut). */
  @IsString()
  videoPath!: string;

  /** Absolute path to a thumbnail image (jpg/png, ≤50MB). REQUIRED. */
  @IsString()
  thumbnailPath!: string;

  /** Requested privacy. Google forces `private` until the project is audited.
   *  Ignored when `publishAt` is set (scheduling requires private). */
  @IsOptional()
  @IsIn(['private', 'unlisted', 'public'])
  privacyStatus?: 'private' | 'unlisted' | 'public';

  /** RFC3339 time to auto-publish at (forces private). Only fires post-audit. */
  @IsOptional()
  @IsISO8601()
  publishAt?: string;

  /** Declare AI/altered content (default true — this channel is AI-generated). */
  @IsOptional()
  @IsBoolean()
  containsSyntheticMedia?: boolean;

  /** Playlist id to add the video to (e.g. the «И ЭТО ВСЯ ТВОЯ ЖИЗНЬ» playlist). */
  @IsOptional()
  @IsString()
  playlistId?: string;

  /** YouTube category id (default '24' = Entertainment). */
  @IsOptional()
  @IsString()
  categoryId?: string;

  /** COPPA self-declaration (default false). */
  @IsOptional()
  @IsBoolean()
  madeForKids?: boolean;

  /** Auto-generate + upload subtitles right after the video uploads. */
  @IsOptional()
  @IsBoolean()
  generateCaptions?: boolean;
}
