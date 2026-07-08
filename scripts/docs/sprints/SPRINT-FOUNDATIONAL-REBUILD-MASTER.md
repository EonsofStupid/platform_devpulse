# SPRINT-FOUNDATIONAL-REBUILD-MASTER

**Owner**: Jesse
**Created**: 2026-04-21
**Status**: DRAFT — awaiting owner approval on sequence + S0 scope
**Supersedes**: SPRINT-FOUNDATION-V2 (progressive boot is done; this is the next layer)
**References**:
- `scripts/docs/AUDIT-2026-04-21.md` (structural gaps this sprint series resolves)
- `interfaces/desktop/src/lib/design/MASTER-PLAN.md` (ColdLight — UI authority)
- `.claude/rules/ip-protection.md` (vocabulary boundary)

---

## Owner's Directive (verbatim, 2026-04-21)

> Main configuration file should be no code — it imports each individual named file responsible for sub-features of that major capability: system (actual DevPulse settings), devforge, libsql, duckdb, surrealdb, candle, sidecar ollama, embedded ollama, reasoning (rro)/thinking, chat, rosetta stone, translator.
>
> Establishing a profile = two phases. Phase 1: tables/account/permissions. Phase 2: save/select LLMs with methodical per-slot spinners, saving/loading based on the active UI.
>
> Onboarding completes by methodically adding the project (devpulse), indexing it, making it truly dogfood. The `.exe` should run separately while main-app dev continues.
>
> Folders now. Patterns now. Clean source of truth. No bridges. No bandaids.
>
> Clean rewrite is fine. Methodical, multi-sprint. Maintain friendly, colorful, engaging ColdLight token-based UI. New tokens via SD5 build are acceptable. Preserve XY fluid clamping.

---

## Current State Snapshot (verified on disk, not from memory)

### TOML tree
```
config/platform/
├── 00-portable.toml              [portable mode flag — 4 lines]
├── runtime.toml                  [boot, windows, telemetry — 17 lines]
├── network.toml                  [dev_server, graph_api ports — 9 lines]
├── build/{deps,repos,toolchain}.toml
└── services/system/
    ├── libsql.toml               ✓ matches owner's list
    ├── duckdb.toml               ✓
    ├── surrealdb.toml            ✓
    ├── devforge.toml             ✓
    ├── model-loader.toml         (not in owner's 12; pre-existing)
    ├── model-catalog/            (not in owner's 12; pre-existing)
    ├── cache-vector.toml         (partial reasoning/RRO?)
    └── claude.toml               (not in owner's 12; API provider)
```

### Rust tree (current)
```
systems/devpulse-engine/src/platform/
├── config.rs                     ← 1,835 LOC MONOLITH (split target)
├── boot/{relational,analytics,graph,cache,vector,model_loader,log,preflight,retry,mod}.rs
├── services/{analytics,audio,cache,devforge,graph,manifest,model_loader,
│            model_loader_log,project_db,relational,vector,mod}.rs
├── init.rs, health.rs, server.rs, metrics.rs, mod.rs
├── facade/, integrations/, telemetry/
```

### Gap vs owner's 12-item list

| Owner's list | Current equivalent | Status |
|---|---|---|
| system (DevPulse settings) | `runtime.toml` + `00-portable.toml` + `network.toml` scattered | **consolidate needed** |
| devforge | `services/devforge.toml` | ✓ |
| libsql | `services/libsql.toml` (service: `relational.rs`) | ✓ (rename service module?) |
| duckdb | `services/duckdb.toml` (service: `analytics.rs`) | ✓ (rename?) |
| surrealdb | `services/surrealdb.toml` (service: `graph.rs`) | ✓ (rename?) |
| candle | — | **MISSING** |
| sidecar ollama | — | **MISSING** |
| embedded ollama | — | **MISSING** |
| reasoning (rro/thinking) | `services/cache-vector.toml` partial | **reauthor** |
| chat | — | **MISSING** |
| rosetta stone | — | **MISSING** |
| translator | — | **MISSING** |

### Extra services in current tree not on owner's list
- `services/audio.rs` — voice/TTS. Keep. Not in owner's 12 because voice wasn't enumerated.
- `services/cache.rs` — general cache. May fold into system or reasoning.
- `services/manifest.rs` — model catalog manifest. May fold into model_loader.
- `services/project_db.rs` — per-project libSQL instance. Keep, part of libsql config.
- `services/model_loader.rs` — LLM orchestration. Keep; owner's phase-2 profile depends on it.

**Decision needed**: whether to rename services to match owner's taxonomy (`relational.rs` → `libsql.rs`) as part of this sprint, or defer rename.

---

## Target End State (multi-sprint horizon)

1. **No-code master config** — one entrypoint that imports per-feature TOMLs. Defaults shipped, overlay in `{data_dir}/config/` is what devtools write.
2. **Rust mirror** — `platform/config/{system,libsql,duckdb,surrealdb,devforge,candle,ollama_sidecar,ollama_embedded,reasoning,chat,rosetta_stone,translator}.rs`. Each owns one `FooConfig` + `load()` + `save_overlay()`. `mod.rs` composes `PlatformConfig` by field.
3. **Services read their own config** — lazy-start pattern where appropriate (DevForge already does). No monolithic bootstrap that blocks the UI.
4. **Per-service devtools** — one `/devtools/{service}` route each. Reads typed config, edits overlay, calls start/stop/restart/export-logs commands. ColdLight UI (friendly, colorful, XY fluid clamp).
5. **First-run profile** — Phase 1 (tables/accounts/permissions) + Phase 2 (LLM save/select with per-slot spinners). ColdLight dark teal/purple gradient.
6. **Project onboarding** — methodically add DevPulse, index, dogfood.
7. **Standalone `.exe`** — runnable while main-dev continues (portable mode already exists; this formalizes it).

---

## Sprint Sequence

Each sprint is independently verifiable. Each has explicit STOP points. No sprint starts without owner approval of the prior sprint's close-out.

### S0 — Config Foundation (rewrite)

**Goal**: replace `config.rs` (1,835 LOC) with `config/` folder. Master TOML is composition-only. Figment-layered defaults → overlay → env. Scaffold the 7 missing TOMLs.

**Scope**:
- Create `platform/config/{system,libsql,duckdb,surrealdb,devforge,candle,ollama_sidecar,ollama_embedded,reasoning,chat,rosetta_stone,translator}.rs`
- Create `platform/config/loader.rs` — figment wiring + overlay path resolution
- Create `platform/config/mod.rs` — composes `PlatformConfig`, re-exports per-feature types
- Delete `platform/config.rs` (monolith)
- Write 7 missing TOML files with DTCG-style defaults + schema comments
- Consolidate `00-portable.toml` + `runtime.toml` + `network.toml` per STOP decision
- Export every `FooConfig` through tauri-specta → typed TS bindings

**Out of scope**:
- Wiring services to read new config (S1)
- Any UI work (S2+)
- Renaming service modules (defer to S1 or later)

**Exit criteria**:
- `cargo check -p devpulse-engine` passes
- `cargo check -p devpulse_desktop_backend` passes
- `pnpm check` passes (TS bindings compile)
- New TOML tree loads, round-trips, produces the same `PlatformConfig` the monolith did
- Zero consumer changes required outside config layer

#### S0 STOPs

**S0.1** — System TOML consolidation:
- (A) Fold `00-portable.toml` + `runtime.toml` + `network.toml` into a single `system.toml` with `[portable]`, `[boot]`, `[windows]`, `[telemetry]`, `[telemetry.lanes]`, `[network.dev_server]`, `[network.graph_api]` sections.
- (B) Keep the three files distinct, add `system.toml` on top for DevPulse-specific settings that are neither portable, runtime, nor network.
- Impact: naming; number of TOMLs; whether owner's "system" is one file or a family.

**S0.2** — Folder split:
- (A) Flat — everything in `config/platform/services/system/*.toml` (current).
- (B) Split — `config/platform/infra/{libsql,duckdb,surrealdb,devforge,candle,ollama_sidecar,ollama_embedded}.toml` + `config/platform/features/{reasoning,chat,rosetta_stone,translator}.toml` + `config/platform/system.toml`.
- Impact: how future services get filed; devtool route naming (`/devtools/infra/libsql` vs `/devtools/libsql`).

**S0.3** — Config layering crate:
- (A) `figment 0.10` — layered defaults→overlay→env, handles merge. +1 dep, battle-tested.
- (B) Plain `toml 0.8 + serde` — hand-roll merge. Zero new deps, more code.
- Impact: dev velocity, dep count, merge semantics (figment does deep merge; hand-roll won't by default).

**S0.4** — Extra services (`audio`, `cache`, `manifest`, `project_db`, `model_loader`):
- (A) Keep as-is, add their configs alongside owner's 12.
- (B) Fold where possible (manifest → model_loader; cache → reasoning or system).
- (C) Defer — address in S1 when wiring.
- Impact: S0 file count; config surface area.

---

### S1 — Services Rewired & Ops Commands

**Goal**: each service reads its own config section. `start`/`stop`/`restart`/`export_logs`/`health` commands exist for every service. Fix known bugs.

**Scope**:
- Each of the 12 services (and extras kept from S0.4) implements a trait like:
  ```rust
  trait ManagedService {
      fn name(&self) -> &'static str;
      async fn start(&self) -> Result<()>;
      async fn stop(&self) -> Result<()>;
      async fn restart(&self) -> Result<()>;
      async fn export_logs(&self, dest: &Path) -> Result<()>;
      async fn health(&self) -> ServiceHealth;
  }
  ```
- Tauri commands: `platform_service_start/stop/restart/export_logs/health(name)` — generic, driven by service registry.
- Fix DevForge `shutdown()` `std::Mutex`-across-`.await` bug (AUDIT finding #3).
- Remove dead `update_channel_url` field OR implement the runtime live-update path (AUDIT finding #4). S1 probably just removes the dead field; live-update becomes its own sprint.
- Document grammar_service SSOT (AUDIT finding #8).

**Out of scope**:
- Any UI.
- Live-update runtime for DevForge.

**Exit criteria**:
- Every service respects its own config section.
- Every service can be started/stopped/restarted from Rust (unit-tested).
- DevForge shutdown bug gone.
- `cargo check` and `cargo clippy` clean.

#### S1 STOPs

**S1.1** — Boot pipeline vs on-demand per service:
- Owner already decided DevForge is on-demand (lazy-start). Need the same call for each new service: candle, ollama×2, reasoning, chat, rosetta_stone, translator. DBs (libsql/duckdb/surrealdb) are boot-pipeline by necessity.

**S1.2** — Dedicated system accounts (AUDIT finding #6):
- SurrealDB has plaintext credentials in TOML today.
- (A) Move all service credentials into `{data_dir}/secrets/` with OS-level file permissions.
- (B) Use OS keychain (`keyring` crate) for credentials.
- (C) Defer — keep plaintext until S3 profile wizard authors credentials.

---

### S2 — Devtools (ColdLight-themed, per-service)

**Goal**: one devtool route per service. Friendly, colorful, engaging ColdLight UI. XY fluid clamp. Reads typed config, edits overlay, calls S1 commands. Save + restart (no hot-reload magic in S2).

**Scope**:
- `/devtools/{service}` per service. Route composes a shared `ServiceDevtoolShell` block.
- Shell has tabs: **Status** (health + metrics), **Config** (typed form bound to overlay), **Logs** (live tail + export), **Actions** (start/stop/restart).
- Use ColdLight `feature/` components. No raw HTML, no inline styles. All tokens via SD5.
- New tokens added via SD5 if needed — go through the build, do not hand-author CSS vars.
- Layman error messages (AUDIT finding #10). No raw Rust error strings.

**Out of scope**:
- First-run wizard (S3).
- Main product UI.

**Exit criteria**:
- All 12 service devtools load, read real config, save overlay, round-trip.
- `pnpm ds:tokens:build` clean. `pnpm check` clean.
- Visual review against ColdLight reference images.

#### S2 STOPs

**S2.1** — Devtool shell composition:
- (A) One shared `ServiceDevtoolShell.svelte` block; each service page passes service name + config schema.
- (B) Hand-compose each devtool page.
- Impact: consistency, maintenance, ability to add service #13 later.

**S2.2** — VPB integration:
- (A) Devtools are hand-composed — VPB is for product UI only.
- (B) Devtools built in VPB so they're self-editable — dogfood.
- Impact: scope, VPB readiness.

**S2.3** — Log viewer format:
- JSONL pretty-printed? Structured table? Raw text?

---

### S3 — First-Run Profile Phase 1 (tables/accounts/permissions)

**Goal**: first-run wizard creates the user's profile — DB tables, service accounts, permissions. ColdLight dark teal/purple gradient, fluid clamp XS→XXXL. Try/catch with layman errors.

**Scope**:
- `/onboarding/profile` route.
- Triggers DDL across libSQL, DuckDB, SurrealDB for profile schema.
- Creates service accounts (per S1.2 outcome).
- Persists profile marker so the wizard doesn't re-run on subsequent boots.

**Out of scope**:
- LLM selection (S4).
- Project creation (S5).

**Exit criteria**:
- Fresh install → profile phase 1 completes → marker persisted → next boot skips phase 1.
- Try/catch surfaces friendly errors. No raw stack traces in UI.

#### S3 STOPs

**S3.1** — Profile schema:
- What columns? Handle, display name, email optional, created_at, locale, timezone, telemetry consent?
- Do we reuse the existing `dev_profile` table in SurrealDB `global/knowledge`?

**S3.2** — Account credentials encryption:
- Same three options as S1.2 — finalize here if deferred.

---

### S4 — First-Run Profile Phase 2 (LLM save/select)

**Goal**: user selects LLMs per slot. Per-slot spinner during save/load. Individual or methodical batch. Wires to slot config.

**Scope**:
- `/onboarding/llms` route.
- Slot grid (Brain / Vision / Voice / Memory per existing memory docs).
- Each slot has: search, select, download (if needed), save, apply.
- Apply triggers the actual model load (per owner's NO-AUTOLOAD directive — explicit Apply click only).
- Spinner per slot during async ops.

**Out of scope**:
- Project onboarding (S5).

**Exit criteria**:
- User can pick a model per slot, Apply loads it, unload works, saved overlay persists.
- No model loads without user action.

#### S4 STOPs

**S4.1** — Slot taxonomy final:
- Owner's Brain/Vision/Voice/Memory is in memory. Confirm for this sprint or redefine.

**S4.2** — Model source:
- (A) HuggingFace browse in-app (per model loader vision memory).
- (B) Ship with a curated model catalog; HF browse deferred.

---

### S5 — Project Onboarding & Dogfood

**Goal**: add DevPulse as the first project. Index the codebase. Dogfood. `.exe` runs standalone while main-app dev continues.

**Scope**:
- `/onboarding/project` route — "Add DevPulse" happy path.
- Methodical indexer — shows progress, doesn't block.
- Indexed artifacts live under portable `.userdata/projects/devpulse/`.
- Standalone `.exe` target — verify portable mode works end-to-end.

**Out of scope**:
- Multi-project features beyond DevPulse.

**Exit criteria**:
- Fresh install → profile → LLMs → add DevPulse → indexing completes → chat/ask works against the repo.
- A second standalone `.exe` copy in a sibling folder also works, isolated.

#### S5 STOPs

**S5.1** — Index scope:
- Code only? Code + docs? Code + docs + git history?

**S5.2** — Embeddings storage:
- DuckDB extension? Qdrant local? libSQL vectors?

---

### S6 — Tokens & ColdLight Polish (spans S2–S5)

**Goal**: any new tokens introduced by S2–S5 are authored through the SD5 pipeline. XY fluid clamp preserved. No CSS vars hand-authored, no inline styles.

**Scope (continuous)**:
- When a sprint needs a new token, add it to `scripts/build/styledictionary/tokens/src/...` JSON, rebuild, commit the generated CSS.
- Fluid clamp values stay in `$extensions.com.coldlight` per DTCG authoring rules.
- Any component built in S2–S5 ends up in `components/` (not a route-local file) if reusable.

**Not a standalone sprint**. Runs alongside S2–S5 as guard rail.

---

## Global Rules (apply to every sprint)

1. No code touches before sprint STOPs are answered and owner approves.
2. Read every involved file before editing (per `foundational-author` skill).
3. Verify with `cargo check -p <crate>` and `pnpm check` after every file.
4. Max 5 files per phase. State phase plan, wait for approval between phases (per CLAUDE.md CC-002).
5. No backwards-compat shims. Pre-release mode. Reauthor aggressively.
6. No bandaids. Root causes only.
7. Kernel vocabulary stays in `kernel/` (per IP protection doctrine). Services and config speak registry vocabulary only.
8. Every UI surface uses ColdLight. No raw HTML, no inline styles, no hand-authored CSS.
9. XY fluid clamping preserved — `clamp()` on every size token.
10. Friendly, colorful, engaging copy in UI. Layman-first. No raw error strings surfaced.

---

## Next Action

Owner answers the **S0 STOPs (S0.1–S0.4)**. Once approved, S0 begins with a phase plan listing exact files and line ranges.

Nothing moves before that.
