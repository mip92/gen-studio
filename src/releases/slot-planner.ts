/**
 * Pure slot arithmetic for the release calendar. Zero Nest/Prisma imports —
 * unit-testable with `npx tsx src/releases/slot-planner.spec.ts`.
 *
 * The one rule everything below serves: "13:00" is a CHANNEL WALL-CLOCK fact
 * in an IANA timezone (RELEASE_TZ, default Europe/Kyiv), while the DB stores
 * UTC instants. Server-local time is never consulted — the host's zone is an
 * accident, and Kyiv flips +02/+03 with DST, so a fixed offset would drift an
 * hour every season. All calendar walking happens on wall DATES; conversion
 * to an instant happens once per candidate via `wallTimeToUtc`.
 */

export interface SlotParams {
  /** Candidates must be strictly AFTER this instant (planning never lands in the past). */
  floor: Date;
  /** ISO weekdays 1=Mon..7=Sun that carry a slot. Default [2, 4] — вт/чт, 2 релиза в неделю. */
  days: number[];
  /** Channel wall-clock hour of the slot. Default 16 — фактическое время публикаций
   *  канала (в Data API оно видно как 13:0xZ, это UTC; user 2026-08-07: «я в 16:00 релижу»). */
  hour: number;
  /** IANA timezone of the channel wall clock. */
  tz: string;
}

export const DEFAULT_DAYS = [2, 4];
export const DEFAULT_HOUR = 16;
export const DEFAULT_TZ = process.env.RELEASE_TZ ?? 'Europe/Kyiv';

/** What a given UTC instant reads as on the wall clock of `tz`. */
function wallClockOf(instant: Date, tz: string): { y: number; m: number; d: number; hh: number; mm: number; ss: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(instant).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute, ss: +p.second };
}

/** Zone offset (ms to ADD to a UTC instant to get its wall reading) at `instant`. */
function tzOffsetMs(instant: Date, tz: string): number {
  const w = wallClockOf(instant, tz);
  return Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss) - instant.getTime();
}

/**
 * Wall time (y-m-d hour:00 in tz) → UTC instant. Two-pass: guess the instant as
 * if the offset were zero, measure the real offset at the guess, correct, then
 * measure once more — the second pass absorbs a DST boundary sitting between
 * the guess and the answer (a 13:00 slot is never inside the skipped hour, so
 * two passes converge).
 */
export function wallTimeToUtc(y: number, m: number, d: number, hour: number, tz: string): Date {
  const naive = Date.UTC(y, m - 1, d, hour, 0, 0);
  let ts = naive - tzOffsetMs(new Date(naive), tz);
  ts = naive - tzOffsetMs(new Date(ts), tz);
  return new Date(ts);
}

/**
 * Channel-local calendar date ('2026-08-11') of a UTC instant — the granularity
 * at which slots collide: the channel releases at most one video per wall day,
 * and day keys keep "occupied" robust to legacy rows carrying odd times.
 */
export function slotDayKey(instant: Date, tz: string): string {
  const w = wallClockOf(instant, tz);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${w.y}-${p(w.m)}-${p(w.d)}`;
}

/** ISO weekday 1..7 of a pure wall date (calendar math — no zone involved). */
function isoWeekday(y: number, m: number, d: number): number {
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/**
 * Endless ascending generator of candidate slot instants. Walks the channel's
 * wall calendar day by day (calendar +1, THEN converts — never Date mutators on
 * an instant, which is where DST bugs live), yields days whose weekday is in
 * `days`, skipping anything at or before `floor`.
 */
export function* slotIterator(p: SlotParams): Generator<Date> {
  const days = p.days.length ? p.days : DEFAULT_DAYS;
  let { y, m, d } = wallClockOf(p.floor, p.tz);
  for (;;) {
    if (days.includes(isoWeekday(y, m, d))) {
      const instant = wallTimeToUtc(y, m, d, p.hour, p.tz);
      if (instant.getTime() > p.floor.getTime()) yield instant;
    }
    // Calendar +1 day, normalized through Date.UTC (pure date arithmetic).
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    y = next.getUTCFullYear(); m = next.getUTCMonth() + 1; d = next.getUTCDate();
  }
}

/**
 * Assign one slot per item in the given order, skipping day-keys in `busy`.
 * Newly assigned keys join `busy` immediately, so two items in one call can
 * never collide. `busy` is mutated on purpose — the caller's set stays the
 * single source of "occupied" across a whole planning run.
 */
export function planSlots(items: string[], busy: Set<string>, p: SlotParams): Map<string, Date> {
  const out = new Map<string, Date>();
  const iter = slotIterator(p);
  for (const item of items) {
    for (;;) {
      const slot = iter.next().value as Date;
      const key = slotDayKey(slot, p.tz);
      if (!busy.has(key)) {
        busy.add(key);
        out.set(item, slot);
        break;
      }
    }
  }
  return out;
}
