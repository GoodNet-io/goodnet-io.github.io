// Live counter demo wiring.
//
// Goal: when two browser tabs hit the same goodnetd via the
// handler-web-api-proxy WS gateway, a "++" press in either tab bumps a
// shared counter visible in both. The gateway routes the `counter.inc`
// frame as a normal gnet envelope on a loopback link.
//
// Reality v0.1: the gateway-side handler answers every JSON-RPC method
// with "not implemented in v0.1 skeleton". So this module:
//   1. Tries to open a real WS to the daemon and surfaces status
//      (peer pubkey / latency / conn id when available).
//   2. Falls back to a same-origin BroadcastChannel between tabs when
//      the RPC is unavailable, so the *shape* of the demo (two tabs,
//      shared counter, sub/pub) still works for the visitor.
//   3. Shows a "no daemon" hint with copy-paste instructions.

import { GoodnetClient } from "./vendor/goodnet-js";

type StatusState = "idle" | "connecting" | "connected" | "error" | "fallback";

interface DemoElements {
  url: HTMLInputElement;
  connectBtn: HTMLButtonElement;
  disconnectBtn: HTMLButtonElement;
  statusDot: HTMLElement;
  statusText: HTMLElement;
  peerPubkey: HTMLElement;
  latency: HTMLElement;
  connId: HTMLElement;
  counterValue: HTMLElement;
  counterBump: HTMLButtonElement;
}

const MSG_ID_COUNTER = 0x0901;
const COUNTER_KEY = "goodnet-demo-counter";
const BCAST_NAME = "goodnet-demo-counter";

interface CounterEvent {
  type: "inc";
  delta: number;
  origin: string;
  ts: number;
}

export function mountDemo(root: ParentNode = document): () => void {
  const picked = pickElements(root);
  if (!picked) {
    console.warn("[goodnet-demo] required DOM elements missing — skipping mount");
    return () => undefined;
  }
  const el: DemoElements = picked;

  let client: GoodnetClient | null = null;
  let connId: number | null = null;
  let bcast: BroadcastChannel | null = null;
  let pingTimer: number | null = null;
  const origin =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  let counter = readStoredCounter();
  renderCounter(el, counter);

  // Cross-tab fallback channel — always live, so two tabs sync even
  // before (or after) any daemon RPC succeeds.
  if (typeof BroadcastChannel !== "undefined") {
    bcast = new BroadcastChannel(BCAST_NAME);
    bcast.onmessage = (ev) => {
      const msg = ev.data as CounterEvent | null;
      if (!msg || msg.origin === origin || msg.type !== "inc") return;
      counter += msg.delta;
      writeStoredCounter(counter);
      renderCounter(el, counter);
    };
  }
  // React to storage events too (Safari, second-window-after-load case).
  window.addEventListener("storage", (ev) => {
    if (ev.key !== COUNTER_KEY || ev.newValue == null) return;
    const next = parseInt(ev.newValue, 10);
    if (Number.isFinite(next) && next !== counter) {
      counter = next;
      renderCounter(el, counter);
    }
  });

  // Bump button — local effect first, then try to round-trip through
  // the daemon if a connection is up.
  el.counterBump.addEventListener("click", () => {
    counter += 1;
    writeStoredCounter(counter);
    renderCounter(el, counter);
    publishLocal({ type: "inc", delta: 1, origin, ts: Date.now() });
    if (client && connId !== null) {
      const frame = new TextEncoder().encode(
        JSON.stringify({ type: "inc", delta: 1, origin }),
      );
      client.send(connId, MSG_ID_COUNTER, frame).catch((err) => {
        // v0.1: gateway stub responds with "not implemented"; treat as
        // a fallback signal but don't blow up the user-facing demo.
        console.debug("[goodnet-demo] send failed (expected on v0.1):", err);
      });
    }
  });

  el.connectBtn.addEventListener("click", () => {
    void connect();
  });
  el.disconnectBtn.addEventListener("click", () => {
    void disconnect();
  });
  el.url.addEventListener("keydown", (ev) => {
    if ((ev as KeyboardEvent).key === "Enter") void connect();
  });

  setStatus("idle", "Not connected. Press Connect to dial the daemon.");

  async function connect(): Promise<void> {
    if (client) return;
    const url = el.url.value.trim() || "ws://localhost:9100";
    setStatus("connecting", `Dialling ${url}…`);
    el.connectBtn.disabled = true;
    try {
      client = await GoodnetClient.create({ url });
    } catch (err) {
      client = null;
      el.connectBtn.disabled = false;
      setStatus(
        "error",
        `Could not reach ${url} — falling back to in-browser cross-tab sync.`,
      );
      setFallbackStats();
      return;
    }
    el.disconnectBtn.disabled = false;
    setStatus("connected", `Connected to ${url}.`);

    // Try to open a loopback connection through the gateway. v0.1
    // returns "not implemented" so we tolerate the error and stay in
    // fallback mode for the round-trip, while keeping the WS open.
    try {
      const r = await client.connect("ipc:///run/goodnet/demo.sock");
      connId = r.conn_id;
      el.peerPubkey.textContent = shortenKey(r.peer_pubkey);
      el.connId.textContent = String(r.conn_id);
      subscribeCounter(client, r.conn_id);
    } catch (err) {
      el.peerPubkey.textContent = "(gateway v0.1 stub)";
      el.connId.textContent = "—";
      console.debug("[goodnet-demo] core.connect not yet implemented:", err);
    }

    startLatencyPings(client);
  }

  async function disconnect(): Promise<void> {
    el.disconnectBtn.disabled = true;
    el.connectBtn.disabled = false;
    if (pingTimer != null) {
      window.clearInterval(pingTimer);
      pingTimer = null;
    }
    if (client) {
      try {
        if (connId !== null) await client.disconnect(connId);
      } catch {
        /* ignore */
      }
      try {
        client.close();
      } catch {
        /* ignore */
      }
    }
    client = null;
    connId = null;
    el.peerPubkey.textContent = "—";
    el.latency.textContent = "—";
    el.connId.textContent = "—";
    setStatus("idle", "Disconnected.");
  }

  function subscribeCounter(c: GoodnetClient, id: number): void {
    try {
      c.subscribe(id, MSG_ID_COUNTER, (payload) => {
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload)) as CounterEvent;
          if (msg.origin === origin) return;
          counter += msg.delta ?? 1;
          writeStoredCounter(counter);
          renderCounter(el, counter);
        } catch {
          /* ignore malformed */
        }
      });
    } catch (err) {
      console.debug("[goodnet-demo] subscribe failed:", err);
    }
  }

  function startLatencyPings(c: GoodnetClient): void {
    const tick = async () => {
      const t0 = performance.now();
      try {
        // `core.ping` is a v0.1 stub but the round trip through the WS
        // still gives us a useful real-world latency number.
        await (c as unknown as { call: (m: string, p: unknown) => Promise<unknown> }).call(
          "core.ping",
          {},
        );
      } catch {
        /* expected — fall through and still report timing */
      }
      const dt = performance.now() - t0;
      el.latency.textContent = `${dt.toFixed(1)} ms`;
    };
    void tick();
    pingTimer = window.setInterval(tick, 2000);
  }

  function setStatus(state: StatusState, text: string): void {
    el.statusDot.dataset.state = state;
    el.statusText.textContent = text;
  }

  function setFallbackStats(): void {
    el.peerPubkey.textContent = "(local fallback)";
    el.latency.textContent = "—";
    el.connId.textContent = "BroadcastChannel";
  }

  function publishLocal(ev: CounterEvent): void {
    if (bcast) bcast.postMessage(ev);
  }

  return () => {
    void disconnect();
    if (bcast) bcast.close();
  };
}

function pickElements(root: ParentNode): DemoElements | null {
  const url = root.querySelector<HTMLInputElement>("#ws-url");
  const connectBtn = root.querySelector<HTMLButtonElement>("#ws-connect");
  const disconnectBtn = root.querySelector<HTMLButtonElement>("#ws-disconnect");
  const statusDot = root.querySelector<HTMLElement>("#status-dot");
  const statusText = root.querySelector<HTMLElement>("#status-text");
  const peerPubkey = root.querySelector<HTMLElement>("#peer-pubkey");
  const latency = root.querySelector<HTMLElement>("#latency");
  const connId = root.querySelector<HTMLElement>("#conn-id");
  const counterValue = root.querySelector<HTMLElement>("#counter-value");
  const counterBump = root.querySelector<HTMLButtonElement>("#counter-bump");
  if (
    !url ||
    !connectBtn ||
    !disconnectBtn ||
    !statusDot ||
    !statusText ||
    !peerPubkey ||
    !latency ||
    !connId ||
    !counterValue ||
    !counterBump
  ) {
    return null;
  }
  return {
    url,
    connectBtn,
    disconnectBtn,
    statusDot,
    statusText,
    peerPubkey,
    latency,
    connId,
    counterValue,
    counterBump,
  };
}

function renderCounter(el: DemoElements, value: number): void {
  el.counterValue.textContent = String(value);
}

function readStoredCounter(): number {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeStoredCounter(value: number): void {
  try {
    localStorage.setItem(COUNTER_KEY, String(value));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function shortenKey(key: string): string {
  if (key.length <= 16) return key;
  return `${key.slice(0, 8)}…${key.slice(-6)}`;
}
