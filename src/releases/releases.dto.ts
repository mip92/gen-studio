import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SetReleaseDto {
  /** ISO-8601 instant WITH zone designator (…Z / ±hh:mm), or null to clear.
   *  Zoneless strings are rejected in the service — the DB stores UTC instants
   *  and a bare local string would silently shift by the server's zone. */
  @IsOptional() @IsISO8601() releaseAt?: string | null;
}

export class AutoPlanDto {
  /** Project ids or slugs in the desired release order (чередование бэклога и
   *  свежих фильмов задаётся именно этим порядком — никакого флага fresh нет). */
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) order!: string[];
  /** Planning floor (ISO instant). Default: now. Slots are strictly after it. */
  @IsOptional() @IsISO8601() startFrom?: string;
  /** ISO weekdays 1..7 carrying a slot. Default [2, 4] — вт/чт, 2 релиза в неделю. */
  @IsOptional() @IsArray() @ArrayMaxSize(7) @IsInt({ each: true }) @Min(1, { each: true }) @Max(7, { each: true }) days?: number[];
  /** Channel wall-clock hour. Default 16 (фактическое время публикаций канала). */
  @IsOptional() @IsInt() @Min(0) @Max(23) hour?: number;
}

export class BackfillDto {
  /** true = report the diff without writing anything. */
  @IsOptional() @IsBoolean() dryRun?: boolean;
}
