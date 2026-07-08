# Why fork-fold-execute? The catamorphism shape

> Captured 2026-06-24 to explain WHY `/clean-extract` enforces parallel
> fork agents + a synthesis fold + phased execution, instead of a
> single-thread "just go do it." The shape is research-backed; this doc
> is the reasoning the skill family can cite.

## The shape

```
                    /clean-extract <subsystem>
                              │
        ┌─────────────────────┴─────────────────────┐
        │            STEP 1: ANAMORPHISM            │
        │  (unfold one problem into N subproblems)  │
        │                                           │
        │  /fork-survey  ⟶  spawn N Explore agents  │
        │                   one per candidate folder │
        │                   ZERO shared context     │
        └─────────────────────┬─────────────────────┘
                              │
                  N independent manifests
                              │
        ┌─────────────────────┴─────────────────────┐
        │           STEP 2: CATAMORPHISM            │
        │   (fold N values into one coherent plan)  │
        │                                           │
        │  /fold-and-execute (fold mode)            │
        │    + exemplar anatomy                     │
        │    + naming conventions SSOT              │
        │    + anti-drift checklist                 │
        │  → one migration plan, phased             │
        └─────────────────────┬─────────────────────┘
                              │
                       one plan on disk
                              │
        ┌─────────────────────┴─────────────────────┐
        │           STEP 3: EXECUTION               │
        │       (phased, lefthook-gated, STOPs)     │
        │                                           │
        │  /fold-and-execute --phase 0              │
        │  STOP → user GO                           │
        │  /fold-and-execute --phase 1              │
        │  STOP → user GO                           │
        │  ...                                      │
        └───────────────────────────────────────────┘
```

## Why parallel fork (anamorphism)

A single agent reading the whole subsystem has TWO biases:

1. **Recency bias** — the last folder it read dominates its synthesis
2. **Coherence bias** — once it has a hypothesis, every subsequent folder is interpreted to confirm it

Parallel agents with zero shared context eliminate both. Each agent surveys its folder in isolation, returns a STRUCTURED manifest (not prose), and the fold step is the only place contradictions surface.

Research backing: **Workflow tool documentation** in the Claude harness explicitly notes this pattern under "Quality patterns" — multi-modal sweep + adversarial verify. Single-thread sweeps consistently underperform fan-out + fold on architectural decomposition tasks.

## Why structured manifests (not prose)

If agents return prose, the fold step has to read N free-form documents and try to reconcile them. Subtle differences in phrasing hide real disagreements. By forcing every agent to return the SAME JSON schema (`manifest-schema.md`), differences become numeric comparisons:

- Agent A: `exemplar_conformance_score = 0.91`
- Agent B: `exemplar_conformance_score = 0.62`

The fold step immediately sees Agent B's folder has a drift problem worth flagging.

## Why the fold reads the exemplar at fold-time, not fork-time

Fork agents are intentionally exemplar-blind. They report what they SEE, not what they THINK relative to the exemplar. The fold step is where the exemplar gets applied — this:

1. Keeps fork agents fast and focused
2. Lets the exemplar evolve without re-running surveys
3. Surfaces discrepancies as data, not as agent opinion

## Why phased execution with STOPs

The user has been burned by batched changes that compile-pass-but-break-runtime. Per [[compile-green-not-enough]] and CC-002 (max 5 files per refactor phase):

- 5-file cap → reviewable diff
- STOP after every phase → user catches drift before next phase compounds
- Lefthook between phases → CI ground truth, not optimism
- New commits not amends → reversible per [[no-revert-without-permission]]

## Why this is "research-backed" and not just opinion

Three patterns from the multi-agent research literature this maps to:

1. **MapReduce / fork-join** — classic parallel-decomposition shape; every modern data pipeline framework (Spark, Flink, Beam) implements catamorphic folds over parallel partitions for exactly the reasons above
2. **Independent-perspective verification** — adversarial review where each verifier is given a different lens; outperforms N identical verifiers (because diversity catches what redundancy can't)
3. **Reference-grounded synthesis** — fold against a known-good exemplar instead of de-novo synthesis; reduces hallucination, makes drift detectable as deviation

## Anti-pattern: "just have one agent do it"

Tempting because it's fewer tool calls. The cost is:

- Single agent reads serially → 5–10× wall-clock for the same coverage
- Implicit synthesis bias as outlined above
- No structured manifests → hard to verify completeness
- No fold step → no place for the exemplar to apply rigorously

The skill family explicitly REFUSES "let me just survey it all" requests for this reason. Cite [[plan-agent-before-authoring]] when the request is for a "build out" / "properly" / "raise to senior dev" style task.

## When to NOT use `/clean-extract`

- Single-file edits — overkill
- Renaming one symbol — use a grep + Edit
- Adding a new module to an existing crate — that's `/planning` with one Plan agent
- Bug fixes — use direct read + Edit
- Documentation-only updates — Edit

`/clean-extract` earns its complexity when you're moving MORE THAN ONE crate, OR creating a NEW top-level surface, OR crossing an IP boundary. Below that threshold, the orchestration overhead exceeds the benefit.

## Composition with other skills

| Inside `/clean-extract` Step | Skill it composes with |
|---|---|
| Step 2 (fork-survey) | `/fork-survey` (always) |
| Step 4 (fold) | `/fold-and-execute` fold mode |
| Step 6 (execute loop) | `/fold-and-execute` execute mode |
| Per-phase commits | `/merge-one-branch`-like gates (lefthook, no `--no-verify`, no amend) |
| Phase-internal authoring | `/planning` (when phase's file list needs sub-planning) |
| Final verification phase | `/verify` if a runtime check is needed |
