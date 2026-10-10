# S0 Research — Config Monolith Audit

**Date**: 2026-04-21
**Source**: Deep audit agent, ground-truth from source inspection (line numbers verified)
**Parent**: `SPRINT-FOUNDATIONAL-REBUILD-MASTER.md`
**Primary file**: `systems/devpulse-engine/src/platform/config.rs` (1,835 LOC)

---

## 1. Struct inventory (38 total)

### Public (TS-exported via specta::Type, 10)
- `PlatformConfig` (line 27) — `{ data_dir, portable, databases }`
- `DatabaseConfig` (line 38) — 10 booleans: `system_relational_enabled`, `system_analytics_enabled`, `system_graph_enabled`, `system_cache_enabled`, `user_relational_enabled`, `user_graph_enabled`, `global_graph_enabled`, `vector_enabled`, `grammar_enabled`, `devforge_enabled`
- `ExecutionLane` (line 73) — 14 enum variants (`BrainInference`, `HelperInference`, `EscalationInference`, `Embedding`, `Reranking`, `SpeechToText`, `TextToSpeech`, `VisionEmbedding`, `VectorRetrieval`, `RelationalQuery`, `AnalyticalQuery`, `CacheLookup`, `PromptAssembly`, `ThinkingPipeline`)
- `LaneToggle` (line 215)
- `LaneTraceConfig` (line 224)
- `RetrievalPreset` (line 738) — `Conservative | Balanced | Aggressive | Precision`
- `RetrievalConfig` (line 803)
- `RetrievalParamMeta` (line 828)
- `CatalogEntry` (line 1048)
- `CatalogOption` (line 1065)

### Internal boot (Deserialize only, 28)
- `PlatformBootConfig` (244) — root composition
- `PortableConfig` (264)
- `WindowsConfig` (278)
- `ScopedServicesConfig` (306) — `system`, `user`, `global`, `project`, `network`
- `SystemServicesConfig` (328) — 9 sub-configs
- `UserServicesConfig` (376), `GlobalServicesConfig` (396), `ProjectServicesConfig` (412)
- `ServiceRetryConfig` (426)
- `ServiceEntry` (456) — generic service with path + retry
- `GraphServiceEntry` (517) — adds `namespace`, `database`, `system_user`, `system_password`
- `ProjectGraphServiceEntry` (607)
- `CacheServiceEntry` (643), `VectorServiceEntry` (690)
- `ModelLoaderServiceEntry` (949), `ModelSubdirsConfig` (1012)
- `DevForgeServiceEntry` (1097) — includes dead `update_channel_url` field
- `ClaudeServiceEntry` (1170), `ClaudeLanesConfig` (1202), `LaneRateLimitEntry` (1232), `ClaudeCouncilConfig` (1260)
- `NetworkServicesConfig` (1313), `DevServerConfig` (1328), `GraphApiConfig` (1352)
- `BootGateConfig` (1376)
- `TelemetryBootConfig` (1550), `LaneTraceBootConfig` (1574)
- `RetrievalBootConfig` (895)
- `DataScope` enum (1402) — `System | User | Global | Project`
- `LanePreset` struct (1693) — 7 presets

---

## 2. TOML → struct mapping

| TOML | → | Struct |
|---|---|---|
| `00-portable.toml` | → | `PortableConfig::enabled` |
| `runtime.toml` | → | `BootGateConfig` + `WindowsConfig` + `TelemetryBootConfig` |
| `network.toml` | → | `NetworkServicesConfig` |
| `libsql.toml` | → | `ServiceEntry` (system.relational + user.relational) |
| `duckdb.toml` | → | `ServiceEntry` (system.analytics) |
| `surrealdb.toml` | → | `GraphServiceEntry` (system + user + global + project template) |
| `cache-vector.toml` | → | `CacheServiceEntry` + `VectorServiceEntry` |
| `model-loader.toml` | → | `ModelLoaderServiceEntry` + `ModelSubdirsConfig` |
| `devforge.toml` | → | `DevForgeServiceEntry` |
| `claude.toml` | → | `ClaudeServiceEntry` (mcp, sidecar, api, lanes, council, browser) |
| `model-catalog/{chat,minion,voice-stt,voice-tts,vision-search}.toml` | → | **NOT LOADED by engine** (kernel-owned) |
| `build/{deps,toolchain,repos}.toml` | → | **NOT LOADED by engine** (xtask-only) |

---

## 3. Loader entry point

- `Platform::boot()` → `PlatformBootConfig::load(&data_dir)`
- `PlatformBootConfig::load()` (lines 1437–1448):
  - Checks `{data_dir}/platform.toml`
  - Falls back to embedded `DEFAULT_CONFIG`
  - **NO merge/overlay** — user file REPLACES entire config

**Build-time embed** (line 241):
```rust
const DEFAULT_CONFIG: &str = include_str!(concat!(env!("OUT_DIR"), "/platform.default.toml"));
```
Composed from all TOML sources by the build script. Entire config baked into binary.

---

## 4. Consumer map (who reads config)

Files importing `use devpulse_engine::platform::config::`:
- `platform/boot/mod.rs` — boot orchestration
- `platform/boot/{relational, analytics, graph, cache, vector, model_loader, preflight}.rs` — service init
- `platform/telemetry/lanes.rs` — lane trace config
- `platform/mod.rs` — exports to frontend

**Public API**: `Platform::config()` (line 307) returns the **10-type public `PlatformConfig`** — not the 28-struct boot config.

**What frontend CANNOT query today**: service ports, paths, retry logic, credentials, boot timeout, critical gates, Windows settings, telemetry lanes (except the trace config enum), any `*ServiceEntry`.

---

## 5. Serde attributes audit

- **Zero `#[serde(deny_unknown_fields)]`** — silent drift on typos/extensions
- **Zero `#[serde(flatten)]`** — explicit scope hierarchy
- **Zero `#[serde(rename_all)]`** — snake_case matches TOML 1:1
- **47× `#[serde(default = "factory_fn")]`**
- **8× `#[serde(default)]`** (serde-native)
- All services are fully optional in TOML; missing sections hydrate from hardcoded factory functions

---

## 6. Specta / tauri-specta coverage

**Exported to TS (10 types)** — listed in §1 above.

**NOT exported** (all boot-internal):
- `PlatformBootConfig`, `BootGateConfig`, `WindowsConfig`
- All 11 `*ServiceEntry` types
- `NetworkServicesConfig`, `DevServerConfig`, `GraphApiConfig`
- `TelemetryBootConfig`, `LaneTraceBootConfig`
- `ModelLoaderServiceEntry`, `DevForgeServiceEntry`, `ClaudeServiceEntry`

Frontend cannot introspect service topology. Devtools today work around this by calling per-service health endpoints and parsing error strings.

---

## 7. Hardcoded defaults & credentials

### CREDENTIALS (security issue — in source control)
- `platform_devpulse/systems/devpulse-engine/src/platform/config.rs:565` — System SurrealDB password: `dp_sys_2026!`
- `platform_devpulse/systems/devpulse-engine/src/platform/config.rs:580` — User SurrealDB password: `dp_usr_2026!`
- `platform_devpulse/systems/devpulse-engine/src/platform/config.rs:595` — Global SurrealDB password: `dp_glb_2026!`

### OTHER HARDCODED
- Dev port: `1420`, Graph API port: `8822`, bind: `127.0.0.1`
- Boot timeout: `60s`, `require_all_critical: true`
- Cache: `max_capacity=10_000`, `ttl=300s`, `tti=60s`
- Model subdirs: `chat, voice, rag, vision`
- Retrieval preset: `"balanced"`, Lane preset: `"standard"`
- Windows retry: `5 max`, `200ms delay`, `max_path_depth=200`
- DevForge: `enabled=false` (lazy-start by design), `mode="reh"`, `workspace_path="."`

---

## 8. Gap vs owner's 12-item list

| Owner's item | Present in current? | Struct | TOML |
|---|---|---|---|
| system | ✓ (scattered) | `PlatformBootConfig` root + `SystemServicesConfig` | 4 files (portable, runtime, network, + many services) |
| devforge | ✓ | `DevForgeServiceEntry` | `devforge.toml` |
| libsql | ✓ | `ServiceEntry` (scoped) | `libsql.toml` |
| duckdb | ✓ | `ServiceEntry` | `duckdb.toml` |
| surrealdb | ✓ | `GraphServiceEntry` (scoped) | `surrealdb.toml` |
| candle | ✗ MISSING | none (kernel slot-managed) | none |
| sidecar ollama | ✗ MISSING | none (only referenced in `claude.toml`) | none |
| embedded ollama | ✗ MISSING | none | none |
| reasoning (RRO) | ✓ (as vector) | `VectorServiceEntry` | `cache-vector.toml` |
| chat | ✗ MISSING (kernel-owned) | none | `model-catalog/chat.toml` (not loaded) |
| rosetta_stone | ✗ MISSING | none | none |
| translator | ✗ MISSING | none | none |

**Blast radius of additions** (per item):
- `candle` — new `CandleConfig`, new boot stage, new TOML
- `ollama_sidecar`, `ollama_embedded` — new structs, boot stages, TOMLs
- `rosetta_stone`, `translator` — green-field; scope + contract need owner definition
- `chat` — kernel-owned today; decision: pull into engine config or keep in kernel

---

## 9. Extras not on owner's list

| Service | Struct | TOML | Purpose | Foldable? |
|---|---|---|---|---|
| audio | — | — | TTS playback thread (rodio) | → `capabilities/voice` |
| cache (Moka) | `CacheServiceEntry` | cache-vector.toml | In-memory KV, not RRO-specific | Split from vector — `stores/cache` |
| manifest | `ServiceMeta[]` | — | Boot order enumeration | Infra scaffolding — keep |
| project_db | — | — | Per-project LibSQL manager | `stores/project_db` |
| model_loader | `ModelLoaderServiceEntry` | model-loader.toml | Model discovery + catalog | `capabilities/model_runtime` |
| claude | `ClaudeServiceEntry` | claude.toml | MCP + sidecar + API lanes + council | `integrations/claude` |
| model-catalog/ | `CatalogEntry[]` | 5 TOMLs | Per-slot download UI | Kernel-owned, not engine |

---

## 10. Top 10 structural surprises

1. **Hardcoded SurrealDB passwords in source control** (config.rs:565/580/595) — charter must resolve credential strategy before S0 runs.
2. **Whole-file config replacement, no field-level merge** (config.rs:1440) — changing one setting requires rewriting the entire user TOML. Figment fixes this by design.
3. **Boot config opaque to frontend** — devtools can't introspect ports, paths, retry policy, timeouts. Every FooConfig needs specta export in the rebuild.
4. **All runtime knobs are restart-only** — telemetry lanes, boot gates, Windows retry all require restart. Charter must decide which become hot-tunable.
5. **Model-catalog TOMLs exist but aren't loaded by engine** — kernel-owned, wired via separate path. Charter needs to clarify kernel vs engine ownership per capability.
6. **Claude config crosses the engine/kernel boundary** — `ClaudeServiceEntry` wraps kernel types (`McpServerConfig`, `SidecarConfig`). Likely vocabulary/IP-protection leak risk.
7. **DevForge intentionally disabled by default** (lines 2–7) — lazy-starts on first user click. Keeps boot <10s. Pattern should generalize to other on-demand runtimes.
8. **No unified secret management** — 4 distinct credential stores (SurrealDB ×3, Claude API, DevForge update URL, ports). No vault/keyring integration.
9. **No `#[cfg(feature = ...)]` gating on SurrealDB** — binary is always linked even when `services.*.graph.enabled=false`. Relevant to standalone `.exe` binary-size.
10. **Factory defaults are 47 embedded functions** — moving defaults to external declarative registry is possible but breaks 47 call sites.

---

## Implications for S0 plan (raw findings — owner decides)

1. **Credentials** — must exit the source tree before S0 merges. Charter STOP C9 added.
2. **Figment overlay = true deep merge** — user edits one field, not the whole file. This is a user-facing win, not just architectural.
3. **Every module's config needs specta export** — mandatory per charter §6 artifact #2.
4. **`deny_unknown_fields`** — charter mandate; protects against silent drift.
5. **47 factory functions** — rebuild replaces with TOML `[defaults]` per module, loaded as figment's first provider layer.
6. **Whole-file embed via `include_str!`** — stays for offline fallback but becomes the last provider in the figment stack, not the whole input.
7. **Kernel-owned config boundaries** — charter must define which modules live in `kernel/` (chat is currently there) vs `systems/devpulse-engine/` (stores, runtimes, integrations). This is an IP-protection question.

---

## New STOP points surfaced

**C9** — Credential strategy (urgent, pre-S0):
- (A) Move to `{data_dir}/secrets/` with OS-level file perms
- (B) OS keychain via `keyring` crate
- (C) Encrypted TOML section with a master key derived from machine ID
- (D) Plaintext until profile wizard (S3) authors them; remove hardcoded defaults now, fail closed

**C10** — Kernel vs engine ownership for capabilities:
- `chat`, `reasoning`, `model-catalog` are kernel-owned today. Charter needs to decide whether:
  - (A) Engine config wraps kernel types (current pattern — but crosses IP boundary)
  - (B) Kernel exposes a facade that engine configures (translator layer)
  - (C) Each capability owns its own config regardless of kernel/engine location

**C11** — Partial override semantics:
- Figment deep merge is the default. Charter should decide:
  - Should arrays in overlay REPLACE or APPEND base arrays? (e.g., model catalog entries)
  - Should enums be case-sensitive? (currently: snake_case in TOML, PascalCase in Rust)

**C12** — Config version migration:
- Each module has `identity.version`. When a module bumps version, charter must define migration path for user overlays written against old schema.

---

## Verdict

**The current config system is a disciplined monolith with good patterns (factory defaults, retry policies, scoped services) but fatal gaps for the rebuild:**

- ✓ Works for boot. Services start, retry, gracefully degrade.
- ✗ No field-level overrides. User editing TOML is dangerous (whole-file replace).
- ✗ Frontend can't introspect. Every service is a black box.
- ✗ Credentials in source. Security incident waiting.
- ✗ No unified error type. Each service's boot errors are string-ified differently.
- ✗ Sync command dispatch wasn't informed by config — the stderr hang is cross-cutting.

**Rebuild scope for S0 is justified.** The monolith is not salvageable by surgical patches; the whole shape (module boundary, overlay semantics, frontend introspection, credential isolation) is wrong. Charter + figment-backed overlay + per-module specta export is the minimum viable rewrite.
