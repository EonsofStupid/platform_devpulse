---
paths:
  - "systems/devpulse-engine/**/*.rs"
  - "interfaces/desktop/**/*.ts"
  - "interfaces/desktop/**/*.svelte"
  - "interfaces/desktop/src-tauri/**/*.rs"
---

# IP Protection — Engine / Kernel Boundary

**SSOT:** `systems/devpulse-engine/ip/signals.registry.yaml`
**Narrations:** `systems/devpulse-engine/ip/signals.narrations.yaml`
**Shape:** OpenTelemetry semantic convention registry (extended with families, relationships, visibility tiers, narrations)
**Rule:** ONE-SIDED. Anything not declared in the registry is kernel-only by definition.

> **Transition status (2026-04-14):** The legacy two-column `systems/devpulse-engine/ip/kernel_terms.toml` is DEPRECATED but still live. It has 15 active consumers (Rust `build.rs`, frontend terminology codegen, grit rules, architecture tests, lefthook hooks). Deletion is gated on **P0 — Consumer Migration** in `scripts/docs/sprints/SPRINT-SIGNALS-GOLDEN-PATTERN.md`. Until P0 lands, both files coexist; new work follows the registry doctrine below.

---

## The Doctrine

DevPulse ships open-source runtime with protected implementation. The boundary is **vocabulary**, not source-code reachability. Kernel implementation files can be read; kernel *vocabulary* never crosses the wall.

Public surfaces — engine crate, Tauri facade, frontend, logs, docs, commit messages, issue titles, READMEs, marketing — speak **only** the signal vocabulary declared in `signals.registry.yaml`. Kernel internals (`kernel/`) speak their own implementation names freely, but those names never appear in any artifact outside `kernel/`.

The registry is **one-sided** on purpose. A mapping table that says "public `rro.ruminating` → internal `hmm_transition_step`" is itself the most distillation-valuable artifact in the repo. One leak and the translation layer decodes. The registry holds only public names. Kernel-internal names live only in `kernel/*.rs` and `kernel/*.toml`, are never cross-referenced, and are never committed to any file consumed outside `kernel/`.

---

## Public vs Protected, in one glance

**OK to quote anywhere (docs, chat, commits, READMEs, screenshots):**
- Filesystem paths — including `kernel/...` paths and filenames.
- Module names of kernel files.
- Mechanics: which Tauri command writes which table, data-directory layout, how to wipe `user.db`, build commands, crate boundaries.
- Anything already declared in `signals.registry.yaml`.

**Never outside `kernel/` (registry-enforced, CI-blocked):**
- Kernel-internal vocabulary (algorithm / infra / architecture / sub-agent names — see full list below).
- **Orchestration recipes.** Any description of *how* the kernel composes behaviors that would let a reader reproduce hosted-assistant-style capability. Treat recipes as trade secrets even when no banned term appears.
- Prompt and template bodies (names may be registry-aliased; bodies never surface).
- Distillation / training pipelines, slot wiring that encodes capability.

**Rule of thumb:** pointing at a file is fine. Explaining the recipe inside it is kernel-only.

---

## Why This Shape

The doctrine converges on how the AI product leaders actually structure their public surfaces:

- **Anthropic SDK** — exposes `messages.create`, `tool_use`, `thinking` blocks with `budget_tokens`. Zero RLHF, retrieval, router, or safety-classifier vocabulary. Even leaked Claude system prompts use only product-verb names — the prompt itself was designed to be leakable.
- **OpenAI Responses API** — `file_search`, `code_interpreter`, `reasoning.effort: low|medium|high`. No BM25, dense, hybrid, or rerank vocabulary despite `file_search` doing all of those.
- **Cursor** — Composer, Tab, Agent, `@file`, `@docs`, `@web`. Reverse-engineering attempts find nothing because nothing is exposed.
- **Lovable** — `lov-write`, `lov-rename` — namespace-prefixed verbs. Leaked system prompt revealed no algorithmic internals.
- **Ollama** — `pull`, `run`, `Modelfile`. Wraps llama.cpp entirely, never says "GGUF quantization variant" in the CLI. Proof that aggressive vocabulary curation survives full source availability.
- **OpenTelemetry semantic conventions** — the industry-standard shape for "public vocabulary that survives open-sourcing": namespaced stable IDs, stability tiers, enum-constrained members, one-sided registry. DevPulse adopts this shape so telemetry lands in Grafana/Honeycomb/Jaeger with zero custom adapters.

**Cautionary counter-example: LangChain.** `BM25Retriever`, `EnsembleRetriever`, `ContextualCompressionRetriever` are the *public* API. Every tutorial teaches the internals. There is no moat. DevPulse must never write docs, names, or log messages that could be mistaken for a LangChain API.

---

## What Is Public (Allowed Everywhere)

Anything declared in `signals.registry.yaml`. Current families:

| Family | Groups | Public brand verbs |
|---|---|---|
| `context` | `rro` | RRO, rumination, gather, purge, fork |
| `interaction` | `prompt`, `a2ui` | COSTAR+ (legacy alias for `prompt`), A2UI, prompt contract, constructive rewrite |
| `action` | `minion`, `recipe` | Minion, recipe, scout/scribe/runner/sentinel/archivist/analyst/herald/warden |
| `diagnostics` | `diagnostics` | proximity, self-analysis, pause, fork, purge, refresh_context, JIT |
| `learning` | `lesson` | observation, tradeoff, anti-pattern, confirmation, alternative |

Plus everything inherited from OTel GenAI semconv (`gen_ai.*`).

**New vocabulary is added by PRing `signals.registry.yaml`.** No vocabulary exists anywhere in the public surface that is not in the registry.

---

## What Is Kernel-Only (Banned Outside `kernel/`)

Concrete list. CI regex blocks these anywhere outside `kernel/` and explicitly allowlisted research archives:

**Algorithm names:**
`HMM`, `hidden_markov`, `state_transition_matrix`, `BM25`, `bm25`, `RRF`, `reciprocal_rank_fusion`, `CAG`, `context_augmented_generation`, `RKYV`, `rkyv`, `zero_copy_deserialization`, `cross_encoder`, `dense_retrieval`, `hybrid_search`, `reranking`, `reranker`, `speculative_decoding`, `MCTS`, `process_reward_model`

**Infrastructure names:**
`qdrant`, `kv_cache`, `kv-cache`, `vram_budget`, `embedding_model`, `fusion_weight`, `temperature_schedule`


**Sub-agent identities (the literal words — note `Minion` is NOT banned; it is the public layman worker vocabulary):**
`DIARY`, `GUARDIAN`, `PSYCH`, `TEACHER`, `ENFORCER`, `sub_agent`, `scout`, `scribe`, `runner`, `sentinel`, `archivist`, `analyst`, `herald`, `warden`

**Template contents and orchestration recipes:**
The literal body of any prompt recipe template, and any description of how kernel components compose to produce hosted-assistant-style behavior. The *name* `COSTAR+` is accepted as a legacy alias for the `prompt` group; the template body and the recipe are not.

This list is not exhaustive. The real rule: **if it is not in `signals.registry.yaml`, it is kernel-only.**

---

## Three Anti-Patterns (Evidence-Backed)

### 1. LangChain leakage
Exposing algorithm names as the public API turns every tutorial into a teardown of your stack. The registry must make this impossible by construction: if `cross_encoder` is not in the YAML, no typed log call can emit it, and CI rejects any non-kernel source containing the string.

### 2. Lovable prompt extraction
Lovable's system prompt leaked within weeks. Most of what leaked was already public. The leak revealed nothing new. **Design every prompt, every doc, every commit message as if it is already public.** If leaking it would reveal nothing unknown, you are safe. Concretely: prompt templates must never contain kernel-impl names, even in comments, even "just for now." The narration catalog is subject to the same lint as source code.

### 3. Two-column mapping tables
The previous `kernel_terms.toml` is a two-column ban list mapping kernel terms to public equivalents. That file is itself the leak vector. It is deprecated and scheduled for deletion via P0 consumer migration. **The registry is one-sided.** Kernel-internal names never appear in any cross-boundary file. Their only legal home is `kernel/*.rs` and `kernel/*.toml`, neither of which is imported, included, or re-exported outside `kernel/`.

---

## Enforcement

### CI regex lint (blocks commit and build)

```bash
git grep -n -E '\b(HMM|hidden_markov|BM25|RRF|reciprocal_rank_fusion|CAG|RKYV|cross_encoder|dense_retrieval|hybrid_search|reranking|reranker|speculative_decoding|MCTS|qdrant|kv_cache|vram_budget|fusion_weight|Cortex|Trinity|DIARY|GUARDIAN|PSYCH|TEACHER|ENFORCER|sub_agent)\b' -- \
    ':!kernel/' \
    ':!**/leaked-system-prompts/**' \
    ':!**/node_modules/**' \
    ':!**/target/**' \
    ':!**/.git/**' \
    && { echo "BANNED KERNEL TERM FOUND OUTSIDE kernel/"; exit 1; } || exit 0
```

Wired into `lefthook.yml` as `ip-boundary-check`. Runs pre-commit on staged non-kernel files and in CI on the full tree.

### Frontend import rule
The Tauri frontend NEVER imports from `devpulse-clyffy`. All kernel access is through `devpulse-engine`, which speaks only registry vocabulary.

### Rust macro
Engine code uses `ip_term!("PUBLIC_ID")` for any emission bridging kernel state to public signal. The macro resolves `PUBLIC_ID` against the registry at compile time and fails the build if the ID is not declared.

### Narration catalog lint
`signals.narrations.yaml` is subject to the same CI regex. A phrasing that says "running BM25 fusion" fails the same check that catches it in Rust source.

---

## What Lives Where

| Concern | Location |
|---|---|
| Public signal vocabulary SSOT | `systems/devpulse-engine/ip/signals.registry.yaml` |
| Public narration catalog | `systems/devpulse-engine/ip/signals.narrations.yaml` |
| This doctrine | `.claude/rules/ip-protection.md` |
| Kernel implementation names | `kernel/**/*.rs`, `kernel/**/*.toml` — nowhere else |
| Engine-side registry bridge | `systems/devpulse-engine/src/signals/` (to be authored — see sprint P1) |
| Frontend signal domain | `interfaces/desktop/src/lib/domains/app/signals/` (to be authored — see sprint P4) |
| CI lint | `lefthook.yml` → `ip-boundary-check` |
| **Legacy (deprecated, pending P0 migration)** | `systems/devpulse-engine/ip/kernel_terms.toml` |

---

## How to Add New Vocabulary

1. Propose the new signal in `signals.registry.yaml` under an existing family (or propose a new family if warranted).
2. Give it an ID, stability tier, enum members if applicable, and a brief.
3. Add 3–5 narration phrasings in `signals.narrations.yaml` with an appropriate visibility tier.
4. Open a PR. Reviewer confirms: (a) no kernel-impl names in either file, (b) stability tier is justified, (c) visibility tier matches educational intent.
5. Merge. From that point, the signal is live vocabulary and may be used in engine, frontend, logs, and docs.

## How to Add New Kernel Internals

No registry change needed. Kernel-internal names are unrestricted inside `kernel/`. The only rule is that they **never appear outside `kernel/`** — not in re-exports, not in public function signatures, not in log messages, not in error messages that bubble up past the engine facade, not in comments that get copied elsewhere.

When a kernel internal needs to surface user-visible behavior, the engine facade writes a translator function that reads kernel state and emits the appropriate registry signal. The kernel name stays behind the translator.

---

## Deprecated

- **`systems/devpulse-engine/ip/kernel_terms.toml`** — legacy two-column ban list. Replaced by `signals.registry.yaml`. Still live until P0 consumer migration completes. Do not extend it; do not add new terms to it; do not reference it from new code.
