# devpulse-gb10-client — DevPulse ↔ Clyffy wire client (SPEC)

**Boundary:** `systems/devpulse-gb10-client/` — Rust crate, DevPulse workspace member.
**Authored:** 2026-07-05. **Updated 2026-07-08** — Pass 2 shipped (runtime re-point,
persistence, decided boot gate, three-surface indicator, capability-computed
surfaces); the kernel cut landed (no kernel crates exist in this workspace).
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

**Tier-2 capability DTOs** (grown as the desktop command surface repointed to this
wire): the same crate owns the shapes each connection-gated Tier-2 command returns —
`GrammarSnapshot` + `GrammarKind` / `GrammarStatus` / `GrammarFailure`
(structured-output control), `RroStateSnapshot` + `RroState` / `RroDepth` /
`RroStateTransition` (reasoning state), `ThoughtRecord` (connectome governance graph),
`MemoryKind` (intelligence-store save), and `SwapStats` (Burn encoder hot-swap). Each is
re-exported here and consumed by a gated command in
`interfaces/desktop/src-tauri/src/commands/*`: disconnected → typed "connect Clyffy",
connected-but-unserved → typed "endpoint pending" (deferred, not retired — the `clyffyd`
`/v1/*` endpoints that fill them are built in `clyffyos`
[[feedback_deferred_not_retired]]).

**Cross-repo link (graduated 2026-07-07):** `clyffyos-wire` is a **pinned git
dependency** on `github.com/EonsofStupid/clyffyos` — DevPulse builds on a clean
checkout with no sibling clone on disk. CI fetches the private repo via the
`CLYFFYOS_DEPLOY_TOKEN` insteadOf rewrite (same pattern as rro/telemetry). Bump
the pinned rev deliberately when the wire contract evolves.

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

## Consumers (SHIPPED — Pass 2, 2026-07-07/08)

- **`interfaces/desktop/src-tauri` holds the client — NOT `devpulse-engine`.** The
  connection is the desktop app's concern (it drives app-level UI state, the boot
  gate, and the wizard); the engine stays a pure local backend. Concretely:
  - `ClyffyConnectionState` (managed state, `src-tauri/src/state.rs`) holds the
    live `ConnectionState` + a shared `ArcSwapOption<String>` endpoint.
  - `clyffy_probe_loop` (`src-tauri/src/lib.rs`) re-reads that endpoint **each
    tick** — `connect_clyffy(url)` / `disconnect_clyffy()` re-point it at runtime
    with no restart. The probe loop touches no disk.
  - Commands: `connection_status`, `connect_clyffy`, `disconnect_clyffy`,
    `is_clyffy_setup_decided`, `skip_clyffy_setup`; live event
    `ClyffyConnectionChanged`.
- **Frontend SSOT:** the `clyffyConnection` rune
  (`src/lib/domains/clyffy/status/connection.state.svelte.ts`) — ref-counted
  subscribe (one-shot `connection_status` catch-up + the live event), getters
  `state` / `tier` (`tier1|tier2`) / `tier2Available` / `endpointUrl` /
  `capability` / `slots` / `slotFor(slot_id)`. Every surface parses THIS source.
- **Shipped consumers:** StatusBar both-state badge + endpoint-metadata chip
  (`kind vX · sha`); TopBar + chat-window absence-only chips (three-surface no-AI
  indicator); the wizard's `EndpointView` (Local/GB10 address entry →
  `connectClyffy`); cortex anatomy tiles (light from `capability.slots` via wire
  matchers); the capability browser (`resolveCapabilities(slots)` — availability
  is a pure function of what's served).

## Persistence + boot gate (SHIPPED 2026-07-08)

- **Record:** `{data_dir}/user/clyffy_connection.toml` —
  `ClyffyConnectionRecord { endpoint: Option<String>, setup_decided: bool }`,
  atomic temp-write + rename (`src-tauri/src/connection_store.rs`). Corrupt or
  absent ⇒ undecided standalone, never a boot error.
- **Writes:** `connect_clyffy` persists `{endpoint, decided}` on success;
  `disconnect_clyffy` persists `{None, decided}`; `skip_clyffy_setup` sets
  `decided` and leaves any prior endpoint untouched. A persistence failure warns
  but never undoes the live re-point (the operator's intent already applied).
- **Boot seed priority:** the persisted record (when `setup_decided`) **wins over**
  `platform.toml`'s `services.system.clyffy.base_url` — an explicit disconnect
  stays standalone even if config names an endpoint. No record ⇒ config fallback
  ⇒ empty = standalone.
- **Boot gate (two-stage):** `BootOverlay` auto-opens the wizard **on the endpoint
  step, only while `!is_clyffy_setup_decided`**. Skip/connect decide it once;
  re-entry = the TopBar standalone chip (opens the wizard on the endpoint step).
- **Signals:** every transition emits structured tracing under the
  **`clyffy.connection`** target (replayable via
  `query_scoped_log("clyffy.connection", …)`), paired with the
  `ClyffyConnectionChanged` typed event ([[feedback_dual_observability]]).

## Not this pass (deferred, not retired — [[feedback_deferred_not_retired]])

- ~~mDNS discovery implementation~~ **LANDED 2026-07-11** — the turnkey
  candidate ladder lives desktop-side in
  `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` (persisted /
  configured / localhost / mDNS `_clyffy._tcp.local.` / tailscale mesh
  peers → bounded parallel `probe_capability`). The operator overrode
  "GB10 stays typed-in by design": link-local mDNS still cannot cross a
  mesh, but mesh peers are ENUMERATED via `tailscale status --json` and
  verified by the same handshake. This crate stays the thin wire —
  discovery orchestration is the desktop app's concern.
- The serving side (`clyffyd`) — built in the `clyffyos` repo; until it answers,
  only the **disconnected** path is runtime-verifiable here.
- A devtool connect tile (`clyffy/providers/connect`) — the UI consumer for
  `disconnect_clyffy`.

## Verification

- `cargo check -p devpulse-gb10-client` green (kernel-free by construction — the
  workspace contains no kernel crates; `verify-ip-boundary` enforces it).
- `connection_store` unit tests (atomic roundtrip; absent-file = undecided).
- Runtime matrix: `.claude/plans/devpulse-standalone-connect.md` §R — standalone
  boot, skip persistence, relaunch gate, unreachable-connect honesty, re-entry.
  Against a live `clyffyd`: `Connected` with real `slots`
  ([[feedback_compile_green_not_enough]]).
