---
name: spec-first
description: Spec-first gate run BEFORE authoring or restructuring code for any boundary (crate, folder, module, subsystem, term). Identify that boundary's existing build spec and notes, bring them to current truth, and only then touch code — updating the existing doc before ever creating a new one. Refuses code-ahead-of-spec, silent doc proliferation, and rushed structural work. Maps boundaries to specs by folder + pattern, and grows the convention library as operator and project develop standards together. Reframe accurate-but-stale docs, rewrite dead-foundation docs, absorb duplicates before deleting, never declare deferred work retired. Invoke as `/spec-first <boundary>`; also auto-fires before substantive code or doc work. Composes with `/planning` and `/clean-extract`.
---

# `/spec-first <boundary>`

The doc for a boundary is its SSOT. Find it, make it true, then write the code. Update before you create. Never rush.

This skill exists because the operator has said it more than once: **when work is to be done, the existing build spec and notes for that boundary get identified and updated first — and only if none exist do new docs get created, properly organized and aligned.** Code that runs ahead of its spec is drift; a second doc where one already lives is rot. This skill makes the discipline repeatable, citable, and refuse-able.

## The standard it enforces

> As the operator shares with the AI, and as the project grows, the conventions grow with it — dynamically, off folders and patterns the two develop together. The boundary's doc is where that convention is written down. Every unit of work either reads from it or writes to it. Nothing is authored in a vacuum.

Locked memories this skill cites in refusals:

- [[extend-over-rewrite]] — minimum-diff extension; update the existing doc before authoring a new one
- [[absorb-before-delete]] — fold a duplicate into its SSOT (tokens + ARIA + layman copy preserved) AND verify BEFORE any delete
- [[deferred-not-retired]] — out-of-scope ≠ dead; "not part of this phase," never "retired." Scoping something dead is the operator's call
- [[no-hardcoding-clyffy-agnostic]] — specs describe agnostic seams, not hardcoded paths/ids/dims/hosts
- [[authored-code-must-be-wired]] — every new file/fn has an imported consumer; specs name the consumer
- [[real-over-rushed]] — limited + spec-aligned beats wide + undocumented; finish one slice's doc + code together
- [[senior-dev-default-approach]] — uncertain between strict and quick → strict, every time
- [[no-architectural-authority]] — state constraints, ask, execute exactly; do not invent boundaries
- CLAUDE.md CC-003 — senior perfectionist: if the architecture is flawed, propose the structural fix in the spec, not a bandaid in the code

## When this fires

**Auto-fire** before any of: a new module/crate/folder; a rename or move; a structural refactor; a new feature surface; a terminology change; a doc that would describe behavior. Before the first `Edit`/`Write` of that work, run this gate.

**Bail-out (skip the gate).** If the change is a one-sentence diff — a typo fix, a dead-import removal, a single log line, a version bump, a comment — say so in one line and just do it. Over-ceremony on trivial work is its own failure mode. The test is the same as `/planning`'s: *if you could describe the diff in one sentence, skip the gate.*

## Caller contract

Caller (you, or the operator invoking `/spec-first`) MUST supply or infer:

1. The **boundary** — the exact crate / folder / module / subsystem / term the work touches (e.g. `kernel/devpulse-clyffy/src/cortex/`, the `connectome` intelligence system, `interfaces/desktop/.../setup-wizard/`).
2. The **intent** — what the code work will do once the spec is current.

Caller MUST honor:

1. ONE boundary per invocation. A change spanning N boundaries runs the gate N times.
2. No code edit on the boundary until its spec is current (Step 4 done) — except the bail-out class.
3. Wait for explicit `go` at Step 5 before creating a NEW doc or restructuring docs.

## Step 1 — Name the boundary and its pattern

State the boundary precisely and the **pattern** it belongs to (the convention class it inherits): is it a Rust crate (owns a colocated spec + `kernel_terms.toml` terms if it crosses the IP boundary)? a devtool (the locked Status/Config/Logs/Actions/Debug shell)? a Svelte domain (`feature / ui / data-access / util`)? a platform subsystem (a `docs/platform/*.md` spec)? a content corpus (`docs/knowledge_library/`)?

The pattern decides where the spec lives. See `references/boundary-spec-map.md`.

## Step 2 — Locate the existing spec + notes (do not assume absence)

Search in the order defined by `references/boundary-spec-map.md`:

1. Colocated docs in/next to the boundary (`README.md`, `SPEC.md`, `*.md`)
2. Platform specs (`docs/platform/*.md`)
3. Knowledge library (`docs/knowledge_library/*.md`)
4. Terminology SSOT (`systems/devpulse-engine/ip/kernel_terms.toml` → `terminology.ts`) for any vocabulary boundary
5. Migration contracts (`~/.claude/plans/*.md`)
6. The durable memory store (`MEMORY.md` index → topic files)

Grep the boundary's key symbols across `docs/`. **A Glob/Grep timeout under FS load means "search incomplete," not "spec absent"** ([[find-timeout-is-not-absent]]) — narrow the path and retry before concluding none exists. Report every spec found with its path and a one-line "what it claims."

## Step 3 — Classify each existing spec (the treatment decision)

For each spec found, pick exactly one treatment. This is the doctrine proven in the 2026-06-28 spec re-baseline:

| Treatment | When | Action |
|---|---|---|
| **Reframe** | Accurate records, stale framing (right file:line citations, superseded topology/naming) | Add a dated `⚠ REFRAMED` header: what changed, what's still valid, renames-land-with-the-code, deferred-not-retired. **Preserve the records below.** |
| **Rewrite** | Foundation is dead (describes an architecture that no longer exists) | Replace the body; bump version; keep the historical note that it was rewritten |
| **Extend** | Correct and current, just missing the new surface | Minimum-diff: add the section, touch nothing else |
| **Absorb** | A duplicate of another doc's SSOT | Fold its unique content (tokens, ARIA, layman copy) into the SSOT, verify, THEN delete the duplicate ([[absorb-before-delete]]) |

Never pre-rename code-path citations ahead of the code. If `cortex` → `connectome` lands in a later phase, the spec's `kernel/.../cortex/` citations stay accurate **until that phase renames them** — renaming the doc first makes it lie.

## Step 4 — Bring the spec to current truth BEFORE the code

Apply the Step 3 treatment. The spec now describes the world the code is about to create. Only `Extend`/`Reframe` may proceed without a stop. `Rewrite`, `Absorb`, or **creating a brand-new doc** go to Step 5 first.

If no spec exists for this boundary: do NOT improvise one inline. Go to Step 5 — a new doc is a structural decision.

## Step 5 — STOP for `go` on new docs or restructuring

Creating a new doc or moving/merging docs is a convention change, not a side effect. Halt with:

> Boundary `<name>` has `<no existing spec | spec at <path> needing rewrite/absorb>`. Proposed: `<create docs/.../X.md | rewrite Y | absorb Z into W>`, organized as `<placement + why it conforms to references/boundary-spec-map.md>`. Reply `go` to author, anything else to adjust.

Wait for unambiguous `go`. No silent new docs. No proliferation. The new doc's placement and name must conform to `references/boundary-spec-map.md` — boring names, aligned to the existing tree, one home per concept.

## Step 6 — Author / modify the code

Now write the code, against the now-current spec. Every new file/fn has an imported consumer before the batch ends ([[authored-code-must-be-wired]]). No hardcoded paths/ids/dims/hosts — the spec describes the agnostic seam, the code honors it ([[no-hardcoding-clyffy-agnostic]]).

## Step 7 — Reconcile, verify, and record the convention

1. **Sync check** — spec and code agree. If the code revealed the spec was wrong, fix the spec in the same batch; the doc is not allowed to lie after the code lands.
2. **Verify** — `cargo check -p <crate>` (per crate, never workspace-wide) and/or `cd interfaces/desktop && pnpm check`. Compile-green is necessary, not sufficient — name the runtime signal that proves it works ([[compile-green-not-enough]]).
3. **Grow the convention** — if a NEW folder shape or pattern emerged that future work should follow, record it: a line in the boundary's spec, and if it's a cross-boundary standard, a `reference` memory + a note in `references/boundary-spec-map.md`. This is how conventions grow dynamically instead of being re-invented per session.

## Worked example — `cortex` → `connectome`

The operator's standing instruction "have cortex changed to connectome" is exactly this skill's job, run once for the rename boundary:

- **Boundary** — the cognitive/intelligence system: code under `kernel/devpulse-clyffy/src/cortex/`, the term in `kernel_terms.toml`, the codegen in `terminology.ts`, the public surfaces.
- **Specs found** — `docs/platform/CLYFFY-COGNITIVE-FOUNDATION.md` (already **rewritten** to v2.0.0, current), `INTELLIGENCE_LAYER.md` (**reframed**), the `kernel_terms.toml` term entry (the **SSOT** the rename flows from), the `project_connectome_replaces_cortex` memory.
- **Treatment** — concept is already reconciled (Phase 1). The remaining work is the **code rename**, which is Phase 2: `cortex` → `connectome` in `kernel_terms.toml` → regen `terminology.ts` → rename the code paths → strip any hardcoded names. The doc citations to `kernel/.../cortex/` stay accurate **until that phase flips them** — that's Step 3's "never pre-rename ahead of the code."
- **Naming note** — a `connectome` subagent dispatcher already exists in `.claude/agents/`. It is Claude-side tooling, a different namespace from the product's intelligence system; the two coexist. Disambiguating the agent is the operator's call, not a blocker on the product rename.

## Refusal protocol

Refuse with citation if any of these are requested:

| Requested shortcut | Citation |
|---|---|
| Write the code before the boundary's spec is identified + current | This skill's caller contract; CC-003 |
| Create a new doc when an existing one already covers the boundary | [[extend-over-rewrite]] |
| Delete a duplicate before folding its unique content into the SSOT | [[absorb-before-delete]] |
| Pre-rename code-path citations ahead of the code rename | Step 3 (the renamed doc would lie) |
| Label deferred / out-of-scope work "retired" or "dead" | [[deferred-not-retired]] |
| Hardcode a path/id/dim/host into a spec instead of describing the seam | [[no-hardcoding-clyffy-agnostic]] |
| Rush a structural change to "save time" | [[real-over-rushed]], [[senior-dev-default-approach]] |
| Invent a boundary or slice the architecture without the operator | [[no-architectural-authority]] |
| Skip the spec because "it's obvious" / "small" (outside the bail-out class) | This skill — no size escape hatch beyond the one-sentence-diff test |

State the refusal. Cite the rule by name. Propose the correct path.

## Related skills

- `/planning <goal>` — when bringing the spec current is itself a multi-file research task, run `/planning` inside Step 4
- `/clean-extract <subsystem>` — extraction-grade structural moves; `/spec-first` is its lightweight per-boundary sibling
- `/scan-project [area]` — one-shot map to discover which boundaries exist; NOT a substitute for the per-boundary spec
- `/merge-one-branch <branch>` — same refusal posture, applied to merges

## References

- `references/boundary-spec-map.md` — where each boundary's spec lives, the search order, the treatment-decision detail, and the convention-growth protocol
