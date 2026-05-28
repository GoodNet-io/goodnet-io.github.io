// Repository catalogue for the org page repo grid.
//
// Mirrors `gh repo list GoodNet-io` as of the page build. Each entry
// shows up as a card linking to its GitHub repo.

export interface RepoEntry {
  readonly name: string;
  readonly description: string;
  readonly group: RepoGroup;
}

export type RepoGroup =
  | "kernel"
  | "link"
  | "security"
  | "handler"
  | "strategy"
  | "bridge"
  | "tools"
  | "org";

export const REPOS: readonly RepoEntry[] = [
  {
    name: "goodnet",
    description:
      "Kernel, SDK, baseline plugins. One binary + a keypair join two nodes end-to-end.",
    group: "kernel",
  },
  {
    name: "protocol-raw",
    description:
      "Raw-v1 protocol layer — extracted protocol-gnet sibling for low-level frame injection.",
    group: "kernel",
  },
  {
    name: "goodnetd",
    description:
      "Operator daemon + multicall CLI: run, config validate, identity gen, quickstart.",
    group: "tools",
  },
  {
    name: "gssh",
    description:
      "Native SSH-2.0 server + client — peer-pubkey identity, libssh wire, gn.handler-ext channel.",
    group: "tools",
  },
  {
    name: ".github",
    description: "Community health files for the GoodNet organisation.",
    group: "org",
  },
  {
    name: "manifesto",
    description:
      "Manifesto about integrators as a form of architectural resistance to infrastructure enclosure.",
    group: "org",
  },

  // links
  {
    name: "link-tcp",
    description:
      "TCP transport plugin — listen / dial, tcp:// URI scheme, per-conn shutdown ordering.",
    group: "link",
  },
  {
    name: "link-udp",
    description: "UDP datagram transport plugin.",
    group: "link",
  },
  {
    name: "link-ws",
    description: "WebSocket transport plugin.",
    group: "link",
  },
  {
    name: "link-tls",
    description:
      "TLS-over-TCP transport plugin (Apache-2.0 for OpenSSL compatibility).",
    group: "link",
  },
  {
    name: "link-ipc",
    description: "AF_UNIX SOCK_STREAM transport plugin.",
    group: "link",
  },
  {
    name: "link-quic",
    description:
      "QUIC transport plugin — OpenSSL 3.6 native QUIC over UDP or ICE.",
    group: "link",
  },
  {
    name: "link-ice",
    description:
      "ICE NAT-traversal link — RFC 8445 FSM + STUN + TURN + Trickle ICE + mDNS.",
    group: "link",
  },
  {
    name: "link-ws-inject",
    description:
      "WebSocket inject link — injects raw frames into a running ws:// carrier session.",
    group: "link",
  },
  {
    name: "link-portmap",
    description:
      "NAT port-mapping link — NAT-PMP / PCP / UPnP IGD external address discovery for ICE.",
    group: "link",
  },

  // security
  {
    name: "security-noise",
    description: "Noise XX security provider plugin.",
    group: "security",
  },
  {
    name: "security-null",
    description: "Loopback / IntraNode pass-through security provider.",
    group: "security",
  },
  {
    name: "security-pkcs11",
    description:
      "Hardware key store — PKCS#11 backend (YubiKey, SoftHSM, enterprise HSMs).",
    group: "security",
  },

  // handlers
  {
    name: "handler-heartbeat",
    description:
      "Two-way liveness check between peers — RTT and observed-address samples.",
    group: "handler",
  },
  {
    name: "handler-dns",
    description:
      "Real DNS handler — typed RR storage on gn.handler.store + 3-tier resolver cascade.",
    group: "handler",
  },
  {
    name: "handler-store",
    description:
      "Distributed key-value store — STORE_* wire dispatcher + gn.store vtable (Memory + SQLite).",
    group: "handler",
  },
  {
    name: "handler-web-api-proxy",
    description:
      "Browser-gateway plugin — WS endpoint, JSON-RPC over gnet envelopes.",
    group: "handler",
  },
  {
    name: "handler-mycelium",
    description:
      "Mycelium overlay routing handler — subnet-addressed messaging over the Mycelium network.",
    group: "handler",
  },
  {
    name: "handler-zstd-decompress",
    description:
      "Streaming zstd decompression handler — transparent payload decompression on ingress.",
    group: "handler",
  },

  // strategy
  {
    name: "strategy-float-send-rtt",
    description:
      "RTT-optimal multi-path strategy — picks min-RTT conn with EWMA smoothing.",
    group: "strategy",
  },

  // bridges
  {
    name: "bridges-cpp",
    description: "C++ bindings for the GoodNet kernel via sdk/core.h.",
    group: "bridge",
  },
  {
    name: "bridges-js",
    description:
      "JS/TS client — WS thin client now, full kernel WASM in the browser (v0.3).",
    group: "bridge",
  },
  {
    name: "bridges-python",
    description: "Python bindings via sdk/core.h (cffi ABI mode).",
    group: "bridge",
  },
  {
    name: "bridges-rust",
    description:
      "Rust bindings via sdk/core.h (goodnet-sys + safe goodnet crate).",
    group: "bridge",
  },
];

export function repoUrl(name: string): string {
  return `https://github.com/GoodNet-io/${name}`;
}

export function groupLabel(group: RepoGroup): string {
  switch (group) {
    case "kernel":
      return "kernel";
    case "link":
      return "transport";
    case "security":
      return "security";
    case "handler":
      return "handler";
    case "strategy":
      return "strategy";
    case "bridge":
      return "bridge";
    case "tools":
      return "tools";
    case "org":
      return "org";
  }
}
