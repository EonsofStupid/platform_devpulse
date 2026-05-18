# Intelligence Layer — SSOT Roadmap

*Status as of 2026-05-15.*

The intelligence layer is the per-project memory + reasoning surface
that backs every cross-tool persistence flow in DevPulse — Claude
Code hooks, future MCP-protocol clients (Cursor, Antigravity,
Gemini CLI, Codex CLI), and any custom app that wraps DevPulse via
OpenRouter / Groq / xAI / OpenAI as a thin inference provider.

This doc is the single source of truth. Every file referenced here
is real. Every phase that says "DONE" is on `main` with the listed
`cargo check` / `pnpm check` evidence. Every phase that says
"QUEUED" or "PLANNED" has a concrete file list and exit criteria —
no "TODO wire this later" placeholders.

---

## Locked rules (non-negotiable)

These cross every phase. Violating any of them is a structural bug,
not a stylistic preference.

1. **Kernel vocabulary stays in `kernel/`.** Layman-facing names
   (`MemoryRecord`, `RroRecord`, `IntelligenceStore`) cross outward.
   The IP-boundary SSOT is
   [`systems/devpulse-engine/ip/kernel_terms.toml`](../../systems/devpulse-engine/ip/kernel_terms.toml).
2. **Project portability.** `target/` lives inside the workspace.
   The shipped Windows distribution is `devpulse/` containing the
   `.exe` plus a sibling `.userdata/` for runtime state. Build
   artifacts never escape to a drive root. The Windows MAX_PATH
   problem is solved by an xtask-managed `subst` virtual drive —
   see [`WINDOWS_BUILD_PATH.md`](./WINDOWS_BUILD_PATH.md).
3. **Connector-agnostic core.** `cortex::intelligence` knows
   nothing about SurrealDB. Backends implement the
   [`IntelligenceStore`](../../kernel/devpulse-clyffy/src/cortex/intelligence/store.rs)
   trait. Swapping a connector is a Cargo-feature flip + a wiring
   change at boot. The abstract layer never rebuilds.
4. **Typed throughout — no SurrealQL string interpolation.** Every
   identifier or user-supplied value flows in via `.bind(...)` on
   the SurrealDB typed query API. The `KvRecord` / `MemoryRecord`
   / `RroRecord` types are the contract. SQL injection is not a
   surface that exists.
5. **OS keyring is the SSOT for secrets.** Infisical (when wired)
   is a SYNC source/target — keyring stays the local read path so
   the frontend never sees raw credentials.
6. **Devtool dev-diagnostics discipline.** Devtools are for the
   developer verifying auto-managed system state. No wizard CTAs,
   no second-person tutorial copy, no "what this does" intros.
   Empty state is a bug state — points at the log target.
7. **`#[must_use]` build-env guards.** Anything that allocates a
   process-scoped resource (`subst` drive, sidecar handle) returns
   a guard that the caller binds for the resource's intended
   lifetime. Compiler enforces it.
8. **Model-layering discipline.** The 0.6B (Qwen3-0.6B) is the
   pre-sort layer — minion + Clyffy consume it for initial
   ranking + categorization. Deep reasoning (Nemotron / Phi /
   brain-class) activates ON pre-sorted content. SurrealDB +
   Qdrant are read during the rumination/reasoning dynamic
   stages, NEVER touched by the pre-sort. Continuous minion
   classification is the architectural pattern — there is no
   "reflection at SessionEnd" single-model pass. See
   `project_intelligence_model_layering.md`.

---

## Architecture map

```text
                ┌──────────────────────────────────────────────────────────┐
  raw events    │             0.6B Qwen3 — minion + Clyffy                 │
  (hooks /      │   ─ initial ranking                                      │
   MCP calls    │   ─ MemoryKind categorization                            │
   from any     │   ─ priority hint (0..=10)                               │
   client)      └────────────────────────────┬─────────────────────────────┘
        ────────►                            │
                                             ▼
              ┌────────────────────────────────────────────────────────────┐
              │  cortex::intelligence  (abstract — connector-agnostic)     │
              │    ├── record.rs   RroRecord (rkyv), MemoryRecord,         │
              │    │               MemoryKind, NeighborRef                 │
              │    ├── schema.rs   MEMORY_SCHEMA + EMBEDDING_DIM = 384     │
              │    ├── slug.rs     slug_for_cwd — canonical project key   │
              │    └── store.rs    trait IntelligenceStore                 │
              │                      init_project / save_memory / recall /│
              │                      relate / write_archive /             │
              │                      read_archive_bytes                   │
              └────────────────────────────┬───────────────────────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                │                          │                          │
                ▼                          ▼                          ▼
         persistence/                persistence/                persistence/
         surreal/                    surreal_cloud/              libsql/
         (DONE — Phase A)            (Phase E — cloud)           (post-MVP)
                │                          │
                │                          │
                ▼                          ▼
         SurrealKV embedded          surrealdb 3.x HTTP
         (file-locked,               (Basic Auth via
          read during                 OS keyring +
          rumination)                 Infisical sync)
                ▲
                │
                │  recall (vector + graph) — during
                │  rumination / reasoning dynamic stages
                │
              ┌─┴──────────────────────────────────────────────┐
              │  Deep reasoning (Nemotron-Nano-9B-v2 single,   │
              │  Phi 4-multimodal, brain-class models)         │
              │  ─ reads intelligence layer via recall         │
              │  ─ never writes — pre-sort owns the write path │
              └────────────────────────────────────────────────┘
```

The engine re-exports the abstract types + (future) cloud
connector at
[`devpulse_engine::platform::*`](../../systems/devpulse-engine/src/platform/mod.rs)
so the Tauri layer + MCP server never reach into `devpulse-clyffy`
directly.

---

## Phase status board

| Phase           | Status  | Surface                                       | Verification gate                          |
|-----------------|---------|-----------------------------------------------|--------------------------------------------|
| A               | DONE    | Abstract types + trait + embedded connector   | `cargo check -p devpulse-clyffy`           |
| xtask build env | DONE    | `subst` virtual drive — target stays in repo  | `cargo check -p xtask`                     |
| B               | DONE    | Devtool + `infer_download_folder` UI surface  | backend + svelte-check both GREEN          |
| C               | QUEUED  | Hooks ↔ MCP server bridge                     | hooks-via-MCP smoke test                   |
| D               | QUEUED  | 0.6B minion classifier (continuous pre-sort)  | minion classifies end-to-end               |
| E               | QUEUED  | Cloud connector + `devpulse-secrets`          | `--features connector-surreal-cloud` GREEN |
| F               | PLANNED | Deep-reasoning recalls intelligence layer     | cross-session recall demo lands            |
| G               | PLANNED | AGENTS.md auto-regen for non-MCP clients      | Codex reads regenerated AGENTS.md          |

---

## Phase A — Abstract layer + embedded connector — **DONE**

Connector-agnostic types, the `IntelligenceStore` trait, and a
working `impl IntelligenceStore for SurrealAdapter` against the
embedded `kv-surrealkv` store. `RroRecord` carries the rkyv
`Archive` derive so the zero-copy fast-path has its target shape.
`KvRecord` is the typed contract for `kv_set`/`kv_get`/`kv_delete`
(was dead code before — now consumed).

### Files

- [`kernel/devpulse-clyffy/src/cortex/intelligence/mod.rs`](../../kernel/devpulse-clyffy/src/cortex/intelligence/mod.rs)
- [`kernel/devpulse-clyffy/src/cortex/intelligence/record.rs`](../../kernel/devpulse-clyffy/src/cortex/intelligence/record.rs)
  — `RroRecord` (rkyv), `MemoryRecord` (`SurrealValue` + serde),
  `MemoryKind` (8 variants, both derives), `NeighborRef`
- [`kernel/devpulse-clyffy/src/cortex/intelligence/schema.rs`](../../kernel/devpulse-clyffy/src/cortex/intelligence/schema.rs)
  — `MEMORY_SCHEMA` SurrealQL string with HNSW index;
  `EMBEDDING_DIM = 384` constant
- [`kernel/devpulse-clyffy/src/cortex/intelligence/slug.rs`](../../kernel/devpulse-clyffy/src/cortex/intelligence/slug.rs)
  — `slug_for_cwd(&Path) -> String` + 4 unit tests
- [`kernel/devpulse-clyffy/src/cortex/intelligence/store.rs`](../../kernel/devpulse-clyffy/src/cortex/intelligence/store.rs)
  — `#[async_trait] trait IntelligenceStore`, `RecallHit` DTO
- [`kernel/devpulse-clyffy/src/cortex/persistence/surreal/intelligence_impl.rs`](../../kernel/devpulse-clyffy/src/cortex/persistence/surreal/intelligence_impl.rs)
  — embedded-Surreal `impl IntelligenceStore`. Project namespace
  fixed at `"projects"`, database = caller-supplied slug.
- [`kernel/devpulse-clyffy/src/cortex/persistence/surreal/client.rs`](../../kernel/devpulse-clyffy/src/cortex/persistence/surreal/client.rs)
  — typed scoped helpers (`upsert_typed_in_ns`,
  `select_typed_in_ns`, `delete_typed_in_ns`,
  `read_archive_bytes_in_ns`, `scoped_query`), inspector methods
  (`list_databases_in_ns`, `count_in_ns`), `KvRecord` promoted to
  `pub(crate)` and consumed by kv methods.
- [`kernel/devpulse-clyffy/Cargo.toml`](../../kernel/devpulse-clyffy/Cargo.toml)
  + [workspace `Cargo.toml`](../../Cargo.toml) — `rkyv = "0.8"`
  (default features) always-on.

### Verification

```bash
cargo check -p devpulse-clyffy   # 0 errors, 0 warnings
```

The MemoryKind serde roundtrip + slug edge cases are covered by
unit tests in `record.rs` and `slug.rs`.

---

## xtask build env — `subst` virtual drive — **DONE**

`llama-cpp-sys-2`'s nested `vulkan-shaders-gen` `TryCompile`
trips Windows MAX_PATH. The fix that keeps `target/` inside the
workspace is a per-process `subst <letter>: <workspace>\target`.
Physical files stay in the workspace; the build pipeline sees
short paths. Cleanup on guard drop.

### Files

- [`xtask/src/workspace.rs`](../../xtask/src/workspace.rs) —
  `BuildEnvGuard`, `mount_short_target_drive`,
  `find_free_drive_letter`. `apply_env` returns
  `#[must_use] BuildEnvGuard`.
- [`xtask/src/commands/build_release.rs`](../../xtask/src/commands/build_release.rs)
  / [`dev.rs`](../../xtask/src/commands/dev.rs) /
  [`regen_bindings.rs`](../../xtask/src/commands/regen_bindings.rs)
  / [`verify.rs`](../../xtask/src/commands/verify.rs) — all four
  bind `let _build_env = ...` for the cargo-invocation lifetime.
- [`docs/platform/WINDOWS_BUILD_PATH.md`](./WINDOWS_BUILD_PATH.md)
  — operator reference + the three rejected alternatives.

### Verification

```bash
cargo check -p xtask             # 0 errors, 0 warnings
```

### Three rejected approaches (don't re-litigate)

1. `CMAKE_OBJECT_PATH_MAX=32767` only — TryCompile sub-builds
   don't inherit it.
2. Windows long-paths registry + `git core.longpaths` — empirically
   does not rescue cl.exe's TryCompile temporaries on the v14.44
   toolchain (verified 2026-05-15).
3. `CARGO_TARGET_DIR` outside the workspace — breaks the
   portability discipline.

---

## Phase B — Devtool surface + `infer_download` exposure — **DONE**

Per-project memory inventory + bucket prediction probe + filename
classifier, surfaced under `/devtools/clyffy/memory/intelligence`.
Read-only in V1 (no destructive verbs until Phase C lands the
guarded write surface).

### Files

**Kernel exposures:**
- [`kernel/model-loader/src/models/download.rs:979`](../../kernel/model-loader/src/models/download.rs)
  — `infer_download_folder` promoted to `pub`.
- [`kernel/model-loader/src/lib.rs`](../../kernel/model-loader/src/lib.rs)
  — `pub use models::download::infer_download_folder;`
  (cfg-gated to `candle-backend`).

**Engine re-exports:**
- [`systems/devpulse-engine/src/platform/mod.rs`](../../systems/devpulse-engine/src/platform/mod.rs)
  — IntelligenceStore + the intelligence record types + the
  `infer_download_folder` function are all re-exported at
  `devpulse_engine::platform::*`. Engine `candle` feature gates the
  `infer_download_folder` re-export.

**Tauri commands:**
- [`interfaces/desktop/src-tauri/src/commands/intelligence/mod.rs`](../../interfaces/desktop/src-tauri/src/commands/intelligence/mod.rs)
  — `intel_status`, `intel_list_projects`,
  `infer_capability_bucket`. DTOs `IntelStatus` + `ProjectIntel`
  derive `specta::Type`.
- [`interfaces/desktop/src-tauri/src/commands/mod.rs`](../../interfaces/desktop/src-tauri/src/commands/mod.rs)
  — `pub mod intelligence;`.
- [`interfaces/desktop/src-tauri/src/lib.rs`](../../interfaces/desktop/src-tauri/src/lib.rs)
  — three new entries in `collect_commands![...]`.

**Devtool UI:**
- [`interfaces/desktop/src/lib/devtools/_shared/serviceAccents.ts`](../../interfaces/desktop/src/lib/devtools/_shared/serviceAccents.ts)
  — `intelligence: "cyber"`.
- [`interfaces/desktop/src/lib/devtools/registry.ts`](../../interfaces/desktop/src/lib/devtools/registry.ts)
  — registry entry inserted between `cortex` and `persona-graph`
  under `bucket: "memory"`. Icon `BrainCircuit`.
- [`interfaces/desktop/src/lib/devtools/clyffy/memory/intelligence/feature/IntelligenceDevtool.svelte`](../../interfaces/desktop/src/lib/devtools/clyffy/memory/intelligence/feature/IntelligenceDevtool.svelte)
  — feature component. 5 tabs (Status / Config / Logs / Actions
  / Debug). Uses raw `invoke<T>(...)` so it compiles independently
  of the next `cargo xtask regen-bindings` cycle.
- [`interfaces/desktop/src/lib/devtools/clyffy/memory/intelligence/index.ts`](../../interfaces/desktop/src/lib/devtools/clyffy/memory/intelligence/index.ts)
  — barrel.
- [`interfaces/desktop/src/routes/(devtools)/devtools/clyffy/memory/intelligence/+page.svelte`](../../interfaces/desktop/src/routes/(devtools)/devtools/clyffy/memory/intelligence/+page.svelte)
  — thin route shell.

### Verification

```bash
cargo check -p devpulse_desktop_backend   # 0 errors, 0 warnings
pnpm svelte-check                          # 220 files, 0 errors, 0 warnings
```

---

## Phase C — Hooks ↔ MCP server bridge — **QUEUED**

Make the hooks the thin client and the MCP server the truth. Every
session-boundary state change flows: hook → MCP stdio call →
`IntelligenceStore` method → SurrealAdapter. Cross-tool: Cursor /
Antigravity / Gemini CLI / Codex CLI point their `mcp.json` at the
same MCP binary and read the same `projects/<slug>` database.

**Scope discipline.** In Phase C the caller (hook or client)
supplies the `MemoryKind` directly — there's no smart classifier
yet. That's deliberate: Phase C delivers the persistence pipeline.
Phase D drops in the 0.6B minion classifier that auto-derives
`MemoryKind` + priority from raw input, replacing the
caller-supplied value.

### What needs to land

**1. Engine wires `IntelligenceStore` into the MCP server.**

- [`systems/devpulse-engine/src/claude/mcp/mod.rs`](../../systems/devpulse-engine/src/claude/mcp/mod.rs)
  — `DevPulseMcpServer` gains an `Arc<dyn IntelligenceStore>`
  field (filled at boot via `Platform::graph().adapter()`).
- New `#[rmcp::tool]` methods:
  - `intel_init_project(slug)` → applies `MEMORY_SCHEMA` to
    `projects/<slug>`.
  - `intel_save_memory(text, kind, priority)` → embeds via
    `CandleEmbedder`, dedupes (cosine > 0.92 → update existing),
    inserts. Returns the surviving id. Caller supplies `kind` +
    `priority` in V1 (Phase D auto-derives them via the minion).
  - `intel_recall(query, top_k, kind?)` → embed + HNSW knn, returns
    `Vec<RecallHit>`.
  - `intel_relate(from_id, to_id, edge)` → typed RELATE.
  - `intel_write_archive(memory_id, rro_record)` →
    `rkyv::to_bytes` + `write_archive`.
  - `intel_read_archive(memory_id)` → `Option<Vec<u8>>` for
    zero-copy reload via `RroRecord::access`.
  - `intel_slug_for_cwd(cwd)` → the canonical slug, computed in
    the kernel and returned over MCP so every client uses one
    implementation (see decision C-2 below).

**2. Engine boot must guarantee `CandleEmbedder` ready.**

- The embedder lives at
  [`kernel/devpulse-clyffy/src/cortex/persistence/embedder/mod.rs`](../../kernel/devpulse-clyffy/src/cortex/persistence/embedder/mod.rs).
- Decision C-1 (see below): try-with-retry, then hard-fail.
  Boot path constructs `Arc<CandleEmbedder>` with N retries;
  if every retry fails the engine boot itself fails. No
  "EmbedderNotReady" graceful state in V1. Graceful fallback
  comes once reliability is proven.

**3. Hooks become thin MCP stdio clients.**

- [`.claude/hooks/restore-memory.js`](../../.claude/hooks/restore-memory.js)
  — replaces the curl-against-Surreal HTTP path with an MCP stdio
  call. Slug derived via the `intel_slug_for_cwd` MCP tool —
  hooks never re-implement the slug rule.
- [`.claude/hooks/save-state.js`](../../.claude/hooks/save-state.js)
  — same. PreCompact writes a structured checkpoint, not just a
  timestamp.
- [`.claude/hooks/save-chat.js`](../../.claude/hooks/save-chat.js)
  — UserPromptSubmit calls `intel_recall` to inject top-K relevant
  context as additionalContext.
- [`.claude/settings.json`](../../.claude/settings.json) — add
  `PostCompact` hook so context re-injects after auto-compaction.
  Explicit `matcher: "startup|resume|clear|compact"` on the
  existing `SessionStart` hook for clarity (its no-matcher default
  fires on compact per the Claude Code docs, but explicit is
  better).

**4. Devtool Actions tab gains the guarded write surface.**

- [`interfaces/desktop/src-tauri/src/commands/intelligence/mod.rs`](../../interfaces/desktop/src-tauri/src/commands/intelligence/mod.rs)
  gains write commands behind a typed-confirmation guard pattern:
  `intel_init_project_for_cwd`,
  `intel_wipe_project(slug, confirmation)`,
  `intel_rebuild_hnsw(slug, confirmation)`. The `confirmation`
  arg is a string the operator types verbatim — the command rejects
  any mismatch. Matches the existing destructive-verb pattern in
  `commands::devforge` (look there for the precedent).

**5. Cross-tool `mcp.json` files (zero-config tool compatibility).**

- `.cursor/mcp.json` — points `cursor-mcp` at the same DevPulse MCP
  binary.
- `.antigravity/mcp.json` — same for Google Antigravity.
- `.gemini/mcp.json` — same for Gemini CLI.
- `.codex/mcp.json` — same for OpenAI Codex.

### Decisions resolved

**C-1 — CandleEmbedder boot ordering.** Decided 2026-05-15.

The embedder is EMBEDDED — boot reliably ought to have it ready.
Asking the question at runtime is already a smell. V1 stance:
**try-with-retry, then hard-fail.** Engine boot constructs the
embedder with N retries (initial N = 3, 500 ms backoff); if every
retry fails, boot itself fails. No "EmbedderNotReady" graceful
state. Graceful fallback lands only once reliability is empirically
proven — see Phase F open question for the trigger.

The retry/hard-fail discipline matches the senior-dev-strict
default ([feedback_senior_dev_default_approach](../../C:/Users/jessa/.claude/projects/d--localdev-platform-devpulse/memory/feedback_senior_dev_default_approach.md))
— investigate the underlying issue, not the symptom.

**C-2 — Slug derivation across clients.** Decided 2026-05-15.

Hooks (and any future MCP client) call the `intel_slug_for_cwd`
MCP tool. The kernel function is the only implementation;
clients never re-port the rule.

Rationale: a per-language port plus a CI drift-check is 50+ lines
of test scaffolding to maintain a 30-line function. An MCP tool
call costs ~1 ms over stdio. The tool already exists trivially as
a wrapper around the existing kernel function; no duplication
surface. Future Cursor / Antigravity / Codex clients also get the
correct slug for free — they call the same MCP tool.

Implementation note: `intel_slug_for_cwd` is added to the MCP
server alongside the other intel_* tools in step 1 above.

**C-3 — Where does `MemoryKind` come from in Phase C.** Decided
2026-05-15.

Caller-supplied. The hook (or any other MCP client) passes
`kind` + `priority` to `intel_save_memory` directly in V1.
This is intentional: Phase C is the persistence pipeline.

The 0.6B minion that auto-derives `kind` + `priority` from raw
input ships as Phase D, replacing the caller-supplied value.
Phase C → Phase D is a swap of the upstream classifier; the
intel_save_memory contract doesn't change.

### Exit criteria

1. `cargo check -p devpulse-clyffy` + `cargo check -p devpulse-engine` +
   `cargo check -p devpulse_desktop_backend` all GREEN with 0 warnings.
2. End-to-end smoke test: open Claude Code in this workspace →
   restore-memory hook reports `projects/platform_devpulse` namespace
   initialized → save a prompt with caller-supplied `kind: Prompt` →
   recall it later in the same session via `intel_recall`.
3. Devtool Actions tab successfully runs `intel_init_project_for_cwd`
   against the current workspace (and `intel_status` reflects the new
   project in the Status tab).
4. `.claude/hooks/` no longer contains direct curl-to-Surreal HTTP
   calls. Every persistence path routes through MCP stdio.
5. CandleEmbedder boot retries + hard-fails per decision C-1;
   tracing shows the retry count when reliability stutters.

---

## Phase D — 0.6B minion classifier (continuous pre-sort) — **QUEUED**

Drops in the smart classifier upstream of `intel_save_memory`.
Replaces caller-supplied `MemoryKind` + priority with automated
derivation from raw input. Minion is a dedicated OS process per
[`project_minions_are_processes`](../../C:/Users/jessa/.claude/projects/d--localdev-platform-devpulse/memory/project_minions_are_processes.md)
— never a tokio task — so classification runs async + decoupled
from the main hook path.

**Scope discipline.** Phase D doesn't change the
`intel_save_memory` contract on the MCP server. It changes WHO
calls it: instead of the hook directly with `(text, kind=Prompt,
priority=5)`, the hook sends the raw event to the classifier
minion, which calls `intel_save_memory(text, kind, priority)` with
the derived classification. Hooks that have already classified the
input (e.g. structured tool calls) can bypass the minion and call
the MCP tool directly — same path, just skipping the smart layer.

### What needs to land

**1. Classifier minion process.**

- New crate or new module under
  [`kernel/devpulse-clyffy/src/cortex/minions/`](../../kernel/devpulse-clyffy/src/cortex/minions/)
  hosting the classifier minion. Per
  `project_minions_are_processes`, it's a dedicated OS process,
  not a tokio task.
- Boots a Qwen3-0.6B llama.cpp instance (uses the existing
  llama-cpp-ffi backend). Model lives at the existing per-project
  models cache.
- Exposes a small RPC surface (IPC of choice — pipe / unix socket
  on POSIX, named pipe on Windows). Input shape:
  `ClassifyRequest { text: String, source: String, context_hint: Option<String> }`.
  Output shape: `Classification { kind: MemoryKind, priority: u8, rationale: String }`.
- Classification prompt template + few-shot examples land alongside
  the minion. The 8 `MemoryKind` variants are the closed set.

**2. MCP layer routes through the minion.**

- New MCP tool `intel_classify_and_save(text, source)` →
  internally: send to classifier minion → receive
  `Classification` → call `intel_save_memory(text, kind,
  priority)`. Single round-trip on the MCP caller's side.
- The existing `intel_save_memory(text, kind, priority)` from
  Phase C stays. Both paths coexist — clients that already have a
  classification skip the minion, clients with raw input go
  through `intel_classify_and_save`.

**3. Engine lifecycle for the minion.**

- Boot path spawns the minion alongside other Platform services.
- Health probe + restart policy per the existing managed-sidecar
  pattern (Ollama is the reference — see
  [`kernel/devpulse-clyffy/src/cortex/persistence/ollama.rs`](../../kernel/devpulse-clyffy/src/cortex/persistence/ollama.rs)).
- Hot-update support per `HOT_UPDATE_PATTERN.md` — swap the
  classifier model (e.g. drop in a different 0.6B variant) without
  process restart.

**4. Hooks adopt `intel_classify_and_save`.**

- [`.claude/hooks/save-chat.js`](../../.claude/hooks/save-chat.js)
  + any other hook that today calls `intel_save_memory` switches to
  `intel_classify_and_save` for raw user / tool events. Structured
  events (where the kind is known) still call the direct method.

**5. Devtool surface for the minion.**

- New devtool at `/devtools/clyffy/memory/minion-classifier` (or
  promoted to a top-level "Classifier" entry under
  `bucket: "memory"`). Shows: classifier minion status, last 20
  classifications, classification latency distribution. Per the
  locked devtool standard — Status / Config / Logs / Actions /
  Debug tabs.

### Open questions

- **Minion model footprint vs. ambient idle cost.** Q3 of the
  earlier roadmap. Qwen3-0.6B at q4 is ~400 MB resident. Always-
  hot vs. on-demand spawn. Always-hot wins on latency (no cold
  start per prompt) but parks 400 MB across all dev sessions.
  Decision before authoring the lifecycle code.
- **IPC channel.** Stdio over the spawned process (simplest, works
  cross-platform), unix domain socket / Windows named pipe
  (faster, more involved), or shared memory ring (lowest latency,
  most complex). Default would be stdio for V1, upgrade later if
  hot-path latency demands it.
- **Few-shot examples bootstrapping.** The 8 `MemoryKind` variants
  need example classifications to anchor the model. Hand-author
  ~3 per kind (24 total), commit them to the kernel crate, allow
  override via per-project TOML.

### Exit criteria

1. `cargo check -p devpulse-clyffy` GREEN with the new minion code,
   0 warnings.
2. Minion boots from cold to ready in <2 s on a warm-cache build.
3. End-to-end: a hook calls `intel_classify_and_save("we decided
   to use rkyv for archive serialization", "user")` → minion
   classifies as `MemoryKind::Decision` priority `7-8` → memory
   row appears in `projects/<slug>/memories` with the right kind.
4. Devtool's classifier panel shows the last classification + its
   latency.
5. Hot-update: swap the classifier model file → minion restarts
   (or hot-swaps if `HotUpdateable` is wired) → next classification
   uses the new model — no engine restart.

---

## Phase E — Cloud Surreal connector + `devpulse-secrets` — **QUEUED**

Second connector implementing `IntelligenceStore` against cloud
SurrealDB (HTTP/Basic-Auth), plus a peer-crate SSOT for OS-keyring
secrets with optional Infisical sync.

**Independent of Phase C/D.** This phase is about connector
plumbing, not the intelligence-layer write/read shape. Can land
before, during, or after the minion work.

### What needs to land

**1. New peer crate `systems/infra/devpulse-secrets`.**

```text
systems/infra/devpulse-secrets/
  Cargo.toml
  src/
    lib.rs
    keyring.rs           KeyringClient::resolve / store / delete
    provider.rs          ProviderId enum SSOT (extended:
                         SurrealdbCloud, ClickhouseCloud, TursoCloud,
                         plus all existing AI provider ids)
    infisical/           feature `infisical-sync`
      client.rs          Universal Auth (client-id+secret → JWT)
      sync.rs            pull(env_scope) → write keyring;
                         push(provider, value) → write Infisical
      mod.rs
```

- The four existing Tauri commands at
  [`interfaces/desktop/src-tauri/src/commands/credentials/mod.rs`](../../interfaces/desktop/src-tauri/src/commands/credentials/mod.rs)
  refactor into thin wrappers over `devpulse-secrets::KeyringClient`.
  Single SSOT — kernel and Tauri facade consume the same crate.

**2. New connector `cortex/persistence/surreal_cloud/`.**

```text
kernel/devpulse-clyffy/src/cortex/persistence/surreal_cloud/
  config.rs              SurrealCloudConfig { endpoint, namespace,
                         database, provider_id }
  client.rs              reqwest HTTP, lowercase `surreal-ns` /
                         `surreal-db` headers, Basic Auth resolved
                         from `devpulse-secrets`
  lifecycle.rs           boot / ping / shutdown — mirrors the
                         Ollama service pattern
  intelligence_impl.rs   impl IntelligenceStore for
                         SurrealCloudClient
  mod.rs
```

- Cargo feature `connector-surreal-cloud` on
  `kernel/devpulse-clyffy/Cargo.toml`. OFF by default. ON in the
  desktop bundle when shipping cloud-aware builds.

**3. Engine boot picks a connector via boot config.**

- `[intelligence.connector]` in the platform config TOML accepts
  `embedded` (default) or `cloud`. Boot routes through the picked
  connector and stores it as `Arc<dyn IntelligenceStore>` on
  `Platform`.

**4. Infisical sync — feature `infisical-sync`.**

- Boot-time pull (`devpulse-secrets::infisical::sync::pull`)
  populates the keyring from the configured Infisical environment.
- Optional push-back on credential writes for audit / multi-device
  consistency.
- Memory rule update: the existing
  `project_secrets_keyring_ssot.md` line "NEVER Infisical" needs
  to be rewritten — keyring is still the local SSOT; Infisical is
  the remote sync source/target. Update is part of this phase.

### Open questions

- **Cloud connector storage alignment.** The eventual ambition is
  surrealkv + qdrant sharing a KV backend. The cloud connector
  sidesteps this entirely (cloud handles its own storage). Decide
  whether the eventual unified-KV work targets only embedded /
  remains compatible across both.
- **Per-tool keyring entries vs project-scoped.** A single
  `devpulse_engine:dp_sys_2026!` credential vs per-project rotation.
  Multi-tenant safety wants the latter; dev ergonomics wants the
  former. Picking one before authoring the connector saves a
  refactor.

### Exit criteria

1. `cargo check -p devpulse-secrets` GREEN.
2. `cargo check -p devpulse-clyffy --features connector-surreal-cloud`
   GREEN.
3. `cargo check -p devpulse-secrets --features infisical-sync` GREEN.
4. Boot-time switch: `[intelligence.connector] = "cloud"` flips
   the active connector; the existing intelligence devtool reads
   the cloud namespace identically.

---

## Phase F — Deep-reasoning integration — **PLANNED**

Connects the brain-class reasoning model to the intelligence
layer. During rumination / reasoning dynamic stages, the brain
queries the intelligence layer for vector + graph context and
hydrates `RroRecord` archives zero-copy. This is what closes the
loop: classified memories from Phase D actually shape reasoning
outputs.

### What it ships

- **Recall during rumination.** The brain runtime (Burn-authored
  RRO encoder + the constrained-decoding pipeline) calls
  `intel_recall` against the active project namespace when the
  reasoning model enters a rumination/extending-thinking-budget
  stage. Top-K vector hits expand into 1-hop graph neighborhoods
  for richer context.
- **rkyv archive read path.** `intel_read_archive(memory_id)`
  returns aligned bytes; the brain calls `RroRecord::access` for
  zero-copy access to the precomputed reasoning context. This is
  the "JIT property" — work done at write time becomes near-instant
  at read time.
- **Cortex-surface labels reflect intelligence state.** The
  rotating "Thinking" label (per
  `project_cortex_surfaces`) shows `Ruminating` /
  `Extending thinking budget` /
  `Reasoning with others` and reflects whether the brain is
  currently in a memory-aware vs context-blind phase.
- **End-to-end demo.** Save a `Decision` in session 1 → close the
  session → in session 2, the brain spontaneously recalls the
  decision when the operator asks an adjacent question.

### Open questions

- **Reliability gate for the graceful-fallback CandleEmbedder
  state.** Decision C-1 deferred this. Phase F is the natural
  point to revisit: if the embedder has run for N continuous
  sessions without a single boot-retry, graceful fallback is
  greenlit; otherwise the hard-fail discipline stays.
- **Council vs single-brain reads.** Per
  `project_seamless_gpu_nemotron_seed`, the seed model bench is
  Nemotron single vs Qwen3-0.6B × 4 parallel-vote council.
  Decision: which path reads from the intelligence layer? A
  council may want per-member recall (different K per member) for
  diversity; single-brain is simpler.

### Exit criteria

1. End-to-end demo: cross-session recall lands as part of the
   reasoning model's output, not as a hand-injected context line.
2. Cortex thinking-label rotates correctly per phase
   (`Ruminating` ↔ `Reasoning with others` ↔ `Extending thinking
   budget`).
3. rkyv archive read path measured to <1 ms p95 on warm cache —
   confirms the zero-copy fast-path.

---

## Phase G — AGENTS.md auto-regen — **PLANNED**

Cross-tool fallback for any tool that can't speak MCP. The MCP
server regenerates a top-level `AGENTS.md` from the current
intelligence state on every `checkpoint` event (PreCompact /
SessionEnd / explicit verb). OpenAI Codex / Cursor / Gemini CLI /
Antigravity / Cline all read `AGENTS.md` per the early-2026 cross-
tool convention; tools that don't speak MCP still get current
context.

### Exit criteria

- A repo-root `AGENTS.md` exists, lists active project decisions
  + recent learnings, is regenerated on `checkpoint`.
- Loading the repo in Codex CLI surfaces the same locked rules
  Claude Code does via CLAUDE.md.

---

## Cross-references

- Memory roots, current at 2026-05-15: every file in
  [`C:\Users\jessa\.claude\projects\d--localdev-platform-devpulse\memory\`](../../../../../Users/jessa/.claude/projects/d--localdev-platform-devpulse/memory/)
  — locked rules + project context drive every phase decision
  above.
- Model layering SSOT:
  `project_intelligence_model_layering.md` — the 0.6B
  pre-sort discipline.
- Minion process discipline: `project_minions_are_processes.md`.
- Devtool standard: `project_devtool_standard.md` +
  `project_devtool_modular_layout.md` +
  `feedback_devtools_are_dev_diagnostics.md`.
- Connector pattern reference: `project_service_pattern.md`
  (Ollama is the canonical reference).
- Service-pattern boot ordering: `HOT_UPDATE_PATTERN.md` for
  RRD encoder hot-swap (same Drop-guard discipline as
  `BuildEnvGuard`).
- Constrained-decoding integration:
  `project_rro_is_constrained_decoding.md` — RRO encoder is the
  Burn-authored shape that produces `RroRecord` embeddings in
  the eventual fast-path.
- Cortex surfaces:
  `project_cortex_surfaces.md` — the
  `Thinking` rotating label is the user-visible state during
  Phase F rumination.
- Senior-dev strict default:
  `feedback_senior_dev_default_approach.md` — drives the C-1
  hard-fail decision.
- Windows build path: [`WINDOWS_BUILD_PATH.md`](./WINDOWS_BUILD_PATH.md).
- Seamless GPU foundation:
  [`SEAMLESS_GPU_FOUNDATION.md`](./SEAMLESS_GPU_FOUNDATION.md) —
  the same xtask `apply_env` path that runs the `subst` mount
  also drives the GPU+CPU acceleration auto-detect.

---

## How to keep this doc honest

This is the SSOT. Every change to the intelligence layer is also
a change to this doc. Concrete rules:

1. **Move a phase to DONE only when its exit criteria pass.** Cite
   the exact `cargo check` / `pnpm check` invocations and the warning
   count.
2. **Add files to the file list as you author them.** No
   placeholder paths. If a file is planned but not authored, it's
   in the "What needs to land" section, not the file list.
3. **Update the architecture map when a connector is added.** The
   ASCII diagram is authoritative — if the code diverges, fix the
   doc in the same PR that diverged.
4. **Close out open questions in the phase they belong to.** When
   a decision is made (e.g. minion model footprint), the open
   question moves to a "Decisions resolved" block in the phase
   body with the date and rationale. Don't leave dead "TBD"
   lines.
