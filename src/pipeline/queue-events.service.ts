import { Injectable, Logger } from '@nestjs/common';
import { JobType, QueueStatus } from './queue-entry.types';

/**
 * What happened to a queue entry. Coarser than the status field on purpose —
 * the client only needs to know "something moved", not the exact verb.
 */
export type QueueEventOp =
  | 'enqueued'    // a new pending entry exists
  | 'claimed'     // pending → running (work actually started)
  | 'released'    // running → pending (dispatch bailed before starting)
  | 'closed'      // → terminal (THE event: a render/TTS/QC run finished)
  | 'moved'       // one entry reordered
  | 'reordered'   // the whole pending set re-spaced
  | 'prioritized' // a project's priority tier changed
  | 'hello';      // synthetic, sent once per connection (see queue-events.gateway)

/**
 * A queue delta, as broadcast to every connected browser.
 *
 * DELIBERATELY THIN — it carries no rendered data, only the fact that something
 * changed and enough scope ids for a page to decide whether it cares. The client
 * then refetches through the ordinary REST endpoint it already uses, so this
 * wire format never has to grow a copy of a shot / video / job view-model and
 * can't drift out of sync with one. See docs/live-updates.md for the contract.
 */
export interface QueueDeltaEvent {
  /** Monotonic per process. Resets to 0 on restart — a client seeing `seq` go
   *  backwards has reconnected to a restarted backend and should refetch. */
  seq:  number;
  /** ISO timestamp. Informational only; never use it for ordering (use `seq`). */
  at:   string;
  op:   QueueEventOp;
  /** 'bulk' means the ids below are not a single entry — don't key state on
   *  `entryId`, just refetch if the project matches. */
  scope: 'entry' | 'bulk';

  entryId: string | null;
  jobType: JobType | null;
  jobId:   string | null;
  /** Resulting status where one applies (claimed/released/closed). */
  status:  QueueStatus | null;

  // Scope ids, copied straight off the queue entry. A page filters on these.
  // NOTE: there is no propId — `queue_entries` has no such column, so
  // 'prop_anchor' events can only be narrowed to the project. See the doc.
  projectId: string | null;
  shotId:    string | null;
  profileId: string | null;
  segmentId: string | null;
}

/** Fields a caller supplies; `seq` and `at` are stamped here. */
export type QueueDeltaInput = Omit<QueueDeltaEvent, 'seq' | 'at'>;

type Listener = (e: QueueDeltaEvent) => void;

/**
 * The in-process fan-out point between the queue ledger (producer) and the
 * websocket gateway (consumer).
 *
 * Plain listener set rather than RxJS or `@nestjs/event-emitter`: there is
 * exactly one producer class and one consumer, the payload is typed, and neither
 * package is currently a dependency. Nothing here is persisted — a client that
 * missed events while its device slept refetches on wake instead, which is the
 * one recovery path that also covers "the backend restarted while I was away".
 */
@Injectable()
export class QueueEventsService {
  private readonly logger = new Logger(QueueEventsService.name);
  private readonly listeners = new Set<Listener>();
  private seq = 0;

  /** Current sequence number, for a connection greeting. */
  get sequence(): number {
    return this.seq;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  /**
   * Broadcast a delta. Never throws into the caller: an emit is a side effect of
   * a ledger write that has already committed, so a broken listener must not
   * fail the queue transition that produced it.
   */
  emit(input: QueueDeltaInput): void {
    const event: QueueDeltaEvent = { ...input, seq: ++this.seq, at: new Date().toISOString() };
    for (const fn of this.listeners) {
      try { fn(event); }
      catch (e: any) { this.logger.warn(`listener threw: ${e?.message ?? e}`); }
    }
  }
}
