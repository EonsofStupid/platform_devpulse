---
name: clean-extract
description: Fork-fold-execute workflow for extracting a subsystem (crate group, folder tree, IP boundary) cleanly into its own repo or relocated namespace. Parallel survey agents fork; their outputs are catamorphically folded into a single plan; that plan is executed phase-by-phase with lefthook gates and STOPs between phases. NEVER hardcoded, ALWAYS modular, naming follows the exemplar (today `kernel/devpulse-clyffy/`). Invoke as `/clean-extract <subsystem-name>`. Composes with `/fork-survey` and `/fold-and-execute`.
---

# `/clean-extract <subsystem-name>`

The procedure for getting a clean, agnostic, drift-free extraction — research-backed parallel-fork → catamorphic-fold → phased-execute discipline.

This skill is the **orchestrator**. It does not do the work itself. It dispatches `/fork-survey` then `/fold-and-execute` in sequence, with explicit user GO gates between each, and refuses to skip any of them.

## Why this exists

Modern multi-agent research shows three patterns that beat single-thread coding for structural work:

1. **Anamorphism (fork / unfold)** — turn one big problem into N parallel subproblems, each handed to a fresh agent with no shared context
2. **Catamorphism (fold)** — combine the N independent outputs into a single coherent next action; the fold is where contradiction surfaces and gets resolved
3. **Phased execution against an exemplar** — never extract into a vacuum; always conform to a known-good reference, with anti-drift checks at every phase boundary

`/clean-extract` makes that pattern repeatable, citable, and refuse-able when shortcuts are tempting.

## Caller contract

Caller MUST supply:

1. Subsystem name (exact slug, e.g. `clyffyos`)
2. Source root (e.g. `d:\localdev\platform_devpulse`)
3. Destination root (e.g. `D:\localdev\clyffyos\`) — may not exist yet
4. Exemplar reference (default: `kernel/devpulse-clyffy/` per `references/exemplar-anatomy.md`)

Caller MUST honor:

1. ONE subsystem per invocation
2. Wait for explicit `go` between Step 1 / Step 3 / Step 5
3. Never instruct skipping a phase or gate

## Step 1 — Verify preconditions

Run the precondition battery from `references/preconditions.md`. Halt on any failure with the failing rule cited.

| # | Check |
|---|---|
| P1 | Source root exists, is a git repo, working tree clean (`git status --porcelain` empty) |
| P2 | On `main` of source repo, fully synced (`git rev-list HEAD..origin/main` empty both ways) |
| P3 | Destination root does NOT exist OR is an empty directory |
| P4 | Exemplar reference path exists and is a directory |
| P5 | `lefthook` available in source repo (`lefthook version` works) |
| P6 | All locked memory rules loaded (`MEMORY.md` index present + readable) |

## Step 2 — Dispatch fork survey

Invoke `/fork-survey` with the same `<subsystem-name>` + source/exemplar args. The fork-survey skill:

- Spawns N parallel **Explore** agents (one per top-level source folder candidate for extraction)
- Each agent returns a **structured manifest** (folders, key files, external deps, public symbols, drift indicators)
- Returns the N manifests as a single JSON array

Do not proceed without survey output.

## Step 3 — STOP for explicit GO

Halt with the survey summary:

> Fork survey complete. `<N>` folders surveyed. `<M>` drift indicators flagged. Reply `go` to fold + plan, anything else to abort.

Wait for unambiguous `go`. No auto-proceed.

## Step 4 — Dispatch catamorphic fold

Invoke `/fold-and-execute` (Phase 0: fold only) with:

- The fork-survey output (JSON array of N manifests)
- The exemplar anatomy (`references/exemplar-anatomy.md`)
- The naming convention SSOT (`references/naming-conventions.md`)
- The anti-drift checklist (`references/anti-drift-checklist.md`)

The fold-and-execute skill:

- Reduces N manifests into ONE migration plan (catamorphism)
- Slots each source folder into either KEEP / MOVE / RENAME / DELETE
- Annotates every MOVE with new path + new crate name conforming to the naming SSOT
- Generates phase breakdown (5 files max per phase, per CC-002)
- Saves plan to `C:\Users\jessa\.claude\plans\<subsystem-name>-extraction.md`

## Step 5 — STOP for explicit GO on the plan

Halt with:

> Plan saved to `.claude/plans/<subsystem-name>-extraction.md`, `<P>` phases, `<F>` total files. Reply `go-phase-0` to start, anything else to abort.

Wait for unambiguous `go-phase-<n>`. The caller controls which phase to start with — no auto-start, no batch.

## Step 6 — Per-phase execution loop

For each `go-phase-<n>` from the caller:

1. Invoke `/fold-and-execute` (Phase exec mode) with the phase number
2. Phase executes max 5 files per CC-002
3. Phase ends with lefthook pre-push green
4. Phase outputs commit SHA + verification report
5. Skill HALTS — does NOT auto-proceed to next phase

Caller must explicitly `go-phase-<n+1>` to continue.

## Step 7 — Final verification

After the caller invokes the final phase:

1. Source repo: `git status --porcelain` empty, no orphaned references to extracted symbols
2. Destination repo: `cargo check -p <crate>` green for every new crate, `lefthook run pre-push` green
3. IP boundary check: source repo grep for moved symbol names returns zero hits outside of `.claude/plans/`, `docs/`, `CHANGELOG.md`
4. Manifest sanity: `release-please-manifest.json` (if present) doesn't reference extracted crates

Report final state. HALT.

## Refusal protocol

Refuse with citation if any of these are requested:

| Requested shortcut | Citation |
|---|---|
| Skip fork survey | This skill's caller contract |
| Skip fold step (jump from survey to execute) | This skill's caller contract |
| Skip lefthook gate on a phase | [[compile-green-not-enough]], CC-001 |
| `git checkout --ours/--theirs` blind | [[no-auto-fix-shortcuts]] |
| `git push --force` to source main | [[no-revert-without-permission]] |
| `cargo clippy --fix`, `biome --write`, `prettier --write` | [[no-auto-fix-shortcuts]] |
| Add `lint = "allow"` workspace-wide to silence extraction fallout | [[strict-rust-engineering]] |
| Skip `/fork-survey` for "small" extractions | This skill — no size escape hatch |
| Workspace-wide `cargo check` instead of `-p <crate>` | CLAUDE.md "NEVER workspace-wide" |
| Hardcode any new name not derived from `references/naming-conventions.md` | [[token-tier-naming]] |
| Batch multiple phases in one call | CC-002 |
| `git commit --amend` on a phase commit | CLAUDE.md "create NEW commits rather than amending" |

State the refusal. Cite the rule by name. Propose the correct path.

## Related skills

- `/fork-survey <subsystem>` — fork phase (parallel inspect)
- `/fold-and-execute <subsystem>` — fold + execute phases
- `/merge-one-branch <branch>` — per-branch merge with the same refusal posture
- `/scan-project` — lightweight one-shot project map (NOT extraction-grade)
- `/planning` — structured plan authoring (composes naturally inside Step 4)

## References

- `references/exemplar-anatomy.md` — what good organization looks like
- `references/naming-conventions.md` — boring-names-only SSOT
- `references/anti-drift-checklist.md` — what each phase verifies
- `references/preconditions.md` — Step 1 P1–P6 detail
- `references/catamorphism-explainer.md` — why the fork-fold-execute shape, not single-thread
