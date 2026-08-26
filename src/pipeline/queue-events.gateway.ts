import { Logger } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { QueueEventsService, QueueDeltaEvent } from './queue-events.service';

/** Path browsers connect to: ws://<host>:4000/ws/queue */
export const QUEUE_WS_PATH = '/ws/queue';

/**
 * How often the server pings an idle socket. Only reason it exists is dead-peer
 * detection: a browser that lost Wi-Fi mid-roam leaves a half-open TCP socket
 * that never fires 'close'. 30s costs one tiny frame per connection per 30s —
 * on a LAN with no NAT in between, nothing else needs it.
 *
 * The browser closes its own socket when the tab is hidden (see the frontend's
 * lib/liveEvents.tsx), so this never runs against a sleeping tablet.
 */
const PING_MS = 30_000;

/**
 * Broadcast-only websocket for queue deltas.
 *
 * Deliberately NOT a Nest @WebSocketGateway: that route needs
 * @nestjs/websockets + @nestjs/platform-ws + a WsAdapter swap, and buys rooms,
 * namespaces and inbound message routing — none of which this channel has. It
 * has one path, zero inbound messages, and one broadcast. A raw ws.Server
 * attached to the HTTP server Nest already created is the whole thing, and it
 * sits next to the timeout surgery main.ts already does on that same server.
 *
 * Inbound frames are ignored by design. Anything a client wants to say, it says
 * over REST — which keeps this channel unable to mutate state, so an open port
 * on the LAN is not a write surface.
 */
export function attachQueueEventsGateway(server: HttpServer, events: QueueEventsService): WebSocketServer {
  const logger = new Logger('QueueEventsGateway');

  // `noServer: false` + `path` lets ws own the upgrade handshake for just this
  // path; every other upgrade request on the server is left untouched.
  const wss = new WebSocketServer({ server, path: QUEUE_WS_PATH });

  /** Sockets that have answered the most recent ping. */
  const alive = new WeakSet<WebSocket>();

  const send = (ws: WebSocket, payload: unknown): void => {
    if (ws.readyState !== WebSocket.OPEN) return;
    try { ws.send(JSON.stringify(payload)); }
    catch (e: any) { logger.warn(`send failed: ${e?.message ?? e}`); }
  };

  wss.on('connection', (ws, req) => {
    alive.add(ws);
    logger.log(`client connected (${req.socket.remoteAddress ?? '?'}) — ${wss.clients.size} open`);

    // Greeting. `seq` lets a reconnecting client notice the counter went
    // backwards, which means the backend restarted and its cached view is
    // untrustworthy — the client refetches on connect regardless, so this is
    // diagnostic rather than load-bearing.
    send(ws, { op: 'hello', seq: events.sequence, at: new Date().toISOString() });

    ws.on('pong',  () => { alive.add(ws); });
    ws.on('error', (e) => { logger.warn(`socket error: ${e?.message ?? e}`); });
    ws.on('close', () => { logger.log(`client disconnected — ${wss.clients.size - 1} open`); });
  });

  // One subscription for the whole server, fanned out to the open sockets.
  const unsubscribe = events.subscribe((event: QueueDeltaEvent) => {
    for (const ws of wss.clients) send(ws, event);
  });

  const pinger = setInterval(() => {
    for (const ws of wss.clients) {
      if (!alive.has(ws)) { ws.terminate(); continue; }  // missed the last ping — half-open
      alive.delete(ws);
      try { ws.ping(); } catch { ws.terminate(); }
    }
  }, PING_MS);
  // Don't hold the process open on shutdown.
  pinger.unref?.();

  wss.on('close', () => { clearInterval(pinger); unsubscribe(); });

  logger.log(`Queue events websocket on ${QUEUE_WS_PATH} (ping ${PING_MS}ms)`);
  return wss;
}
