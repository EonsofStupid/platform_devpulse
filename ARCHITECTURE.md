# DevPulse Architecture

DevPulse is a layered Rust + SvelteKit application. Three layers, one
direction of dependency, no cycles.

```
┌──────────────────────────────────────────────────────────────┐
│ interfaces/desktop  — Tauri shell, SvelteKit UI              │
│ (consumes typed bindings; never imports kernel directly)     │
└──────────────────────────────────────────────────────────────┘
                                ▲
                                │ tauri-specta IPC
                                │ (typed via bindings.ts)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ systems/devpulse-engine — platform facade                    │
│  • Service lifecycle (boot, health, shutdown)                │
│  • TOML config loader                                        │
│  • Public type surface (re-exports kernel types deliberately)│
│  • Vocabulary translation (ip_term!, signals.registry.yaml)  │
│  • Tauri command surface (specta-typed)                      │
└──────────────────────────────────────────────────────────────┘
                                ▲
                                │ explicit named imports
                                │ (no glob re-exports)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ kernel/devpulse-clyffy + kernel/model-loader                 │
│  • Persistence adapters (libsql, duckdb, surrealdb, moka)    │
│  • HTTP clients for managed sidecars (ollama, surreal)       │
│  • Inference runtime (model loader, slots, registries)       │
│  • Knowledge library (entry storage, reaction recording)     │
│  • Grammar / constrained decoding                            │
└──────────────────────────────────────────────────────────────┘
```

## Dependency rules

- **`interfaces/desktop` MUST NOT import `devpulse_clyffy` or `model_loader`.** Frontend goes through the engine facade exclusively. Enforced by convention; verifiable with `grep -r 'devpulse_clyffy::\|use devpulse_clyffy' interfaces/desktop/src-tauri/` (must be 0 hits).
- **`devpulse-engine` MAY import kernel crates** — but every public re-export is a deliberate API contract, annotated with an `IP-NOTE:` comment in `platform/mod.rs`.
- **Kernel crates MUST NOT import `devpulse-engine`.** The dependency is one-way; kernel knows nothing about the platform that consumes it.
- **No glob re-exports** of kernel types from the engine (`pub use devpulse_clyffy::*` is forbidden). Each re-export is named.

## What lives where

### Kernel (`kernel/`)
- `devpulse-clyffy` — cortex (the brain): persistence adapters, sidecar HTTP clients, knowledge library, grammar engine, safety scanner.
- `model-loader` — the AI runtime: model registry, slot management, voice catalog, hardware tier classification, architecture/backend compatibility matrix.

Kernel types that need to cross the IPC boundary derive `specta::Type` behind the optional `specta` feature flag, so kernel-only consumers don't pay for it.

### Engine (`systems/devpulse-engine`)
- `platform/services/` — one wrapper per managed runtime, all implementing the `Service` trait (boot/ping/shutdown).
- `platform/services/manifest.rs` — `SERVICE_MANIFEST` + `BOOT_STEP_MANIFEST`: SSOT for what services exist and what boot steps are emitted. Drift-protected by tests.
- `platform/services/status.rs` — public service-status surface consumed by the devtools UI.
- `platform/config/` — TOML loader and the public `PlatformConfig` type.
- `platform/facade/` — vocabulary translation (`TranslationRegistry`, `ENGINE_VOCABULARY`).
- `platform/boot/` — boot pipeline + retry logic.
- `claude/` — MCP server, Claude Code integration.

### Desktop (`interfaces/desktop`)
- `src-tauri/` — Tauri commands, state, app entry point. Imports from `devpulse-engine` only.
- `src/lib/sys/generated/bindings.ts` — auto-generated TS bindings (specta export). Single source of truth for IPC types on the frontend.
- `src/lib/sys/generated/service-manifest.ts` — hand-mirrored copy of `BOOT_STEP_MANIFEST`, drift-protected by a Rust unit test.
- `src/routes/(devtools)/devtools/*` — per-service devtools, each rendering against a slice of the engine's status surface.

## The kernel/engine seam — practical rules

When you need kernel data on the frontend:

1. **Vocabulary-safe kernel type** (e.g. `OllamaModel`, `BackendMatrix`): add `#[cfg_attr(feature = "specta", derive(specta::Type))]` on the kernel struct, re-export from `platform/mod.rs` with an `IP-NOTE:` comment, return it directly from a Tauri command.
2. **Kernel type with internal vocabulary** (e.g. `EntryType` becomes `KnowledgeEntryType`): re-export with `as` rename. Same pattern, name swap at the seam.
3. **Kernel concept the user shouldn't see at all** (sub-agent identities, algorithm names): the engine emits a public signal instead, registered in `signals.registry.yaml`, accessed via `ip_term!`.

What you do NOT do:
- Don't author an engine-side struct that mirrors a kernel struct with an `impl From<KernelFoo> for EngineFoo`. That's duplication, not protection.
- Don't pull a kernel type into a TOML config field shape — define an engine-owned config struct and convert at the kernel boundary.
- Don't glob-import (`pub use devpulse_clyffy::cortex::*`).

## Build system

- `cargo xtask run-dev` — boot the platform in dev mode (Vite + Tauri).
- `cargo xtask regen-bindings` — regenerate `interfaces/desktop/src/lib/sys/generated/bindings.ts` from the engine's specta exports.
- `cargo xtask fetch-surreal --target win32-x64` — download the SurrealDB sidecar binary into `interfaces/desktop/src-tauri/binaries/`.
- `cargo xtask fetch-devforge --target win32-x64` — same, for the DevForge VS Code REH server.
- `pnpm check` — svelte-check + TS typecheck on the desktop frontend.

## Service lifecycle

Every managed runtime (libsql, duckdb, surrealdb sidecar, ollama sidecar, model loader, devforge, vector store, grammar engine, …) implements the same `Service` trait — boot/ping/shutdown — and appears as one entry in `SERVICE_MANIFEST`. Adding a new service is exactly:

1. Implement `Service` in `platform/services/<name>.rs`.
2. Add a `ServiceMeta` entry to `SERVICE_MANIFEST` (and a matching `BootStepMeta` if it emits an `InitEvent` step).
3. Add a `ServiceEntry` field on `SystemServicesConfig` (or whichever scope).
4. Add an arm in `PlatformBootConfig::service_flags` and an arm in `Platform::runtime_state_for`.

The drift-protection unit tests (`every_manifest_entry_has_config_flags`, `every_service_meta_step_id_is_in_boot_step_manifest`, `ts_manifest_matches_rust_manifest`) catch any missing piece at `cargo test` time.
