# Cutover: unified queue + render ledger

One maintenance window. The backend must be **stopped** for it, because
`queue_entries` becomes the only thing the dispatcher reads and it has to contain
the current queue before anything starts dispatching again.

State this was written against: ~38k historical job rows, ~1500 jobs queued
(199 video, 381 tts, 910 post-pass), one GPU.

---

## 0. Before you start

Nothing here touches existing rows destructively. The migration only adds one
table and two columns; the backfill only inserts into the new table. There is no
point at which existing render data is rewritten or deleted.

Have two terminals ready: one for the commands, one to watch the backend log
afterwards.

## 1. Stop the backend

```
# whatever you normally use to stop the nest process
```

Also stop the frontend if it is a prod build (it gets rebuilt in step 6).

**Do not** stop ComfyUI. If it is mid-prompt, that prompt survives: on boot the
new recovery pass asks ComfyUI whether each interrupted prompt is still queued,
running, or already finished, and leaves the survivors alone for the pollers to
harvest. Only genuinely dead work is failed.

## 2. Apply the migration

```
cd W:\Programs\ComfyUI\gen-studio
npx prisma migrate deploy
```

Expect: `20260725_add_queue_entries` applied. It is additive
(`CREATE TABLE queue_entries`, `ALTER TABLE projects ADD COLUMN queuePriorityTier`,
`ADD COLUMN queuePrioritizedAt`, six indexes, two partial unique indexes).

Verify the two invariant indexes exist — they are what makes double-dispatch
impossible, and Prisma's DSL cannot express them, so they only exist because the
migration SQL is hand-written:

```
psql -h localhost -U gen_studio -d gen_studio -c "\d queue_entries" | findstr /i "one_running one_live_per_job"
```

## 3. Regenerate the Prisma client

```
npx prisma generate
```

Migrate before generate, per the usual rule here.

## 4. Backfill the ledger — **do not skip, do not half-finish**

Dry run first (writes nothing, prints what it would do):

```
npx tsx scripts/backfill_queue_entries.ts --dry-run
```

Then for real:

```
npx tsx scripts/backfill_queue_entries.ts
```

Expect roughly: `written: ~38000`, plus a line reporting how many hours of real
elapsed time were recovered.

**This step is load-bearing.** The dispatcher selects work exclusively from
`queue_entries`. If the backend starts while that table is empty or partial, the
~1500 already-queued jobs are invisible to it — the GPU simply sits idle, with no
error in the log. The script is idempotent, so the fix is to re-run it and
restart; but check the count before moving on rather than discovering it later.

Sanity check the live queue landed:

```
psql -h localhost -U gen_studio -d gen_studio -c "SELECT status, count(*) FROM queue_entries GROUP BY status ORDER BY 2 DESC;"
psql -h localhost -U gen_studio -d gen_studio -c "SELECT \"jobType\", count(*) FROM queue_entries WHERE status='pending' GROUP BY 1 ORDER BY 2 DESC;"
```

`pending` should be ~1500 and its per-type split should match what the old queue
showed: ~910 `video_post`, ~381 `tts`, ~199 `video`.

## 5. Build and start the backend

```
npm run build
npm run start:prod    # or however you normally start it
```

Watch the log for:

- `Pipeline queue started (poll 5000ms)`
- possibly `Boot: N job(s) still alive in ComfyUI — left running for the pollers`
  and/or `Boot: failed N interrupted job(s)` — both are expected after a stop
- then `Dispatching <type> <id> — <label> [<groupKey>]` within ~5 s

If the log is silent and no job is dispatched, the queue is empty from the
dispatcher's point of view → go back to step 4.

## 6. Rebuild the frontend

```
cd W:\Programs\ComfyUI\gen-studio-ui
npm run build
# restart the Next server
```

Required: the queue API changed shape (`entryId`/`jobId`/`label`/`context`) and
new routes were added, so a stale prod build will show a broken queue page.

## 7. Verify

- `/queue` → rows have a `#` position, drag a pending row onto another and confirm
  the order changes and `queuedAt` does **not**
- `⚑ проект` on a row → that project's whole backlog jumps ahead; press again to
  release
- cancel a pending job → it stays visible with status `cancelled`, and its
  elapsed time shows up in the project's "Впустую"
- `/projects/<id>` → "Реально потрачено на фильм" and "Сколько осталось" are
  populated; the waste breakdown names reasons (failures, re-renders, QC
  rejections, deletions)
- watch the log over a few dispatches: consecutive jobs should share a `groupKey`
  (batching), and the batch should break after at most 20 of them or 15 minutes
  of the head waiting

## Rollback

Restore the previous build and start it. The old code reads the job tables
directly and ignores `queue_entries`, so it picks the queue up where it was —
`queuedAt` was never rewritten by the new code, so the old FIFO order is intact.
Leave the new table and columns in place; they are inert to the old build.

## Two things that are permanently unknowable

- **Failed video renders from before this change are gone.** A boot sweep
  hard-deleted every `status='failed'` VideoRender on every restart, so the
  historical video defect rate is a lower bound. Everything recorded from the
  cutover forward is exact. The stats endpoint reports this in `caveats`.
- **Post-pass retries before the cutover left no trace** — a re-run overwrote its
  own columns. Those entries are flagged `historyTruncated`.
