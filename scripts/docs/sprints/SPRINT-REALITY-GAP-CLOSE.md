# SPRINT — Reality Gap Close

**Date:** 2026-04-21
**Research:** [SPRINT-REALITY-GAP-CLOSE.research.md](./SPRINT-REALITY-GAP-CLOSE.research.md)
**Status:** DRY RUN — awaiting owner decisions at each STOP
**Foundational link:** extends [SPRINT-FOUNDATIONAL-REBUILD-MASTER.md](./SPRINT-FOUNDATIONAL-REBUILD-MASTER.md), applies the 8-artifact charter from [SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md](./SPRINT-FOUNDATIONAL-REBUILD-MODULE-CHARTER.md) to the gaps.

---

## Goal

Close the four real gaps surfaced by the 2026-04-21 audit so that NO devtool surface lies about what it does, and the Ollama runtimes either exist or are transparently marked out-of-scope. Every service touched gets the full 8-artifact charter.

---

## Scope — In

G1. **Ollama sidecar** — entire feature built. Service, 4 Tauri commands, devtool wiring.
G2. **`llama_cpp_embedded`** (renamed from "ollama embedded" — see STOP-2) — link `llama-cpp-2`, third inference backend, OR explicitly scoped out with correct name in place.
G3. **Candle devtool surface** — backend exists, add the devtool commands + frontend wiring.
G3b. **Candle model coverage hardening** — author canonical-model config table covering every model folder currently on disk; verify Qwen3.5-9B safetensors + Qwen3-35B-A3B MoE + Phi-4-mini actually load and generate; unstub the PersonaPlex-7B Moshi backend per STOP-5.
G4. **Cache devtool surface** — audit backend (may or may not exist), add commands + frontend wiring.
G5. **Project DB frontend wiring** — backend commands exist, frontend just never calls them.
G6. **SurrealDB Config/Logs/Actions tabs** — fill the 3 placeholder tabs.
G7. **Ship honesty layer** — every placeholder that remains after this sprint gets a dated `TODO(reality-gap):` comment naming the command it awaits.

## Scope — Out

- Kokoro per-voice style vectors (known rough edge, separate sprint).
- Whisper progressive/streaming decode (known rough edge).
- Mic detection in `get_voice_status` (known rough edge).
- Any NEW service not in G1–G6.
- Refactoring the legacy `Service` trait — services we touch adopt `ManagedModule`; existing store services keep their current trait until their own migration sprint.

---

## STOP-1 — Ollama sidecar scope

**Question:** What must "Ollama sidecar" do to be called DONE in this sprint?

**Options:**
| Option | What it means | Effort | Owner value |
|--------|---------------|--------|-------------|
| A. Process-lifecycle only | Spawn `ollama serve` against a bundled or PATH-resolved binary. Health via `GET /api/tags`. Devtool Start/Stop/Restart works. No chat integration. | ~400 LOC backend + 100 LOC frontend | Devtool button proves Ollama is running. Chat still uses Candle. |
| B. A + chat routing | A, plus a `backend: "ollama" \| "candle"` slot option so chat can pick Ollama instead of Candle. Streaming token bridge to the shell. | A + ~300 LOC | Owner can chat against an Ollama model today. |
| C. A + B + model-manifest | A + B + UI to `pull` / `list` / `delete` Ollama models from the devtool. | A + B + ~400 LOC frontend | Full Ollama replacement experience. |

**Impact:** Locks whether Candle remains the sole inference backend OR becomes one of two.
**Recommendation:** **A.** Prove the lifecycle end-to-end first. B and C are follow-on sprints with clear seams. Owner chat integration already works via Candle.

---

## STOP-2 — "Ollama embedded" scope + naming

**Correction (2026-04-21):** First-pass audit recommended deletion on the premise that Candle covers what "Ollama embedded" would deliver. That premise was wrong. Candle only implements a handful of architectures (audit confirmed `qwen3`, `phi3`, `llama` quantized loaders). llama.cpp / Ollama supports hundreds of architectures via GGUF. For "bring any model," Candle is not a true replacement.

Additionally: there is no "Ollama as a Rust library." The honest accurate name for the in-process lane is `llama_cpp_embedded` — linking the `llama-cpp-2` (or `llama-cpp-rs`) crate directly. Keep the customer-facing label "embedded" but rename the slot, service, config, and commands.

**Question:** How do we close this gap — build it, or defer honestly?

**Options:**
| Option | What it means | Capability vs Candle | Risk |
|--------|---------------|----------------------|------|
| **A. Build `llama_cpp_embedded`** | Link `llama-cpp-2` crate. Third inference backend alongside Candle + Ollama sidecar. Slot-selectable `backend: "candle" \| "llama_cpp" \| "ollama"`. | Covers the long tail Candle misses. No subprocess, no external binary. | MEDIUM. Build-time C++ dependency. Cross-compile footprint. But the crate is mature. |
| B. Only keep Ollama sidecar lane | Delete `ollama_embedded/*` from frontend + config. Sidecar alone. | User must install `ollama` or we ship it as a ~1GB sidecar. | LOW for scope, HIGH for install friction. |
| C. Defer with dated TODO | Keep placeholder page. Rename slot to `llama_cpp_embedded` NOW so we don't lie about what it is. Add `TODO(reality-gap 2026-04-21)`. | None this sprint. | LOW. Clutter but honest. |

**Impact:** Decides whether DevPulse ships with broad model coverage in-process, or relies on an external Ollama install, or neither.

**Recommendation:** **A** if this sprint has the runway. Candle alone forces us to write a Rust impl for every new architecture forever — that is a commitment we do not want. llama.cpp embedded gives us Ollama-parity coverage without the subprocess. If runway is tight, **C** (rename + defer honestly) is acceptable; **B** is only acceptable if the owner is comfortable requiring an external Ollama install.

**Regardless of A/B/C:** rename the slot from `ollama_embedded` → `llama_cpp_embedded` everywhere it appears (`module.rs`, `config/runtimes/mod.rs`, the route folder, the landing grid entry). Calling llama.cpp "embedded Ollama" was the exact kind of terminology drift that obscures what the code does.

---

## STOP-3 — Cache devtool

**Question:** Before wiring the cache devtool, does a cache SERVICE actually exist on disk?

**Pre-check:** Read `systems/devpulse-engine/src/platform/services/cache.rs`. Report back.

**Options depend on finding:**
- If cache.rs is real (Moka-backed) — author `cache_*` commands, wire Status/Actions tabs. ~150 LOC.
- If cache.rs is a stub — escalate to its own sprint (cache is a store, not a runtime; S1 store migration covers this).

**Impact:** Small. Either we close the gap or we prove there is nothing to close this sprint.

---

## STOP-4 — Surreal extras

**Question:** What goes in the SurrealDB Config / Logs / Actions tabs?

**Options:**
| Option | Content |
|--------|---------|
| A. Mirror DevForge shape exactly | Config = TOML viewer (read-only). Logs = tail of session-jsonl filtered to `service=surreal`. Actions = start/stop/restart/drop-namespace. |
| B. Surreal-specific | Actions also includes "run migration", "dump namespace to file". |
| C. Defer | Keep honest placeholders with `TODO(reality-gap)` until the store-migration sprint. |

**Impact:** How much per-service variation the shared shell allows.
**Recommendation:** **A** if we have budget this sprint, **C** if STOP-1/2 soak it. Do NOT pick B — drift risk.

---

## Phase 0 — Pre-sprint gates (blocks Phase 1)

- [ ] Owner answers STOP-1, STOP-2, STOP-3 (after pre-check), STOP-4.
- [ ] Audit research doc committed to disk.
- [ ] Verify `reqwest` is in `systems/devpulse-engine/Cargo.toml` (or add it — STOP-3 if not).
- [ ] Run `cargo xtask run-dev` and confirm current state boots to a visible app. If it doesn't, halt — this sprint depends on the foundation booting.

---

## Phase 1 — Ollama sidecar service (if STOP-1 = A)

**Charter: 8 artifacts.** Follow the DevForge pattern file-for-file.

### 1.1 TOML config — `config/platform/runtimes/ollama_sidecar.toml`
Fields: `enabled`, `binary_path` (optional — path resolver default), `bind_host` (default `127.0.0.1`), `bind_port` (default `11434`), `startup_timeout_secs` (default 30), `health_poll_interval_ms` (default 250), `models_dir` (optional override for `OLLAMA_MODELS`).

### 1.2 Rust config struct — `platform/config/runtimes/ollama_sidecar.rs`
`OllamaSidecarConfig` with `#[derive(Debug, Clone, Serialize, Deserialize)]`, figment-layered. Re-export from `runtimes/mod.rs`.

### 1.3 Service module — `platform/services/ollama_sidecar.rs`
`OllamaSidecarService` with:
- `boot(config: &OllamaSidecarConfig) -> Result<Self>` — spawns `ollama serve`, `kill_on_drop(true)`, `CREATE_NO_WINDOW` on Windows, env `OLLAMA_HOST={bind_host}:{bind_port}`, optional `OLLAMA_MODELS`. Waits on `GET /api/tags` up to `startup_timeout_secs`.
- `connection_url() -> String`
- `list_models() -> Result<Vec<OllamaModel>>` — hits `/api/tags`
- Implement `ManagedModule` (NOT legacy `Service`).
- Shutdown via take-from-mutex-before-await (DevForge pattern).

Resolver: `resolve_ollama_binary()` — `binary_path` from config → `which::which("ollama")` → error with clear message.

### 1.4 Platform holder — `platform/mod.rs`
`ArcSwapOption<OllamaSidecarService>`. Add `pub async fn ensure_ollama_sidecar_started()`, `pub async fn ollama_sidecar_stop()`, `pub async fn ollama_sidecar_restart()`, `pub fn ollama_sidecar() -> Option<Arc<...>>`.

### 1.5 Tauri commands — `commands/ollama_sidecar/mod.rs`
Four charter verbs — all `pub async fn`, `#[tauri::command]`, `#[specta::specta]`:
- `ollama_sidecar_start` → `OllamaSidecarStatus { running, port, url, model_count }`
- `ollama_sidecar_stop` → `()`
- `ollama_sidecar_restart` → `OllamaSidecarStatus`
- `ollama_sidecar_health` → `OllamaSidecarHealth { state, label, model_count }` (shell-compatible `HealthBadge` shape)

Plus `ollama_sidecar_list_models` for the devtool extras tab.

Wire into `collect_commands!` in `lib.rs`.

### 1.6 Signal registry
Add `runtime.ollama_sidecar.{started,stopped,degraded,model_count_changed}` to `signals.registry.yaml`. 3–5 narrations per signal in `signals.narrations.yaml`. Visibility tier: `public`.

### 1.7 Svelte rune domain — `src/lib/domains/runtime/ollama_sidecar/`
Per Nx library-types. `data-access/ollama_sidecar.state.svelte.ts` + `data-access/ollama_sidecar.svc.ts` + `util/ollama_sidecar.contract.ts` + `index.ts`.

### 1.8 Devtool page — `routes/(devtools)/devtools/ollama_sidecar/+page.svelte`
Replace hardcoded placeholder. Uses `ServiceDevtoolShell`. Extras tab: Models list (calls `ollama_sidecar_list_models`). Actions tab: Start/Stop/Restart buttons wired to commands. Status tab: real `HealthBadge` from `ollama_sidecar_health`.

### 1.9 Preflight
Add to `scripts/docs/preflight/checks/` — verify the 8 artifacts exist for `ollama_sidecar`. This check becomes reusable for all future charter modules.

### Verification (Phase 1)
- `cargo check -p devpulse-engine` — zero errors
- `cargo check -p devpulse_desktop_backend` — zero errors
- `pnpm check` in `interfaces/desktop` — zero errors
- `cargo xtask run-dev` — app boots, visit `/devtools/ollama_sidecar`, Start button spawns a real `ollama serve`, Status flips to Up, model list populates.
- Stop → process gone (`tasklist | find "ollama"` empty).

---

## Phase 2 — llama.cpp embedded disposition (STOP-2)

**Rename in all three options:** `ollama_embedded` → `llama_cpp_embedded` (module entry, config slot, route folder, landing grid label, devtool page body). The rename happens regardless.

**If STOP-2 = A (build):**
- [ ] Add `llama-cpp-2 = "0.1"` (or current) to `kernel/model-loader/Cargo.toml` under a new `llama-cpp` feature flag.
- [ ] New backend: `kernel/model-loader/src/backends/llama_cpp/backend.rs` implementing `InferenceBackend`. GGUF load, forward pass, token sampling, streaming. Mirror the Candle backend shape.
- [ ] Register in `BackendPool::acquire` dispatch.
- [ ] Slot config: add `backend: "candle" | "llama_cpp" | "ollama"` enum.
- [ ] Service module: `systems/devpulse-engine/src/platform/services/llama_cpp_embedded.rs` implementing `ManagedModule`. Lazy-start. Health = pool health.
- [ ] Charter 4 commands: `llama_cpp_embedded_{start,stop,restart,health}`.
- [ ] Svelte rune domain + devtool page (replace placeholder).
- [ ] Signal registry entry: `runtime.llama_cpp_embedded.*`.
- [ ] Preflight check: 8-artifact charter for `llama_cpp_embedded`.

**If STOP-2 = B (drop the lane, keep sidecar only):**
- [ ] Delete `interfaces/desktop/src/routes/(devtools)/devtools/ollama_embedded/`
- [ ] Delete the axis entry in `platform/module.rs`
- [ ] Delete the slot in `platform/config/runtimes/mod.rs`
- [ ] Remove from devtools landing grid
- [ ] Document the decision in [MASTER_SPRINT_PLAN.md](../../.claude/MASTER_SPRINT_PLAN.md) so no future session reintroduces it

**If STOP-2 = C (defer honestly):**
- [ ] Rename the folder/slot/label to `llama_cpp_embedded` so the name stops lying.
- [ ] Add `TODO(reality-gap 2026-04-21): awaiting build — see SPRINT-REALITY-GAP-CLOSE Phase 2 Option A` at top of the placeholder page and its backing rune module.
- [ ] Leave the config slot in `runtimes/mod.rs` with `enabled = false` so we do not advertise capability we do not have.

---

## Phase 3 — Candle devtool surface

Backend already real. Just add the devtool surface.

### 3.1 Tauri commands — `commands/models/candle.rs` (or extend `commands/models/mod.rs`)
- `candle_health` → `CandleHealth { state, label, loaded_slots }`
- `candle_save_config` → persists `backends.candle` section to `config/platform/`
- `candle_export_logs` → dumps current-session log filtered to `backend=candle`
- `candle_restart` → drops and rebuilds the Candle backend pool (coordinate with `BackendPool`)

### 3.2 Frontend
`routes/(devtools)/devtools/candle/+page.svelte` — replace placeholder. Status tab = `candle_health`. Extras: "Loaded Slots" list reading from existing model-loader state. Actions: Restart pool.

### Verification (Phase 3)
- `cargo check` clean (both crates)
- `pnpm check` clean
- Devtool page shows real "loaded slots" when a model is loaded.

---

## Phase 3b — Real Candle configs + PersonaPlex-7B STS + canonical model table

**Correction (2026-04-21):** First pass of this phase guessed "NVIDIA 7B" = Nemotron. Wrong. Owner clarified: it's **NVIDIA PersonaPlex-7B** — a full-duplex speech-to-speech model already on disk at [models/voice/nvidia--personaplex-7b/](../../../models/voice/nvidia--personaplex-7b/).

### What's true about PersonaPlex

- Architecture: **Moshi** (kyutai-labs). Fine-tuned from `kyutai/moshiko-pytorch-bf16`. Pipeline tag: `audio-to-audio`.
- Components: Mimi encoder (ConvNet + Transformer) → Moshi Temporal + Depth Transformers → Mimi decoder.
- I/O: 24 kHz audio + text both directions, full-duplex streaming, 80 ms frames at 12.5 Hz.
- Conditioning: voice prompt (audio tokens = vocal style) + text prompt (persona/role/scenario).
- Files on disk match the already-authored loader's expectations:
  - `model.safetensors` (16.7 GB, BF16)
  - `tokenizer-e351c8d8-checkpoint125.safetensors` (385 MB — Mimi codec, not a text tokenizer)
  - `tokenizer_spm_32k_3.model` (SentencePiece text tokenizer)
  - `config.json`, `devpulse.json` (`role: "sts"`, `recommended_slots: ["voice.brain"]`)

### What's already in the tree

- `moshi = "0.6"` workspace dep with `default-features = false` ([Cargo.toml:77](../../../Cargo.toml)).
- `sentencepiece = "0.12"` dep.
- Feature gate `moshi-sts = ["dep:moshi", "dep:sentencepiece", "candle-backend"]` in `kernel/model-loader/Cargo.toml:28`.
- [moshi.rs](../../../kernel/model-loader/src/backends/candle/moshi.rs) — 161 LOC scaffold: `MoshiStsBackend { loaded, model_dir }`, `new()`, file-discovery helpers, `load()` that opens Mimi + LM and **immediately drops them** (`_mimi`, `_lm_model` prefixed bindings).

### What's still a stub

- `_mimi` and `_lm_model` are discarded after `load()` returns. Nothing is retained on the struct. Every subsequent method is blind.
- No `generate()`, no `encode_audio`, no `decode_audio`, no `step()`, no streaming.
- No `InferenceBackend` trait impl — and the existing trait doesn't fit (text→text vs full-duplex audio+text).
- No pool integration in [backends/pool.rs](../../../kernel/model-loader/src/backends/pool.rs).
- No `ArchId::MoshiSts` variant in [architectures.rs](../../../kernel/model-loader/src/registry/architectures.rs).
- No Tauri commands wired to the voice brain slot.
- 16.7 GB BF16 on disk = ~16 GB VRAM just for weights. No VRAM budget entry, no planner hook.

### STOP-5 — PersonaPlex scope

**Question:** How much of PersonaPlex lands in this sprint?

**Options:**
| Option | What lands | Effort | Delivers |
|--------|------------|--------|----------|
| **A. Full-duplex voice brain** | Finish the backend: retain Mimi + LM on struct, add `encode_audio` / `decode_audio` / streaming-step loop, persona + voice prompt conditioning, full-duplex orchestration, pool integration, slot registry entry, VRAM planner hook, Tauri commands, devtool wiring. | HIGHEST in this sprint. 800–1500 LOC + real BF16 load test on actual GPU. Requires CUDA build. | The ambition: "cross-share 7B persona with minions + STS" — a real voice brain. |
| B. Loadable + smoke-test only | Retain Mimi + LM on struct, add `smoke_test()` that runs one generation step and discards output. No audio I/O, no persona conditioning, no full-duplex. Proves the model loads + steps on current hardware without committing to the full pipeline. | ~300 LOC. | Proof of load, identifies VRAM reality, unlocks A as next sprint. |
| C. Defer the backend, ship canonical model table + Qwen/Phi safetensors hardening only | Leave moshi.rs stubbed with dated `TODO(reality-gap)`. Ship the Qwen3 / Phi3 / canonical-table work. | Lowest risk. | Safetensors for everything currently supported, PersonaPlex deferred to its own sprint. |

**Impact:** Decides whether this sprint delivers a real voice brain, a load-proof milestone, or stays conservative on Qwen/Phi only.

**Recommendation:** **B.** The scaffold is partially there, the crate is pinned, files are on disk. Proving load+step on the current GPU in this sprint de-risks the full build AND gives the owner the honest answer "can the current machine even run this." Full-duplex orchestration is non-trivial and deserves its own sprint with its own STOPs (audio pipeline redesign is implicated — the existing voice pipeline is sequential, PersonaPlex is concurrent-stream).

If owner picks **A**, split into phase 3b-i (load + step) and phase 3b-ii (full-duplex pipeline) with an explicit gate between them.

### 3b.1 Canonical model config table (runs under any STOP-5 option)

New module: `kernel/model-loader/src/models/canonical.rs`. One `const` row per vetted model already on disk:

```rust
pub struct CanonicalModel {
    pub hf_repo: &'static str,
    pub local_dir: &'static str,      // relative to models/
    pub arch: ArchId,                  // or a new ModelRole enum for non-LM kinds
    pub format: ModelFormat,
    pub quant: Option<&'static str>,
    pub context_default: u32,
    pub vram_estimate_mb: u32,
    pub role: ModelRole,               // Chat | Embedder | Reranker | Vision | TTS | STT | STS
    pub display_name: &'static str,
    pub note: &'static str,
}
```

Seed from what's actually on disk ([models/](../../../models/)):
- `chat/Qwen3-0.6B-Q4_K_M.gguf` — chat minion
- `chat/Qwen3.5-9B-Q4_K_M.gguf` — chat main
- `chat/qwen--qwen3.5-9b-base/` — safetensors
- `chat/qwen--qwen3.6-35b-a3b/` — MoE safetensors
- `chat/unsloth--phi-4-mini-instruct-gguf/` — phi4 GGUF
- `omni/qwen--qwen3-omni-30b-a3b/` — omni MoE
- `vision/qwen--qwen3-vl-4b/` — Qwen3 VL
- `vision/microsoft--phi-4-reasoning-vision-15b/` — Phi-4 vision
- `voice/nvidia--personaplex-7b/` — PersonaPlex STS (B or A from STOP-5)
- `voice/kokoro--v1/`, `voice/kokoro-v1.0.*.onnx` — Kokoro TTS
- `voice/openai--whisper-small/`, `voice/ggml-small.bin` — Whisper STT
- `voice/qwen--qwen3-tts-*/` — Qwen3 TTS variants
- `voice/vibevoice--realtime-0.5b/` — VibeVoice
- `rag/qwen--qwen3-embedding-0.6b/`, `rag/qwen--qwen3-reranker-0.6b/` — RAG
- `rag/microsoft--harrier-0.6b/`, `rag/microsoft--harrier-27b/` — Harrier embedder/reranker
- `rag/baai--bge-reranker-base/`, `rag/nomic-ai--nomic-embed-text-v2-moe/`, `rag/nomic-embed-text-v1.5.Q8_0.gguf`

### 3b.2 Qwen3 / Phi-3 safetensors verification (low-risk)

Already claimed-supported. Actually load each from the local dir and generate 20 tokens:
- `chat/qwen--qwen3.5-9b-base/` safetensors
- `chat/qwen--qwen3.6-35b-a3b/` MoE safetensors
- `chat/unsloth--phi-4-mini-instruct-gguf/` GGUF

If any fail, that's a regression — fix before claiming the arch is "Primary."

### 3b.3 PersonaPlex work (gated on STOP-5)

**If STOP-5 = A (full voice brain):** see detailed breakdown above. Split into 3b-i (load + single step) and 3b-ii (full-duplex + pool + slot + commands + devtool).
**If STOP-5 = B (load + smoke):**
- Fix `moshi.rs` to actually retain `mimi` and `lm_model` on the struct.
- Add `smoke_test(device: &Device) -> Result<String>` that runs one `lm::generate_step` and returns the first decoded token + timing.
- Add one Tauri command `models_personaplex_smoke_test() -> SmokeReport`.
- Wire a "Smoke test" button in the Candle devtool Actions tab (Phase 3).
- Add `ArchId::MoshiSts` as a `Primary` tier entry OR as `Experimental` until full build lands.
- Canonical table row points at the local dir.
**If STOP-5 = C (defer):**
- Add `TODO(reality-gap 2026-04-21): PersonaPlex scaffold partial — load() discards weights. Next sprint authors real backend. See SPRINT-REALITY-GAP-CLOSE Phase 3b STOP-5.` at the top of [moshi.rs](../../../kernel/model-loader/src/backends/candle/moshi.rs).
- No changes to the code. No lies. Advance to the other phases.

### Verification (Phase 3b)

- `cargo check -p model-loader` — zero errors
- `cargo test -p model-loader --features candle` — zero failures
- STOP-5=A/B: PersonaPlex loads on the current GPU AND generates at least one token. Timing recorded.
- STOP-5=A/B/C: Qwen3.5-9B safetensors + Qwen3-35B-A3B MoE + Phi-4-mini GGUF all load and generate 20 tokens. Fail the phase if any of the three regress.
- Canonical table covers every model folder currently under [models/](../../../models/).

---

## Phase 4 — Cache devtool (pending STOP-3)

**Only if STOP-3 confirms a real cache service exists.**

Same shape as Phase 3, minus restart (cache may be drop-and-rebuild only).

---

## Phase 5 — Project DB frontend wiring

Backend real. Frontend missing.

- [ ] Create `src/lib/domains/stores/project_db/data-access/project_db.state.svelte.ts` + service
- [ ] Create `src/lib/domains/stores/project_db/index.ts`
- [ ] `routes/(devtools)/devtools/project_db/+page.svelte` — use `ServiceDevtoolShell`. Status tab calls existing `project_db_health`. Actions tab wires `init_project_db` (currently unreachable from UI).
- [ ] Verify existing commands still type-check after the frontend change.

---

## Phase 6 — SurrealDB tabs (if STOP-4 = A)

Match DevForge shape exactly. No per-service variation.

- [ ] Add `surreal_save_config`, `surreal_export_logs`, `surreal_drop_namespace` commands
- [ ] Wire Config/Logs/Actions tabs in `.../surreal/+page.svelte` extras snippet
- [ ] Add confirmation modal for `drop_namespace`

---

## Phase 7 — Honesty layer

Sweep. For every placeholder that REMAINS after Phases 1–6:
- [ ] Add `TODO(reality-gap YYYY-MM-DD): awaiting command `{name}` — see SPRINT-{name}` above every placeholder text block.
- [ ] Add the same note as a comment in the backing page component script.
- [ ] Grep the tree: `rg "Not wired yet|Wires up with|coming soon" --type svelte` — every hit must be annotated.

No more silent placeholder lies.

---

## Phase 8 — Final verification

- [ ] `cargo check -p devpulse-engine` zero errors
- [ ] `cargo check -p devpulse_desktop_backend` zero errors
- [ ] `pnpm check` in `interfaces/desktop` zero errors
- [ ] `cargo xtask run-dev` boots
- [ ] Manually click through every devtool page listed in the audit. Each one is either REAL (works) or HONEST-PLACEHOLDER (clearly dated and annotated). Zero devtools show green when they are not.
- [ ] Commit the per-service work as one commit per phase, not one jumbo commit.

---

## Owner Decision Summary

| STOP | Question | Blocking what |
|------|----------|---------------|
| 1 | Ollama sidecar scope (A / B / C) | All of Phase 1 |
| 2 | llama.cpp embedded: build (A) / drop lane (B) / rename + defer (C) | Phase 2 |
| 3 | Does cache service exist? (pre-check) | Phase 4 |
| 4 | Surreal extras scope (A / B / C) | Phase 6 |
| 5 | PersonaPlex-7B scope: A (full voice brain) / B (load + smoke test only) / C (defer) | Phase 3b |

**Nothing in this sprint starts executing until STOPs 1-5 are answered.**

---

## What this sprint does NOT promise

- This sprint does not "load LLMs via Candle and Ollama" — the Candle half already works (audit #1 proved it), the Ollama half lands here only IF STOP-1 = A.
- This sprint does not ship a customer-facing polish pass on the devtools. Layman-friendly UX is a separate sprint downstream.
- This sprint does not migrate the legacy `Service` trait — we add `ManagedModule` services alongside. Migration of existing stores is a separate sprint.
- This sprint does not touch voice, setup wizard, or boot pipeline — audit shows they are real.
