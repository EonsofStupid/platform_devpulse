# devpulse-gb10-client — DevPulse ↔ Clyffy wire client (SPEC)

**Boundary:** `systems/devpulse-gb10-client/` — Rust crate, DevPulse workspace member.
**Authored:** 2026-07-05. **Pass 1** = this SPEC + the compiling foundation client.
**SSOT for:** how DevPulse connects to headless Clyffy and computes what it may display.

## Architecture context (current truth)

- DevPulse is a **pure client**. **"engine"** is DevPulse's serious local backend;
  **"kernel"** is Clyffy's (the AI layer), which runs **headless on the GB10 cluster** —
  a separate repo (`clyffyos`), separately developed.
- **Turso is the only DB that runs locally** in DevPulse. DuckDB, Surreal, all
  persistence + **all stats** live on the GB10 with Clyffy. DevPulse **displays**
  GB10 stats over this wire; it does **not** compute or store them.
- DevPulse **loads standalone** from Turso (Tier-1). AI + GB10 stats are **additive**,
  lighting up when this client connects — capability **computed**, never hardcoded.
- The AI layer optimizes for **quality / certainty / honesty / transparency, not
  fiscal**. This client never fabricates a capability or a stat; an unreachable
  endpoint is reported honestly as disconnected.

## The contract SSOT

Wire types are owned by **`clyffyos-wire`** (in the `clyffyos` repo):
`EndpointCapability`, `RegisteredEndpoint`, `LoadedSlotSummary`, `SlotStatus`. This
crate **depends on it, re-exports it, and never re-declares it** — one serde
definition, two consumers (`clyffyd` server + this client), no drift
([[feedback_ip_boundary_is_vocabulary_not_wrappers]]).

**Cross-repo link:** path dependency to the sibling checkout
`../../../clyffyos/crates/clyffyos-wire` (resolves against clyffyos's own workspace,
as it lives outside this workspace tree). **Graduation:** switch to a git/published
dependency once `clyffyos` has a remote — the path dep is the pre-release
local-sibling mechanism, not the permanent one.

## Protocol (decided by the contract, not invented)

- **HTTP/JSON.** Capability handshake = `GET {base_url}/v1/capability` →
  `EndpointCapability`.
- **Discovery** = Bonjour/mDNS `_clyffy._tcp.local.`, plus operator-configured static
  URLs (GB10 mode). Endpoints are **discovered or configured — never hardcoded**
  ([[feedback_no_hardcoding_clyffy_agnostic]]).
- **Transports per mode:** local = `http://127.0.0.1:<port>`; network (LAN) =
  `https://<lan-host>:<port>`; gb10 = static `https://<gb10-host>:<port>`. QUIC / local
  UDS are future transport optimizations behind the same client API — not required by
  the contract. TLS backend is `native-tls` (Windows-first); revisit `rustls` at the
  cross-platform phase ([[project_cross_platform_trajectory]]).
- **Mesh:** when Tailscale/Netbird is present, the endpoint URL is just a tailnet address — the
  client needs no special handling; DevPulse joins the mesh and reaches GB10 in the background.
- **Auto-reconnect + offline:** the client re-probes on a backoff when a connection drops, so the
  UI keeps working offline and lights Tier-2 back up seamlessly on recovery. First-run "Not now"
  → offline mode; the user connects/edits the endpoint later in-app
  ([[project_ai_layer_optional_and_indicators]]).

## Capability-computed gating

On connect the client probes `/v1/capability`, stores the returned
`EndpointCapability`, and exposes `ConnectionState`:

- `Disconnected` — no endpoint reachable → DevPulse is standalone (Tier-1, Turso only).
- `Connecting { url }` — probe in flight.
- `Connected { url, capability }` — Tier-2 live; the frontend gates every AI/stat
  surface off `capability.slots`.

`ConnectionState::tier2_available()` drives the **no-AI indicator** (taskbar-icon flash
+ in-platform + in-chat cue — [[project_ai_layer_optional_and_indicators]]): shown while
`Disconnected`, cleared on `Connected`.

## Consumers (wiring — Pass 2)

- **`interfaces/desktop/src-tauri` holds the client — NOT `devpulse-engine`** (revised
  2026-07-05). The engine links the kernel unconditionally (`devpulse-clyffy` = "always
  linked"), so holding this kernel-free client there would weld it to the kernel and
  destroy the isolation this crate exists for (and violate the engine-lite bisect). So:
  `ConnectionState` lives in a dedicated Tauri managed state (`ClyffyConnectionState` in
  `src-tauri/src/state.rs`); a detached probe / auto-reconnect task (`clyffy_probe_loop`
  in `src-tauri/src/lib.rs`) owns the `ClyffyClient` and writes it; the endpoint is read
  from `platform.toml` via `Platform::boot_config().services.system.clyffy`
  (`ClyffyServiceEntry` — `base_url` empty ⇒ standalone, never a hardcoded host).
- `interfaces/desktop/src-tauri` exposes the state as the `connection_status` command +
  the `ClyffyConnectionChanged` event; `platformState.connectionStatus` (today
  `online/offline/hybrid` in `StatusBar.svelte`) reorients to derive from this wire state
  (Pass 2 frontend).
- Stat surfaces (models/slots/etc.) read from the connected capability; disconnected →
  typed "connect Clyffy" (the `commands/sys/vector.rs:28` seam pattern).

## Not this pass (deferred, not retired — [[feedback_deferred_not_retired]])

- mDNS discovery implementation (config-supplied endpoints land first).
- The serving side (`clyffyd`) — built in the `clyffyos` repo; until it answers, only
  the **disconnected** path is runtime-verifiable here.
- The stat-surface repoint + `StatusBar` reorientation (Pass 2).

## Verification

- Pass 1: `cargo check -p devpulse-gb10-client` (isolated — no kernel, no llama.cpp)
  green, warnings addressed.
- Runtime (once wired): a probe against an unreachable URL yields `Disconnected` and the
  no-AI indicator shows; against a live `clyffyd`, `Connected` with real `slots`
  ([[feedback_compile_green_not_enough]]).
