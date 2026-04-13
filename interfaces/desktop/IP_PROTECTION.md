# IP PROTECTION PROTOCOL (Flags + Facade Constitution)
> Goal: expose capabilities and useful guidance without leaking proprietary recipes, workflows, or orchestration.
> Rule: the user may see what happened and why it matters; they do not get the actual implementation recipe.

## 1. SSOT Split

There are three separate sources of truth. They do different jobs.

### 1.1 Visibility And Build-Stripping SSOT

* File: `src/lib/cfg/flags.ts`
* Responsibility: builder/operator/customer visibility, devtools availability, and customer-build stripping.
* Status: this file is required. If it is missing, the repo is in drift and must be restored rather than silently replaced.

### 1.2 Vocabulary And Alias SSOT

* File: `systems/devpulse-engine/ip/kernel_terms.toml`
* Responsibility: which internal terms get remapped into engine/public labels.
* This owns naming only. It does **not** replace `flags.ts`.

### 1.3 Emission Boundary SSOT

* Files: `systems/devpulse-engine/src/platform/facade/*`
* Responsibility: what actually leaves the engine, how it is translated, what gets filtered, and what is redacted.
* This is where proprietary process detail must be wrapped before any UI receives it.

## 2. Exposure Tiers

### 2.1 Builder Tier

* Audience: local developer during `run-dev`.
* May see: raw traces, prompt-prep internals, routing details, deep debug data.
* Must be gated behind flags and stripped from customer builds.

### 2.2 Operator Tier

* Audience: internal devtools/operator cockpit.
* May see: kernel controls, lifecycle, health, queue depth, slot state, timing, confidence bands, stage summaries.
* Must **not** show the secret recipe.

### 2.3 Surface Tier

* Audience: customer / layman UI.
* May see: distilled outcomes, progress, safe explanations, status, warnings, next actions.
* Never show raw process.

## 3. Public Concept Vs Private Recipe

Public concepts are allowed if intentionally chosen as product language.

Allowed to be public:

1. Capability names like `CAG`, `RAG`, and `RRO`.
2. Layman-safe stage names such as thinking, prepared context, search, translation, quality check.
3. Public roles such as `Translator` for SCRIBE.
4. Outcome summaries such as de-escalation, fallback active, or knowledge search succeeded.

Must remain private:

1. Prompt recipe and COSTAR satisfaction steps.
2. Pre-context conditioning before anything reaches Clyffy.
3. Encoder selection or composition.
4. Qdrant schema, payload structure, and retrieval recipe.
5. Reranking heuristics and governance arbitration internals.
6. JIT/native compilation path and machine-level execution details.

## 4. Required Guardrails

Before any builder or devtools UI is added:

1. Decide whether it is Builder, Operator, or Surface tier.
2. Add or verify the flag in `src/lib/cfg/flags.ts`.
3. Ensure the engine facade emits the correct wrapped event shape.
4. Ensure customer builds cannot reach builder-only routes, windows, or channels.
5. Verify that the user sees output and explanation, not the proprietary process.

## 5. Devtools Alignment

Devtools are allowed to manage the kernel clearly during development.

That does **not** mean the shipped product exposes the same stream.

Required model:

1. `run-dev` may expose raw builder traces locally.
2. Normal internal devtools should prefer operator-safe signals over raw recipe data.
3. Customer builds must ship only filtered, wrapped, layman-safe surfaces unless an explicitly approved operator surface is also shipped.

## 6. Verification

Pass criteria:

1. With builder flags off, builder routes and raw trace surfaces disappear.
2. With customer build settings, raw builder traces are absent or unreachable.
3. The UI still provides useful stage summaries, progress, and outcomes.
4. The user can understand what the system did without learning how the secret recipe works.
