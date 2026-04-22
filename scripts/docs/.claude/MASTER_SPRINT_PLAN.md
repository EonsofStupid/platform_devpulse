# DevPulse Platform — Master Sprint Plan

> **Last audit**: 2026-04-22 (disk-grepped, not memory-sourced)
> **Status**: REWRITTEN 2026-04-22. Prior 2026-03-06 version contained stale
> "NOT BUILT" claims for Kokoros, Whisper, the signal system, RRO, and CI.
> Every entry below is disk-verified via `ls` / `glob` / `grep` against the
> working tree at the time of this audit.

---

## READ FIRST — Truth-vs-lies from prior versions

Prior versions of this doc (and the cross-referenced `.claude/rules/ip-protection.md`)
claimed the following did not exist. They do. Verified paths:

| Formerly claimed "NOT BUILT" | Reality on disk |
|------------------------------|-----------------|
| Kokoros TTS                  | `kernel/model-loader/src/backends/ort/kokoro.rs` (ORT session, phoneme vocab, 24 kHz PCM output) |
| Whisper STT                  | `kernel/model-loader/src/backends/ort/whisper.rs` (encoder + decoder ORT sessions, mel spectrogram, autoregressive decode) |
| STS pipeline                 | `interfaces/desktop/src-tauri/src/commands/voice/mod.rs::run_sts_pipeline` — 4-stage audio → STT → brain → TTS → playback |
| Unified signal system        | `systems/devpulse-engine/src/signals/` — 7 files, 527 LOC, public `Signal` / `SignalRouter` / `SignalHeader` / `SignalVariant` / `SinkKind` |
| RRO (vector) integration     | `kernel/devpulse-clyffy/src/cortex/persistence/rro.rs` + engine facade `systems/devpulse-engine/src/platform/services/vector.rs` + boot stage `platform/boot/vector.rs` |
| CI pipeline                  | `.github/workflows/ci.yml` and `release.yml` |
| Lefthook gates               | `lefthook.yml` at repo root |
| Preflight AST checks         | `scripts/docs/preflight/checks/` — 8 rules including `check.typed-routes.ts` |
| Voice Tauri commands         | `interfaces/desktop/src-tauri/src/commands/voice/mod.rs` — 15+ commands (speak, transcribe, voice_smoke_test, run_sts_pipeline, voice profiles) |
| DevForge service scaffolding | `systems/devpulse-engine/src/platform/services/devforge.rs` + `xtask fetch-devforge` |

**Discipline rule (added 2026-04-22):** Any claim in any sprint doc that says
"code does not exist" must be grepped on disk before being acted on. The
pattern of "code landed, doc never updated" has cost hours of false planning.

---

## AUTHORED AND VERIFIED IN CODE (audit 2026-04-22)

### Backend — Engine (`systems/devpulse-engine/src/`)

**Platform services (`platform/services/`):**

| Service | File | Role |
|---------|------|------|
| Relational (LibSQL) | `relational.rs` | System + user scopes |
| Analytics (DuckDB) | `analytics.rs` | System scope |
| Graph (SurrealDB) | `graph.rs` | System + user + global namespaces, HTTP on :8822 |
| Cache (Moka) | `cache.rs` | In-memory |
| Vector (RRO) | `vector.rs` | Feature-gated on `rro` |
| Model Loader | `model_loader.rs` + `model_loader_log.rs` | Slot-based Layer 2 |
| DevForge | `devforge.rs` | Lazy-started on user open |
| Audio | `audio.rs` | |
| Project DB | `project_db.rs` | |
| Service Manifest | `manifest.rs` | SSOT for `ServiceMeta` + `BOOT_STEP_MANIFEST` + `ServiceGroup` enum |

**Boot pipeline (`platform/boot/`):**
- Orchestrator `mod.rs` — preflight → System relational → System analytics → (Graph ‖ Model Loader in parallel) → System cache → User relational → Knowledge sync → Vector → Grammar → validation
- Per-service modules: `relational.rs`, `analytics.rs`, `graph.rs`, `cache.rs`, `vector.rs`, `model_loader.rs`
- `BootLog` writes real-time to `.userdata/logs/boot.log`
- Emits `InitEvent::{running,ok,error,skipped}` per stage
- `BOOT_STEP_MANIFEST` is the SSOT; `validate_critical` uses step_id strings matching UI

**Signal system (`signals/`, 527 LOC, 7 files):**
- `Signal` — broadcast packet
- `SignalHeader` — metadata + provenance
- `SignalSource` — provenance enum
- `SignalVariant` — typed payload enum
- `SinkKind` — routing destinations
- `SignalRouter` — tokio broadcast channel
- Pattern: engine emits → router fans out to subscribers (kernel, desktop, analytics)

**AI providers (`ai_providers/`):**
- `registry.rs`, `types.rs`, provider identity + SDK backend enum

**IP (`ip/`):**
- `signals.registry.yaml` + `signals.narrations.yaml` (one-sided public vocabulary)
- `kernel_terms.toml` (legacy two-column ban list, DEPRECATED — P0 migration gated)

### Backend — Kernel

**`kernel/devpulse-clyffy/`:**
- Cortex persistence adapters: LibSQL, DuckDB, SurrealDB, MongoDB, Kokoros, Whisper, RRO
- Grammar service (constrained decoding)
- CAG pipeline
- Knowledge library sync

**`kernel/model-loader/`:**
- ORT backends (`src/backends/ort/`): `kokoro.rs`, `whisper.rs`, `embedder.rs`, `reranker.rs`, `snac.rs`
- Slots system (`src/slots/`)
- Voice pool (`src/backends/voice_pool.rs`)
- Hardware auto-config, presets, discovery, downloads
- Configs: `slots.default.toml`, `presets.default.toml`, `assistant.default.toml`, `voices.default.toml`

### Backend — Tauri facade (`interfaces/desktop/src-tauri/src/commands/`)

**Voice (`voice/mod.rs`, 15+ commands):**
- `get_voice_status`, `speak`, `stop_speaking`, `is_speaking`
- `list_voices`, `preview_voice`
- `test_microphone`, `transcribe_audio`, `transcribe_audio_file`
- `list_voice_profiles`, `save_voice_profile`, `delete_voice_profile`, `activate_voice_profile`
- `voice_smoke_test` — closed-loop TTS→STT round-trip
- `run_sts_pipeline` — 4-stage audio file → Whisper → brain LLM → Kokoros → rodio playback

**Models / platform / IPC bridge** — full command set wired to engine services.

### xtask orchestrator (`xtask/src/`)

**Commands (`src/commands/`):**
- `preflight`, `deps`, `dev` (run-dev), `verify`, `ip_boundary` (verify-ip-boundary)
- `build_release` (+ `--portable-only` flag, 2026-04-22)
- `package_portable` (+ `--dry-run`)
- `fetch_devforge`
- `sccache` integration

**New modules authored 2026-04-22 (uncommitted at time of audit):**
- `events.rs` — `StageEvent`, `EventSink` (mpsc writer thread), `StageGuard` (enforces explicit resolution), `SummaryCounts`
- `manifest.rs` — `BuildManifest` (product + vcs + toolchain + build + artifacts[]), streamed SHA256, ISO8601 timestamps
- `sbom.rs` — CycloneDX 1.4 BOM generator, Rust via `cargo_metadata`, npm via `pnpm list --json`

### Frontend (`interfaces/desktop/src/`)

**Domains (`lib/domains/app/`, 9):**
`devforge`, `devpulse`, `knowledge`, `minions`, `models`, `overmind`, `voice`, `wiredfront`, `ui-demo`

**Route groups (`routes/`):**
- `(app)/` — `clyffy`, `devforge`, `devpulse`, `overmind`, `ui-demo`, `wiredfront`
- `(chat)/`, `(cortex)/`, `(devtools)/`, `(setup)/`, `(voice-lab)/`

**DevPulse domain pages (`routes/(app)/devpulse/`):**
`community`, `models`, `overview`, `profile`, `projects`, `settings`, `social`, `stats`, `types`

**Devtools routes (`routes/(devtools)/devtools/`, 19):**
`cache`, `candle`, `claude`, `cortex`, `devforge`, `duckdb`, `libsql`, `llama_cpp_embedded`, `models`, `mongodb`, `ollama_sidecar`, `project_db`, `rro`, `sts`, `stt`, `surreal`, `telemetry`, `tts`, `vision`

**Generated types (`lib/sys/generated/`):**
- `bindings.ts` — specta-emitted TS for every `#[tauri::command] #[specta::specta]` symbol
- `boot.types.ts`, `chat.types.ts`, `dashboard.types.ts`, `health.types.ts`, `init.types.ts`
- `terminology.ts`, `terminology-icons.ts` — from `kernel_terms.toml`
- `service-manifest.ts` (2026-04-22) — mirrors Rust `BOOT_STEP_MANIFEST`, cross-file sync enforced by `cargo test -p devpulse-engine --lib platform::services::manifest::tests::ts_manifest_matches_rust_manifest`

**Design system (`lib/design/`):**
- `coldlight.config.ts`, `MASTER-PLAN.md`, `ADR-001-RENDER-FORGE.md`
- `primitives/`, `components/`, `presets/`, `blocks/`, `overlays/`, `patterns/`
- `styles/`, `svg/` (real SVG filter primitives for bevel/glow/noise)
- `schema/`, `registries for tokens`, `generated/` (SD5 output)
- `REFERENCES/` with visual reference images

**Platform state (`lib/sys/runes/platformState.svelte.ts`):**
- Rune-based `$state` + `$derived`
- Boot snapshot replay + live event listeners
- `SubsystemInfo` tracking
- Model readiness tracking (separate from platform boot)
- 15s health polling after boot

**Layouts (`lib/layouts/app/`):**
- `Frame.svelte`, `Sidebar.svelte`, `TopBar.svelte`, `StatusBar.svelte`
- `BootOverlay.svelte`, `SubsystemBadge.svelte`
- `StatusBar.types.ts` (delegates classification to generated `service-manifest.ts`, 2026-04-22)

### Enforcement

**Lefthook (`lefthook.yml`):** pre-commit hooks wired.

**Preflight AST checks (`scripts/docs/preflight/checks/`, 8 rules):**
- `check.aria-primitives.ts`
- `check.component-structure.ts`
- `check.domain-boundaries.ts`
- `check.naming.ts`
- `check.no-style-primitives.ts`
- `check.primitive-structure.ts`
- `check.taxonomy-alignment.ts`
- `check.typed-routes.ts`

**Preflight infrastructure:**
- Engine: `scripts/docs/preflight/engine/`
- Fixers: `scripts/docs/preflight/fixers/`
- Types: `scripts/docs/preflight/types.ts`

**CI (`.github/workflows/`):**
- `ci.yml`
- `release.yml`

**IP boundary check:** `.claude/rules/ip-protection.md` + lefthook hook + CI regex grep. Ban-listed kernel vocabulary cannot appear outside `kernel/`.

### Docs

`scripts/docs/`:
- Active planning: `AUDIT-2026-04-21.md`, `COLDLIGHT-GAP-ANALYSIS.md`, `KNOWN-BUGS.md`,
  `NOTES-DEVTOOLS-REQUIREMENTS.md`, `POAM-MODEL-LOADER.md`, `POAM-SETUP-OVERLAY-CANONICAL.md`,
  `VERIFICATION.md`
- `adr/`, `analysis/`, `pipeline/`, `policy/`, `preflight/`, `specs/`, `sprints/`, `templates/`
- Sprint inventory: ~60+ sprint files in `sprints/` and `sprints/_archive/`

Root docs:
- `CLAUDE.md` (project rules), `CLAUDE_CODE_MASTERCLASS.md`, `CHANGELOG.md`, `HANDOFF.md`

---

## KNOWN GAPS (verified NOT on disk)

These paths are referenced in `docs/platform/Desktop.md` as authoritative spec
but were not present in the tree at audit time:

- `interfaces/desktop/src/lib/sys/registries/` — directory referenced by spec, does not exist
- `interfaces/desktop/src/lib/sys/generated/ROUTES.ts` — typed-routes generator output missing (the `check.typed-routes.ts` lint is wired, but there is no generated artifact to check against)
- `interfaces/desktop/src/lib/sys/generated/routes.inventory.json` — missing
- `interfaces/desktop/src/lib/sys/generated/api.catalog.json` — missing
- `interfaces/desktop/src/lib/domains/app/signals/` — engine signals travel through Tauri events today; no typed rune consumer domain authored yet
- `xtask smoke-test-portable` command — planned Phase 5C of the 2026-04-22 sprint, deferred

---

## UNCOMMITTED SPRINT WORK (2026-04-22 session)

The following lives in the working tree at time of this audit but was not
yet committed:

**Phase 1 — Terminology SSOT consolidation:**
- `systems/devpulse-engine/src/platform/services/manifest.rs` — `ServiceGroup` enum, `BootStepMeta`, `BOOT_STEP_MANIFEST` const, 4 SSOT tests (one cross-file reads the TS manifest)
- `systems/devpulse-engine/src/platform/boot/mod.rs` — `validate_critical` rewritten to use step_id strings
- `systems/devpulse-engine/src/platform/boot/graph.rs` — fixed `"Graph store (SurrealDB)"` skip-path step_id leak
- `interfaces/desktop/src/lib/sys/generated/service-manifest.ts` — new, mirrors Rust manifest; drift caught by `cargo test`
- `interfaces/desktop/src/lib/layouts/app/StatusBar.types.ts` — deleted hardcoded `STORE_NAMES` / `GRAPH_NAMES` / `AI_NAMES` Sets, delegates to generated `classifyStep`

**Phase 2 — Typed stage events with mpsc CSP pattern:**
- `xtask/src/events.rs` (new) — `StageEvent`, `EventSink` (single-writer thread + cloneable `EventSender`), `StageGuard` (enforces explicit resolution), `SummaryCounts`, 2 unit tests
- `xtask/src/commands/build_release.rs` — refactored `run` into `run` + `run_inner` wrapper, `EventSink` wired at 6 stage boundaries, SUMMARY section fires on both success and failure paths
- `xtask/src/stage.rs` — pre-existing `.unwrap()` on poisoned-mutex path replaced with explicit recovery

**Phase 3 — Build manifest + SHA256 checksums (SLSA-ready inputs):**
- `xtask/src/manifest.rs` (new) — `BuildManifest` (schema, product, vcs, toolchain, build, artifacts[]), streamed SHA256, ISO8601 timestamps via chrono, git/rustc/cargo/node/pnpm version capture, host identification, 3 tests including known-vector SHA256 checks
- `xtask/Cargo.toml` — `chrono` workspace dep added
- `xtask/src/commands/build_release.rs` — new Stage 10: Provenance, writes `target/release/build.manifest.json`

**Phase 4 — CycloneDX 1.4 SBOM:**
- `xtask/src/sbom.rs` (new) — `Bom`, `Component`, `Metadata`, `Tool`; Rust deps via `cargo_metadata` (already in xtask deps); npm deps via `pnpm list --json --depth=Infinity --prod` with `BTreeSet` dedup; 3 unit tests
- `xtask/Cargo.toml` — `uuid` dep added (required for CycloneDX `urn:uuid:` serialNumber)
- `build_release.rs` — new Stage 9: SBOM, writes `target/release/sbom.cdx.json`, recorded in manifest as `sbom-cyclonedx` artifact

**Phase 5A — `--portable-only` flag:**
- `xtask/src/main.rs` — `Commands::BuildRelease { portable_only: bool }` + threaded through to `BuildRelease` struct
- `xtask/src/commands/build_release.rs` — conditional `pnpm tauri build --no-bundle` invocation, skips installer enumeration when set, invokes `PackagePortable` task, records `portable-zip` artifact in manifest

**Verification at time of audit:**
- `cargo check -p devpulse-engine -p devpulse_desktop_backend -p xtask` — 0 errors
- `cargo test -p xtask` — 39/39 pass
- `cargo test -p devpulse-engine --lib platform::services::manifest::tests` — 4/4 pass
- `cargo clippy -p xtask --no-deps` — 0 new warnings in touched files (only pre-existing warnings remain)
- `pnpm check` — 0 errors, 0 warnings, 220 files

---

## BLOCKED ITEMS

1. **NSIS bundling failure** — needs a fresh `target/xtask-build-release.log`
   from a recent run to diagnose root cause. The `TauriStage` classifier in
   `build_release.rs` tags `NsisFailed` / `CandleFailed` / `LightReportedFailed`
   / `CompileSucceededBundleFailed` separately; owner needs to paste the
   transcript so we can match.

2. **Runtime verification of end-to-end launch** — code audit shows voice/signals/storage
   are all authored, but nobody has executed `build-release --portable-only`
   through to a launched, model-loaded, TTS-speaking, STT-transcribing binary
   in a single session this week. Compile-green ≠ runtime-green.

---

## KNOWN BUGS

See `scripts/docs/KNOWN-BUGS.md` for enumerated bugs including SD5, SurrealDB,
Svelte 5 rune edge cases, and Tailwind v4 specifics. Not transcribed here.

---

## RULES GOING FORWARD

1. **Disk beats doc.** If a doc says code does not exist, grep the tree first. If disk and doc disagree, disk wins and the doc gets updated in the same commit that discovers the disagreement.
2. **No sprint starts without owner approval.**
3. **Fix what's broken before building new.**
4. **Do NOT run builds.** Owner runs builds; assistant reads transcripts.
5. **Cross-platform paths.** No hardcoded Windows paths.
6. **Full error chains.** Never `anyhow::Context` over the real cause with a vague message.
7. **Delete dead code.** No deprecation paths, no back-compat shims. Pre-release mode.
8. **ColdLight owns all visual.** No raw HTML, no inline styles, no plain CSS outside the design system.
9. **Verify after every edit.** `cargo check -p <crate>` for Rust, `pnpm check` for Svelte.
10. **Every sprint doc starts dated.** `Last audit: YYYY-MM-DD` at the top. Staleness is a smell; kill it on sight.
