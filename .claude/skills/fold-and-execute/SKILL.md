---
name: fold-and-execute
description: Catamorphism (fold) + phased execution half of the clean-extract workflow. Consumes the array of manifests from `/fork-survey`, the exemplar anatomy, naming conventions, and anti-drift checklist. Produces ONE migration plan saved to `.claude/plans/<subsystem>-extraction.md`. Then executes phases one at a time, 5 files max per phase per CC-002, lefthook-gated, STOPS between phases. Invoke as `/fold-and-execute <subsystem-name>` (fold mode) or `/fold-and-execute <subsystem-name> --phase <n>` (execute mode). Used by `/clean-extract`.
---

# `/fold-and-execute <subsystem-name>`

The fold + execute half of the fork-fold-execute workflow.

Two modes:

- **Fold mode** (no `--phase`) — catamorphism. Combine fork-survey manifests into one plan. Save plan. STOP.
- **Execute mode** (`--phase <n>`) — execute ONE phase from the saved plan. Lefthook-gated. STOP.

## Caller contract

Caller MUST supply:

1. Subsystem name (same as `/clean-extract` + `/fork-survey`)
2. EITHER fork-survey output array (fold mode) OR a phase number from the saved plan (execute mode)
3. Reference set: exemplar anatomy path, naming-conventions path, anti-drift checklist path

Caller MUST honor:

1. ONE mode per invocation (never both)
2. Wait for STOP between fold and first execute
3. Wait for STOP between every execute phase
4. Never instruct skipping the lefthook gate

## Mode 1 — Fold (catamorphism)

### Step F1 — Validate input

- Confirm fork-survey output is a valid JSON array
- Confirm every manifest matches the schema (`fork-survey/references/manifest-schema.md`)
- Confirm exemplar anatomy + naming SSOT + anti-drift checklist all exist on disk

Halt on any validation failure with the specific schema error cited.

### Step F2 — Per-manifest classification

For each manifest, compute disposition:

| Disposition | Triggered when |
|---|---|
| `KEEP` | `intra_repo_consumers` includes ONLY non-extraction folders AND folder is not in the subsystem's extraction scope |
| `MOVE` | folder is in extraction scope AND no consumer-side breakage if path-dep removed |
| `RENAME` | folder is in extraction scope AND `crate_name` doesn't conform to naming-conventions for the new subsystem |
| `DELETE` | dead code; no consumers; not in any documented active surface per MEMORY.md |
| `SPLIT` | folder mixes extraction-scope + keep-scope content (rare; surfaces an authoring bug to fix BEFORE extracting) |

For every MOVE / RENAME, compute the new path + new crate name by applying `references/naming-conventions.md` to the source name. NEVER invent a name not derivable from the SSOT.

### Step F3 — Anti-drift sweep

Apply the checklist (`references/anti-drift-checklist.md`) to the unified dispositions. Surface every violation. Examples:

- `MOVE kernel/devpulse-clyffy → clyffyos-connectome` (the historical worked example) but manifest reports `hardcoded_constants_in_lib_files = 3` → flag for fix-before-move
- Naming convention says `<subsystem>-<facet>` but a manifest's suggested rename gives `<subsystem>_<facet>` → fix to hyphen
- `exemplar_conformance_score < 0.80` → flag and require explicit acknowledgment to proceed

Drift violations MUST be enumerated in the plan output. They don't block fold, but they DO block execute until resolved.

### Step F4 — Phase decomposition

Decompose the unified work into phases of MAX 5 files each per CC-002. Phase ordering rules:

1. **Phase 0** = scaffolding only (workspace skeleton, lefthook, .gitignore, README, CI config — zero source files moved)
2. **Phase 1** = lowest-blast-radius extraction (typically a leaf crate with no consumers)
3. Subsequent phases build the dependency graph upward
4. **Final phase** = the cut — remove path-deps from source repo, source repo's xtask + config + docs cleanup
5. **Verification phase** = full E2E (`cargo check -p` matrix on both repos, lefthook both, manual binary smoke)

Each phase declaration includes:

- File list (5 max)
- Exact files affected
- Rollback recipe
- Verification gates (`cargo check -p <crate>` list per phase, lefthook commands)
- STOP-for-GO before phase

### Step F5 — Save plan

Write the plan to `C:\Users\jessa\.claude\plans\<subsystem-name>-extraction.md`. Plan structure:

```markdown
# <Subsystem-Name> Extraction Plan

## 1. Context (verified on disk <date>)
[disposition table]

## 2. Anti-drift findings
[checklist hits]

## 3. Phases
### Phase 0 — Scaffolding
[file list, verify, rollback, STOP]
### Phase 1 — ...
...

## 4. Verification matrix
[per-phase cargo check -p list, both repos]

## 5. Risk flags
[items needing live verification]

## 6. Critical files
[file paths the executor will need to read]
```

### Step F6 — STOP

Halt with:

> Plan saved to `.claude/plans/<subsystem-name>-extraction.md`. `<P>` phases, `<F>` total files, `<D>` drift findings flagged. Reply `go-phase-0` to begin, anything else to abort.

Wait for unambiguous `go-phase-<n>`.

## Mode 2 — Execute (phased)

### Step E1 — Load plan

Read the saved plan. Locate Phase `<n>`. Validate it hasn't been executed already (check git log on both repos for the phase's expected commit message pattern).

### Step E2 — Pre-execution checks

- Source repo `git status --porcelain` empty
- Destination repo (if exists) `git status --porcelain` empty
- On correct branch in both repos (`main` typically, unless plan declares a feature branch)

### Step E3 — Execute the file list

For each file in the phase's file list (max 5 per CC-002):

1. Read the source file (if MOVE/RENAME)
2. Author the destination file (Edit / Write)
3. Update intra-repo references atomically with the file edit (no orphan imports allowed mid-phase per `feedback_authored_code_must_be_wired.md`)

If the phase exceeds 5 file edits → STOP and re-split the phase in the plan.

### Step E4 — Verification gates

Per the plan's verification matrix for this phase:

| Gate | Command |
|---|---|
| Rust per-crate | `cargo check -p <crate>` for each crate listed |
| TypeScript / Svelte | `pnpm exec svelte-check --threshold error` (DevPulse only) |
| Lint | `pnpm exec biome check .` (DevPulse only) |
| Format | `cargo fmt --all -- --check` |
| Full pre-push | `pnpm exec lefthook run pre-push` |
| Bindings drift (if Rust commands changed) | `cargo xtask regen-bindings` (DevPulse only) |

Halt on first failure. NEVER `--no-verify`. NEVER auto-fix.

### Step E5 — Commit

ONE commit per phase. Conventional commits format. NEVER `--amend`. Co-author Claude per CLAUDE.md commit pattern.

### Step E6 — STOP

Halt with:

> Phase `<n>` complete. Commit `<sha>` on `<repo>`. Verification: `<P>` gates green. Reply `go-phase-<n+1>` to continue, anything else to halt the program.

Wait for unambiguous `go-phase-<n+1>`. No auto-proceed.

## Refusal protocol

| Requested shortcut | Citation |
|---|---|
| Skip the fold step (jump direct to execute) | Caller contract |
| Batch multiple phases in one execute call | CC-002 |
| Skip lefthook on a phase | [[compile-green-not-enough]] |
| `cargo check --workspace` instead of `-p` | CLAUDE.md |
| Auto-fix lint output (`biome --write`, `clippy --fix`, `prettier --write`) | [[no-auto-fix-shortcuts]] |
| `git commit --amend` on a phase commit | CLAUDE.md "create NEW commits rather than amending" |
| `--no-verify` to push past hook | [[senior-dev-default-approach]] |
| Bypass anti-drift findings to move faster | [[strict-rust-engineering]] |
| Drop a file from the phase mid-execution to fit under 5 | Caller — re-split the phase in the plan, don't truncate silently |
| Edit a file outside the phase's declared file list "while I'm here" | CC-002 — scope discipline |
| Move files without updating their intra-repo consumers in the same phase | [[authored-code-must-be-wired]] — no orphan-import phases |
| Workspace-wide `lint = "allow"` to silence extraction fallout | [[strict-rust-engineering]] |

State the refusal. Cite the rule by name. Propose the correct path.

## Related

- `/clean-extract` — orchestrator that drives both modes
- `/fork-survey` — produces the input for fold mode
- `/merge-one-branch` — sibling skill; same refusal posture for git merges
- `references/anti-drift-checklist.md` — Step F3 source
- `references/phase-template.md` — what each phase block looks like in the saved plan
