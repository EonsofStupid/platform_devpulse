# S0 Research Synthesis — Evidence-Backed Plan

**Date**: 2026-04-21
**Parent**: `SPRINT-FOUNDATIONAL-REBUILD-MASTER.md`
**Depends on**: `S0.research-config.md`, `S0.research-logging.md`, `S0.research-signals.md`
**Purpose**: collapse the three research streams into one execution-ready plan. Nothing here is a guess — every claim cites a research finding.

---

## Convergence — what the three research streams agree on

All three audits independently surface the same structural truth:

> DevPulse's foundation has good individual pieces that were never wired into a consistent whole.

| Layer | What's built | What's wired |
|---|---|---|
| Config | 1,835 LOC monolith; 38 structs; 18 TOMLs | Whole-file replace; 10/28 specta-exported; credentials in source |
| Signals | Registry + 6 typed payloads + router + narrations | Zero consumers; three competing event systems |
| Logging | Panic hook + crash JSON + session JSONL + OTel + DuckDB spans | 7/12 failure modes; sync `log` command; unmigrated spawn sites |

**Cross-cutting implication**: the sprint that fixes config alone still leaves the app broken. Signals + logging are in the critical path for S0 because:

- **Sync `log` hang** (logging §3, blocker #2) is the boot lock the owner lost days to.
- **11 unmigrated `tokio::spawn` sites** (logging §3, blocker #1) mean every new service we add silently drops panics.
- **Three competing event systems** (signals §3) mean every module we migrate emits into a different bus. Wrapping it later is 3× the churn.
- **Hardcoded credentials** (config §7) block any profile-wizard flow. S3 depends on this exiting the source tree now.

S0 must land all three together or it will regress on the exact problem classes the owner is angry about.

---

## The three tracks of S0 (parallel, land together)

### Track 1 — Config rewrite (foundation)
1. Split `config.rs` → `platform/config/{axis}/{module}.rs` per charter.
2. Figment layered loader: `defaults` (per-module TOML) → `overlay` (user) → `env` (DEVPULSE_*).
3. Every `FooConfig` derives `#[derive(Type)]` (specta).
4. `#[serde(deny_unknown_fields)]` everywhere.
5. Extract hardcoded credentials (see STOP C9) → secrets loader.
6. Migrate 47 factory-fn defaults to per-module `[defaults]` TOML sections.

### Track 2 — Signal unification (enables observability)
1. Codegen `scripts/build/codegen-signals.rs` reads `signals.registry.yaml` → emits Rust consts + TS schemas.
2. Complete P0 legacy migration — 15 `kernel_terms.toml` consumers pointed at the new registry.
3. Retire `facade::InternalEvent` (fold into `SignalRouter`) OR formalize boundary (STOP C13).
4. Preflight rule: hard-fail ad-hoc `Tauri::emit(` outside `signals/` module (STOP C16).
5. Add `subscribe_signals(filter) -> EventStream<Signal>` Tauri command.
6. Create `interfaces/desktop/src/lib/domains/app/signals/` domain (data-access + util + index.ts).
7. Wire `ip_term!` macro to compile-time-validate against generated consts (STOP C7/C15).

### Track 3 — Logging hardening (fills the 5 uncovered failure modes)
1. `commands/sys/logger.rs:47` — `pub fn log` → `pub async fn log`. **One hour. Highest-value fix in the repo.**
2. Migrate all 11 `tokio::spawn` sites in engine to panic-safe `devpulse_telemetry::spawn()`.
3. OTel/DuckDB channel overflow — emit a warning when drops happen (not silent).
4. Disk-full / permission-denied — fall back to stderr with loud banner + keep attempting.
5. SIGTERM handler — flush all appenders before exit.
6. **Defer** webview crash hook to S1/S2 (8–16h, not a critical path for S0).

---

## Consolidated STOPs — C1 through C16

**Bold** = recommended answer with evidence citation. Plain = owner picks.

### From the Charter

| # | Question | Options | Recommendation |
|---|---|---|---|
| C1 | Tauri command style | (A) per-module `chat_start` / (B) generic `platform_service_invoke` | **(A) per-module** — typed bindings beat generic `Value` payloads; tauri-specta can generate them mechanically from the `ManagedModule` trait |
| C2 | Signal bus capacity + slow-consumer behavior | 1024 drop-on-lag / unbounded backpressure | **1024 drop-on-lag + emit `diagnostics.signal_lagged` signal on drop** — matches current router capacity; drops are observable via the signal bus itself |
| C3 | `[identity].axis` explicit or folder-derived | explicit / derived | **derived from folder path** — one source of truth (the filesystem); charter preflight enforces match |
| C4 | Overlay granularity | per-module file / unified file | **per-module** — matches charter's hypermodular rule; devtools write only their module's overlay |
| C5 | Devtool shell | shared parameterized / per-module | **shared `ServiceDevtoolShell.svelte` parameterized by module contract** — 12 modules × 4 tabs each = 48 near-identical components if per-module; not tractable |
| C6 | `ModuleError` shape | single enum / trait | **trait with common `ModuleErrorKind` enum + module-specific detail** — scales to future modules without enum variant proliferation |
| C7 | Signal registry validation | proc macro / runtime | **proc macro at S1; runtime-first in S0** — evidence: signals §4 says zero codegen today; landing both at once is too large for S0 |
| C8 | Devtool gating by stability | yes / no | **yes — experimental modules hidden unless `DEVPULSE_DEV=1`** — matches IP-protection doctrine; keeps UI clean for end-users |

### From Config Research

| # | Question | Options | Recommendation |
|---|---|---|---|
| C9 | Credential strategy | (A) `{data_dir}/secrets/` file + OS perms / (B) OS keyring / (C) encrypted TOML / (D) fail-closed, authored by profile wizard | **(D) fail-closed + (B) OS keyring when wizard authors** — removes plaintext from repo immediately; keyring is the industry-standard boring answer (Gnome Keyring / macOS Keychain / Windows Credential Manager); (A) is second-best if keyring integration is too slow for S0 |
| C10 | Kernel vs engine ownership for chat/reasoning/model-catalog | (A) engine wraps kernel types / (B) kernel facade / (C) module-owned regardless of location | **(B) kernel exposes a `ModulePort` facade; engine wires it** — matches hexagonal architecture; keeps IP boundary clean (kernel vocabulary stays in kernel); `ClaudeServiceEntry` is the current bad-pattern to NOT replicate |
| C11 | Overlay array semantics | replace / append | **replace by default; `#[serde(rename = "...", default)]` on specific arrays that should append (e.g., model catalog entries)** — figment's default is replace; exceptions are explicit, documented |
| C12 | Config version migration | — | **`[identity].schema_version`; loader refuses to load overlay with schema_version < module.version - 1; module defines `migrate(old) -> new` as needed** — boring and explicit |

### From Signals Research

| # | Question | Options | Recommendation |
|---|---|---|---|
| C13 | `facade::InternalEvent` retirement | (A) fold into SignalRouter / (B) keep kernel-internal / (C) defer | **(B) keep kernel-internal facade; new SignalRouter for cross-boundary only** — matches IP-protection doctrine (kernel vocabulary stays in kernel); `facade::InternalEvent` becomes private-to-kernel implementation detail that translators convert to registry signals at the boundary |
| C14 | Legacy `kernel_terms.toml` migration | (A) complete P0 in S0 / (B) defer to pre-S1 / (C) per-module as rebuilt | **(A) complete P0 in S0** — 15 consumers is a known scope; completing it unblocks every subsequent sprint; doing it incrementally means running two codegens in parallel for months |
| C15 | Signal codegen timing | S0 / S1 | **runtime validation in S0, compile-time proc macro in S1** — same reasoning as C7 |
| C16 | Ad-hoc Tauri emit ban | (A) strict / (B) soft-warn / (C) S0-through | **(A) strict preflight, from the start of S0** — soft warns become permanent tech debt; no new `emit(...)` outside `signals/` is a clear line; migrate existing as S0 proceeds |

---

## Phased S0 execution plan (charter + research-backed)

Each phase: **max 5 files**, state plan upfront, verify (`cargo check -p <crate>` + `pnpm check`), owner approval between phases.

### Phase 0 — Scaffolding (do first, unblocks everything)

1. Define `platform/module.rs` — the `ManagedModule` trait, `ModuleIdentity`, `ModuleAxis`, `StartMode`, `ModuleHealth`, `ModuleError` types.
2. Create folder skeleton:
   ```
   systems/devpulse-engine/src/platform/config/{runtime,stores,runtimes,capabilities,integrations}/mod.rs
   ```
3. `platform/config/loader.rs` — figment provider stack (defaults → overlay → env).
4. `platform/config/mod.rs` — `pub struct PlatformConfig { runtime, stores, runtimes, capabilities, integrations }` composition.
5. Add `figment = "0.10"` + `keyring` (if C9=B) to workspace `Cargo.toml`.

**Verify**: `cargo check -p devpulse-engine` passes with empty axis modules.

### Phase 1 — Track 3 quick wins (30 min, massive value)

1. `commands/sys/logger.rs` — `pub fn log` → `pub async fn log`. **Single line. Fixes the stderr backpressure hang.**
2. Commit + boot to confirm the hang is gone.

**Verify**: `cargo check -p devpulse_desktop_backend`; dev boot reaches steady state without IPC freeze.

### Phase 2 — Track 2 signal foundation

1. `scripts/build/codegen-signals.rs` — reads `signals.registry.yaml`, emits `systems/devpulse-engine/src/signals/generated.rs` (consts) + `interfaces/desktop/src/lib/sys/generated/signals.ts` (TS union types).
2. Wire into `build.rs`.
3. Replace the 15 `kernel_terms.toml` consumers one at a time (each gets its own commit; preflight stays green through the migration).
4. Delete `kernel_terms.toml` after last consumer migrates.
5. `interfaces/desktop/src/lib/domains/app/signals/index.ts` + `data-access/signals.state.svelte.ts` + `data-access/signals.service.ts`.

**Verify**: `cargo check`, `pnpm check`, preflight passes.

### Phase 3 — Track 1 config split (ROOT module first, it's the smallest)

Start with the smallest axis to prove the pattern:

1. `config/platform/runtime/portable.toml` + `runtime.toml` + `boot.toml` + `windows.toml` + `telemetry.toml` + `network.toml` — **decompose** `00-portable.toml`/`runtime.toml`/`network.toml` into per-module files per charter.
2. `platform/config/runtime/portable.rs` + `boot.rs` + `windows.rs` + `telemetry.rs` + `network.rs` — mirror structs with full charter headers.
3. `platform/config/runtime/mod.rs` — re-exports + `RuntimeConfig` composition struct.
4. `platform/module.rs` — register runtime modules with `ManagedModule` (start/stop are no-ops for pure-config modules; health is always Up).
5. Delete corresponding sections from `config.rs`.

**Verify**: boot still works; runtime config still drives the same behavior.

### Phase 4 — Track 1 `stores/` axis (one module at a time)

Per module (libsql → duckdb → surrealdb → cache → project_db):
1. TOML file `config/platform/stores/{module}.toml` with charter headers
2. Rust `platform/config/stores/{module}.rs` — `{Module}Config` + specta
3. Rust `platform/modules/stores/{module}.rs` — `ManagedModule` impl
4. Tauri commands `commands/platform/stores/{module}.rs` — all async
5. Svelte domain `lib/domains/platform/stores/{module}/`
6. Delete old `services/{module}.rs` equivalent from current tree
7. Verify health + boot

STOP between modules — owner reviews one complete module end-to-end before the pattern replicates.

### Phase 5 — Track 1 `runtimes/` axis

Same as Phase 4 for candle, ollama_sidecar, ollama_embedded, devforge. DevForge's lazy-start stays; charter formalizes the pattern.

### Phase 6 — Track 1 `capabilities/` axis

Same pattern: chat, reasoning, rosetta_stone, translator, voice, model_runtime. C10 decides whether each is kernel-owned or engine-owned; the charter contract is identical either way.

### Phase 7 — Track 1 `integrations/` axis

Claude. C10 guides the kernel facade shape.

### Phase 8 — Track 3 hardening (close the logging gaps)

1. Migrate 11 `tokio::spawn` sites to `devpulse_telemetry::spawn()`.
2. OTel/DuckDB overflow logging.
3. Disk-full banner.
4. SIGTERM handler.
5. **Defer webview crash hook** to S1 (8–16h not worth blocking S0).

### Phase 9 — Charter preflight validators

1. `scripts/docs/preflight/checks/check.module-charter.ts` — validates every module has 8 artifacts.
2. `scripts/docs/preflight/checks/check.no-sync-commands.ts` — bans sync Tauri commands.
3. `scripts/docs/preflight/checks/check.no-adhoc-emits.ts` — bans `Tauri::emit(` outside signals/.
4. Wire into lefthook.

### Phase 10 — End-to-end verification

1. Clean fresh boot on bare `.userdata/` — wizard path is dark (S3 scope, but the skeleton works).
2. Every module's devtool page loads empty shell (S2 scope, but the routes exist).
3. Signal bus: emit test signal, verify frontend `subscribe_signals` receives it.
4. Force-panic a spawned task: verify crash JSON written.
5. Verify `cargo check` + `cargo clippy` + `pnpm check` + `pnpm build` all clean.

---

## Scope discipline

**In S0**:
- Config split (all 12 modules + runtime primitives)
- Signal unification (codegen, legacy retirement, frontend domain scaffold)
- Logging async/spawn fixes (5/5 critical failure modes closed)
- Charter preflight validators
- Credential exit from source tree
- Every module has a boot-capable skeleton — health = Up, config loads, `ManagedModule` impl stub

**Not in S0** (next sprints):
- Per-service devtool UI polish (S2)
- Profile wizard Phase 1 (S3)
- LLM select UI (S4)
- Project onboarding (S5)
- Webview crash hook (S1)
- Proc-macro signal validation (S1)
- Secret keyring integration (S1 if C9=B and too large for S0)

---

## Verification gates

Between every phase:
- `cargo check -p devpulse-engine`
- `cargo check -p devpulse_desktop_backend`
- `cargo clippy -p devpulse-engine`
- `pnpm check`
- `pnpm ds:tokens:build` (only if token files changed)

End of S0:
- `pnpm build` passes
- Clean fresh boot from empty `.userdata/` succeeds in <10s
- Force-panic any spawned task → crash JSON written
- Every `#[tauri::command]` is `pub async fn`
- `kernel_terms.toml` deleted
- No plaintext passwords in git grep

---

## Execution gate — owner must answer before Phase 0 begins

**Sixteen STOPs C1–C16**. Recommended answers are boldface in the tables above.

Fastest path: owner skims the table, says "accept all recommendations except X and Y which go (Z)."

Slowest safe path: owner picks each one individually.

**I don't start Phase 0 until this table is closed.**
