/** Self-test for the pure slot planner: `npx tsx src/releases/slot-planner.spec.ts`.
 *  Plain node:assert — the repo has no test runner, and adding one is out of scope. */
import * as assert from 'node:assert/strict';
import { planSlots, slotDayKey, slotIterator, wallTimeToUtc } from './slot-planner';

const TZ = 'Europe/Kyiv';
const take = (n: number, floor: Date, days = [2, 4], hour = 13) => {
  const out: Date[] = [];
  const it = slotIterator({ floor, days, hour, tz: TZ });
  while (out.length < n) out.push(it.next().value as Date);
  return out;
};

// 1. Summer (+03): 13:00 Kyiv = 10:00 UTC.
assert.equal(wallTimeToUtc(2026, 8, 11, 13, TZ).toISOString(), '2026-08-11T10:00:00.000Z');
// 2. Winter (+02): 13:00 Kyiv = 11:00 UTC — the whole reason server-local math was rejected.
assert.equal(wallTimeToUtc(2026, 12, 15, 13, TZ).toISOString(), '2026-12-15T11:00:00.000Z');

// 3. Tue/Thu sequence across a month boundary, floor = Fri 2026-08-28 (Kyiv).
{
  const seq = take(4, new Date('2026-08-28T00:00:00Z'));
  assert.deepEqual(seq.map((d) => slotDayKey(d, TZ)), ['2026-09-01', '2026-09-03', '2026-09-08', '2026-09-10']);
}

// 4. Floor is EXCLUSIVE: at exactly Tue 13:00 the same slot is skipped.
{
  const seq = take(1, new Date('2026-08-11T10:00:00.000Z'));
  assert.equal(slotDayKey(seq[0], TZ), '2026-08-13');
}

// 5. DST flip week (Kyiv leaves summer time 2026-10-25): wall clock stays 13:00.
{
  const seq = take(2, new Date('2026-10-22T23:00:00Z'), [2, 4]);
  assert.deepEqual(seq.map((d) => d.toISOString()), ['2026-10-27T11:00:00.000Z', '2026-10-29T11:00:00.000Z']);
}

// 6. planSlots: busy day skipped, order preserved, no self-collision.
{
  const busy = new Set(['2026-08-11']);
  const plan = planSlots(['a', 'b', 'c'], busy, {
    floor: new Date('2026-08-09T00:00:00Z'), days: [2, 4], hour: 13, tz: TZ,
  });
  assert.deepEqual(
    [...plan.entries()].map(([k, v]) => [k, slotDayKey(v, TZ)]),
    [['a', '2026-08-13'], ['b', '2026-08-18'], ['c', '2026-08-20']],
  );
  assert.equal(busy.size, 4); // assigned keys joined the busy set
}

// 7. Custom grid [1,3,5] — three per week.
{
  const seq = take(3, new Date('2026-08-09T00:00:00Z'), [1, 3, 5]);
  assert.deepEqual(seq.map((d) => slotDayKey(d, TZ)), ['2026-08-10', '2026-08-12', '2026-08-14']);
}

console.log('slot-planner: all assertions passed');
