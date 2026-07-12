# DevPulse Architecture

DevPulse is a layered Rust + SvelteKit application: two local layers, one
direction of dependency, no cycles — plus one **wire** to the AI layer,
which is Clyffy's and lives in a separate repo
(`github.com/EonsofStupid/clyffyos`).

```
┌──────────────────────────────────────────────────────────────┐
│ interfaces/desktop  — Tauri shell, SvelteKit UI              │
│ (consumes typed bindings; all logic lives Rust-side)         │
└──────────────────────────────────────────────────────────────┘
                                ▲
                                │ tauri-specta IPC
                                │ (typed via bindings.ts)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ systems/devpulse-engine — DevPulse's core backend            │
│  • Service lifecycle (boot, health, shutdown)                │
│  • TOML config loader                                        │
│  • Model MANAGEMENT (platform/model_loader: registry,       │
│    slots, downloads, hardware probe — no inference)          │
│  • Knowledge content (platform/knowledge, include_str SSOT)  │
│  • Vocabulary translation (ip_term!, signals.registry.yaml)  │
│  • Local stores via devpulse-store (Turso SSOT + DuckDB)     │
└──────────────────────────────────────────────────────────────┘
                                ▲
                                │ devpulse-gb10-client (HTTP/JSON)
                                │ GET {base_url}/v1/capability
                                ▼
        ═══════════ the wire — repo boundary ═══════════
┌──────────────────────────────────────────────────────────────┐
│ Clyffy (clyffyos repo) — headless AI layer, NOT in this repo │
│  connectome kernel · inference runtimes · RRD daemon ·       │
│  SurrealDB/qortex/AI analytics — advertised via              │
│  EndpointCapability{kind, version, build_sha, slots[]}       │
└──────────────────────────────────────────────────────────────┘
```

## The two tiers

- **Tier 1 — standalone.** DevPulse loads with no AI backend reachable:
  the full shell, projects, local stats, model *management*. Standalone
  is a mode, never an error (three no-AI indicators: status bar, top
  bar, chat window).
- **Tier 2 — connected.** The operator connects a Clyffy endpoint
  (Local or GB10 over their mesh). Every AI surface derives from the
  live capability handshake — computed, never hardcoded. The endpoint
  persists (`{data_dir}/user/clyffy_connection.toml`) and re-points at
  runtime without restart.

## Dependency rules

- **No crate in this workspace links the AI kernel.** It doesn't exist
  here. `cargo xtask verify-ip-boundary` asserts the engine and desktop
  are free of every inference crate (candle/llama.cpp/burn/ort/…) and
  of any kernel dependency; cargo-deny's bans back it up.
- **`interfaces/desktop` imports from `devpulse-engine` and
  `devpulse-gb10-client` only** (plus its own crates). Frontend logic
  lives Rust-side; Svelte is presentational.
- **Wire types are owned by `clyffyos-wire`** (pinned git dependency
  into the clyffyos repo). This workspace depends on it and re-exports
  it — one serde definition, two consumers (`clyffyd` + the client),
  no drift, no parallel DTOs.
- **No glob re-exports** across the engine's public surface; every
  re-export is a named, deliberate API contract.

## What lives where

### Engine (`systems/devpulse-engine`)

- `platform/services/` — one wrapper per managed runtime, all
  implementing the `Service` trait (boot/ping/shutdown).
- `platform/services/manifest.rs` — `SERVICE_MANIFEST` +
  `BOOT_STEP_MANIFEST`: SSOT for services + boot steps. Drift-protected
  by tests.
- `platform/services/rrd_translator.rs` — the engine's subscriber half
  of the `rrd.lifecycle` tracing contract with Clyffy's daemon
  (`clyffyos-rrd` emits; the target string is the contract).
- `platform/model_loader/` — model *management*: registry, slot
  assignment, downloads, hardware tiering. Inference is Clyffy's.
- `platform/knowledge/` — layman knowledge content (`data/` is the
  include_str SSOT the knowledge build regenerates).
- `platform/wizard/` — the copy SSOT (`wizard_copy.default.toml` +
  typed accessors); zero hardcoded UI strings downstream.
- `platform/config/` — TOML loader and the public `PlatformConfig`.
- `platform/facade/` — vocabulary translation (`TranslationRegistry`,
  `ENGINE_VOCABULARY`).
- `platform/boot/` — boot pipeline + retry logic.
- `claude/` — MCP server, Claude Code integration.
- `ip/kernel_terms.toml` — the layman-vocabulary SSOT (an engine asset;
  "kernel terms" names the vocabulary table, not a kernel).

### Wire client (`systems/devpulse-gb10-client`)

The Tier-2 seam. See `systems/devpulse-gb10-client/SPEC.md` — the
authoritative spec for connection state, capability gating,
persistence, and the boot-gate contract.

### Desktop (`interfaces/desktop`)

- `src-tauri/` — Tauri commands, managed state (incl.
  `ClyffyConnectionState` + the re-pointable probe loop and
  `connection_store.rs`), app entry. Imports engine + gb10-client.
- `src/lib/sys/generated/bindings.ts` — auto-generated TS bindings
  (specta export). SSOT for IPC types on the frontend.
- `src/lib/domains/clyffy/status/connection.state.svelte.ts` — the
  `clyffyConnection` rune: the ONE reactive source every Tier-1/Tier-2
  surface parses (`tier`, `capability`, `slots`, `slotFor`).
- `src/routes/(devtools)/devtools/*` — per-service devtools rendering
  the engine's status surface.

## The engine→UI seam — practical rules

DevPulse's only vocabulary simplification runs engine→UI (layman
Teaching-Mode clarity; no sensitive IP):

1. **Typed engine surface**: derive `specta::Type`, return from a Tauri
   command, regen bindings.
2. **Engine concept with internal vocabulary**: re-export with an `as`
   rename at the seam.
3. **Concept the customer shouldn't see** (algorithm names): emit a
   public signal registered in `signals.registry.yaml`, accessed via
   `ip_term!`.
4. **AI data**: parse from the connection (`clyffyConnection` /
   `capability.slots`) — never fabricate a slot table or assume a
   connected state.

Don'ts: no mirror structs with `impl From` at the seam (duplication is
not protection); no glob re-exports; no hardcoded endpoints, model
names, or slot tables anywhere.

## Build system

- `cargo xtask run-dev` — boot the platform in dev mode (Vite + Tauri).
- `cargo xtask regen-bindings` — regenerate `bindings.ts` from specta.
- `cargo xtask verify-ip-boundary` — assert the inference-free build.
- `cargo xtask fetch-surreal / fetch-devforge --target win32-x64` —
  sidecar binary downloads.
- `pnpm check` — svelte-check + TS typecheck on the desktop frontend.
- `pnpm ds:tokens:build` — ColdLight token regen (DTCG → SD5 → CSS/TS).

## Service lifecycle

Every managed runtime (turso, duckdb, surrealdb sidecar, model loader,
devforge, grammar engine, …) implements the same `Service` trait —
boot/ping/shutdown — and appears as one entry in `SERVICE_MANIFEST`.
Adding a service is exactly:

1. Implement `Service` in `platform/services/<name>.rs`.
2. Add a `ServiceMeta` entry to `SERVICE_MANIFEST` (and a matching
   `BootStepMeta` if it emits an `InitEvent` step).
3. Add a `ServiceEntry` field on `SystemServicesConfig` (or whichever
   scope).
4. Add an arm in `PlatformBootConfig::service_flags` and an arm in
   `Platform::runtime_state_for`.

The drift-protection unit tests
(`every_manifest_entry_has_config_flags`,
`every_service_meta_step_id_is_in_boot_step_manifest`,
`ts_manifest_matches_rust_manifest`) catch any missing piece at
`cargo test` time.
