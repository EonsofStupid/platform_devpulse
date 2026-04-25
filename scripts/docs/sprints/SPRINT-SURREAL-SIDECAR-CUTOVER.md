# Sprint: SurrealDB Sidecar Cutover

**Goal**: Retire the embedded `kv-surrealkv` path + hand-rolled axum
facade. Run the real SurrealDB server binary as a managed sidecar with
RocksDB storage. Lifecycle stays ours (spawn / attach / port-bump /
shutdown) — the only cost is an IPC bridge (WS) instead of in-process
calls. Keep `:8822` + `.claude/hooks/*.js` working through the cutover.

**Owner-approved decisions** (so we don't re-litigate):
- **RocksDB, not surrealkv** for the sidecar. Team-tested, better
  tooling, surrealkv was fine for embedded but has fewer eyeballs.
- **Auto port-bump** at boot (default max 20). Configured port busy →
  bump +1 and retry. Status surfaces `configured vs actual` so the UI
  never lies.
- **Editable port in devtool** (not read-only placeholder). Save
  persists to `{data_dir}/user/surrealdb_sidecar.toml`, applies on
  next app restart. Hot-restart wiring is a follow-up (scope call at
  end).
- **Cortex wrap for Ollama**. It was the odd one out under
  `engine/services/` — every other adapter (libsql, duckdb, surreal,
  rro, moka, whisper, kokoros, embedder) already lives in
  `kernel/devpulse-clyffy/src/cortex/persistence/`. Ollama now does
  too, with a thin engine facade preserving the existing IP boundary.
- **No data migration** — all system-namespace tables were 0 rows;
  schemas re-apply from source on every boot via `DEFINE ... IF NOT
  EXISTS`. Wipe `.userdata/surreal/devpulse/` before first boot.

---

## Architecture — post-cutover

```
Tauri (commands/surrealdb_sidecar)
    │
    ▼
Platform (surrealdb_sidecar slot)  ──► SurrealdbSidecarService (engine facade)
    │                                      │
    │                                      ▼
    │                                 SurrealdbSidecarAdapter (kernel)
    │                                      │ spawn `surreal start` with rocksdb
    │                                      │ + SURREAL_USER/SURREAL_PASS
    │                                      ▼
    │                                 127.0.0.1:<bumped-port>
    ▼
GraphService(system/user/global) ──► SurrealAdapter (WS client, Surreal<Any>)
    │                                      │
    │                                      ▼
    │                                 ws://127.0.0.1:<bumped-port>/rpc
    ▼
.claude/hooks/*.js ──► http://127.0.0.1:<bumped-port>/sql (native surreal endpoint)
```

**Kill list**:
- `systems/devpulse-engine/src/platform/server.rs` — the hand-rolled
  axum facade on `:8822`. The real surreal binary now serves `/sql`,
  `/rpc`, `/health`, `/version` natively.

**Port allocator contract** (`kernel/devpulse-clyffy/src/cortex/persistence/port_alloc.rs`):

```text
probe host:port
├─ nothing listening → SPAWN, bumps=0
├─ listening + identity probe OK → ATTACH, bumps=0
└─ listening + identity probe fails → try port+1, up to max_bumps
```

Identity probe is per-service:
- Surreal: `GET /health` 2xx AND `GET /version` body contains "surreal"
- Ollama: `GET /api/version` 2xx

---

## What shipped

### Kernel ([kernel/devpulse-clyffy/src/cortex/persistence/](../../kernel/devpulse-clyffy/src/cortex/persistence/))
- `port_alloc.rs` — probe/attach/bump allocator + 3 unit tests.
- `surrealdb_sidecar.rs` — `SurrealdbSidecarAdapter` owning the child
  process, emits `SidecarEndpoint` for the WS client.
- `ollama.rs` — **lifted** from the engine layer, now uses
  `port_alloc` (drop-in replacement for the old engine-resident
  adapter).
- `surreal.rs` — rewritten as `Surreal<Any>` WS client. Signs in as
  root via `SidecarEndpoint`, applies scoped DDL via `USE NS x DB y;
  ...` prefix pattern (unchanged).
- `mod.rs` + root `Cargo.toml` — swapped surrealdb features from
  `["kv-mem", "kv-surrealkv"]` to `["protocol-ws"]`, added `reqwest` to
  kernel deps.

### Engine ([systems/devpulse-engine/src/platform/](../../systems/devpulse-engine/src/platform/))
- `services/surrealdb_sidecar.rs` — engine facade + specta DTOs
  (`SurrealdbSidecarStatus`, `SurrealdbSidecarHealth`).
- `services/surrealdb_sidecar_config.rs` — user-scope editable overlay
  at `{data_dir}/user/surrealdb_sidecar.toml`. Atomic write via
  temp-file + fsync + rename. Boot-time `apply_overlay()` merges onto
  platform defaults before spawning.
- `services/ollama_sidecar.rs` — slimmed to facade over kernel
  `OllamaAdapter`; introduces engine-facade `OllamaModel` DTO with
  `From<KernelOllamaModel>` because specta can't derive on kernel types.
- `services/graph.rs` — removed path-based `boot()`; keeps only
  `from_shared(adapter, ns, db, label)`.
- `boot/graph.rs` — rewritten pipeline: sidecar → WS-connect → init
  three namespaces on one connection → create NS-scoped users
  (preserves hook auth compatibility) → build three `GraphService`s.
- `boot/mod.rs` — `BootedServices` gains `surrealdb_sidecar` field,
  `tokio::join!` returns 4-tuple from `graph::boot_consolidated`.
- `platform/mod.rs` — new slot `surrealdb_sidecar:
  Option<Arc<SurrealdbSidecarService>>`, accessors
  (`surrealdb_sidecar_status/health/user_config_load/save`), added to
  `for_each_service!` macro (health probe first) and
  `for_each_service_rev!` (shutdown last — after client WS close).
  **Removed** `pub mod server;`.
- `config/loader.rs` — `SurrealdbSidecarServiceEntry` with defaults
  (`enabled: true`, `critical: true`, `auto_start: true`, `root_user:
  "root"`, `log_level: "warn"`, `max_bumps: None`).

### Tauri ([interfaces/desktop/src-tauri/](../../interfaces/desktop/src-tauri/))
- `src/commands/surrealdb_sidecar/mod.rs` — 4 commands:
  `surrealdb_sidecar_status/health/config_load/config_save`.
- `src/lib.rs` — registered in `collect_commands!`.
- `tauri.conf.json` — `externalBin` += `binaries/surreal`.

### Frontend ([interfaces/desktop/src/](../../interfaces/desktop/src/))
- `lib/domains/infra/surrealdb_sidecar/index.ts` — domain public API
  (types + state + svc).
- `lib/domains/infra/surrealdb_sidecar/data-access/surrealdbSidecar.svc.ts` —
  IPC wrappers.
- `lib/domains/infra/surrealdb_sidecar/data-access/surrealdbSidecar.state.svelte.ts` —
  rune state: `status`, `health`, `savedConfig`, `draft`, derived
  `dirty` / `bumped` / `portSummary`, `needsRestart` flag.
- `routes/(devtools)/devtools/surrealdb_sidecar/+page.svelte` — Status
  (port summary + bump badge + HTTP/WS URLs), Config (editable
  port/binary/log_level/bumps/root creds + Save/Reset + restart banner),
  Logs (scoped log target string), Actions (intentional
  "no stop/start yet — see follow-up").

### Config
- `config/platform/services/system/surrealdb.toml` — new
  `[services.system.surrealdb_sidecar]` section; existing NS blocks
  preserved for backwards-compat (their `path` field is now unused;
  RocksDB lives at hardcoded `{data_dir}/surreal/devpulse/`).

### Xtask
- `commands/fetch_surreal.rs` — downloads pinned `surreal v3.0.5`
  release for the target platform, drops into
  `interfaces/desktop/src-tauri/binaries/surreal-<triple>.exe`. Uses
  `curl` + `tar` (present on Windows 10+, macOS, Linux).
- `main.rs` — registered `FetchSurreal { target, force }` subcommand.
- `zombie.rs` — added `surreal`, `llama-server` (and their
  `-<triple>` variants) to the sweep list. Ollama deliberately
  excluded (user-installed, we never sweep processes we don't own).

---

## What did NOT ship (follow-up)

**Hot-restart from the devtool.** Currently the Config tab Save writes
the user-overlay TOML and shows a "restart app to apply" banner. To
replace that with real Stop / Start / Restart buttons:

1. `Platform` fields `system_graph` / `user_graph` / `global_graph` /
   `surrealdb_sidecar` → `ArcSwapOption<T>`.
2. New `Platform::restart_surrealdb_sidecar()`:
   - `self.surrealdb_sidecar.swap(None)` + `shutdown().await` the old.
   - Re-read user overlay + platform defaults.
   - `SurrealdbSidecarService::boot(resolved_cfg).await`.
   - Connect fresh `SurrealAdapter` WS client, re-init three
     namespaces on it.
   - Build three new `GraphService`s, atomically `ArcSwap::store` all
     four fields.
3. Tauri: three commands matching Ollama's surface
   (`surrealdb_sidecar_start/stop/restart`).
4. Frontend: swap the "restart app" banner for Start/Stop/Restart
   buttons.

Estimate: ~2 hours. Not architecturally blocked — pure wiring.

---

## Known issues from this sprint

- **Regen-bindings OOM on this machine.** `cargo xtask regen-bindings`
  got three separate rustc processes SIGTERM'd (exit 143) on
  `surrealdb`, `surrealdb-core`, `devpulse_desktop_backend` during
  their final link. `cargo check --workspace` completes because it
  emits `rmeta` without the memory-heavy final link. Mitigation:
  `CARGO_BUILD_JOBS=2` (or `=1`) before `cargo xtask regen-bindings`
  to reduce parallel-link memory pressure.
- **5 pre-existing xtask dead-code warnings** in `events.rs`
  (`skip`, `sender`, `emit`, `log_path`). Not introduced by this
  sprint — triage separately.
- **6 missing_docs warnings fixed** during sprint (kernel + engine
  DTOs). Zero mine remaining.

---

## How to verify post-commit

```bash
# 1. Regenerate bindings (lower parallelism if OOM)
CARGO_BUILD_JOBS=2 cargo xtask regen-bindings

# 2. Fetch the surreal binary into the sidecar bundle dir
cargo xtask fetch-surreal --target win32-x64

# 3. Wipe stale surrealkv data (no migration — previously empty)
rm -rf .userdata/surreal/devpulse/

# 4. First boot
cargo xtask run-dev
```

**Expected on happy path** — devtool `/devtools/surrealdb_sidecar`:
- Status tab: `Managed` badge, port `:8822` (no bump badge).
- Health tab: `healthy`.
- Config tab: empty form (all fields inherit from platform.toml).
- `.claude/hooks/*.js` still POST to `http://127.0.0.1:8822/sql` with
  system creds — same contract as before the cutover.

**Expected on port collision** (e.g. old app still running on 8822):
- Status: `Managed` or `Attached` (depending on whether the old
  process is serving surreal), port `:8823 (configured :8822, bumped
  +1)` with an amber "port auto-bumped" warning panel.
- Hooks on `:8822` still hit the OLD instance until it exits; new
  app's hooks would target `:8823` if configured.

---

## Memory links worth updating after this sprint

- `project_architecture.md` — kill "custom /sql axum facade on :8822"
  line; add "managed surreal sidecar" as the data-path owner.
- `project_service_pattern.md` — Ollama is no longer the sole
  reference; note SurrealDB follows the same pattern (kernel adapter
  + engine facade + devtool shell + scoped logs + config overlay) but
  adds the port allocator + user-scope overlay layer on top.
- `reference_platform_boot_config.md` — add
  `[services.system.surrealdb_sidecar]` section to the list of things
  `platform.toml` carries.
