# Anti-Drift Checklist — what each phase verifies

> Applied by `/fold-and-execute` Step F3 (sweep) and again at every
> phase boundary in execute mode. Each item is binary: PASS or FAIL.
> Any FAIL must be resolved before the phase commit lands.

## Structural drift (per moved/renamed crate)

| # | Check | How to verify |
|---|---|---|
| S1 | New crate name matches naming-conventions SSOT | `references/naming-conventions.md` pattern match |
| S2 | New folder location matches `<tier>/<crate>/` pattern | path inspection |
| S3 | `Cargo.toml` `name` field matches new crate name | grep `^name = ` |
| S4 | `Cargo.toml` `version` is fresh-start `0.1.0` OR explicitly carries over from manifest | `references/version-carryover-policy.md` |
| S5 | `Cargo.toml` `[lints] workspace = true` present | grep `[lints]` block |
| S6 | `src/lib.rs` is pure declarations + re-exports (no logic) | manual inspection — Read top of file |
| S7 | Exemplar's 3-module anatomy preserved (or documented deviation) | dir listing of `src/` |
| S8 | All `path = "../..."` deps retargeted to intra-new-repo paths | grep `path = ` in Cargo.toml |
| S9 | No `path = ` deps pointing back into the OLD repo | grep should return zero |
| S10 | `#![warn(missing_docs)]` in `src/lib.rs` | grep |

## Symbol drift (per moved crate)

| # | Check | How to verify |
|---|---|---|
| Y1 | All `pub` items have docstrings | `cargo doc --no-deps` warnings == 0 |
| Y2 | No public symbol uses banned naming (utils, helpers, common, shared, mgr, cfg) | grep public surface |
| Y3 | No re-export shadows a `From` parallel-DTO pattern | per [[ip-boundary-is-vocabulary-not-wrappers]] |
| Y4 | Crate docstring (top of lib.rs) explains WHAT + WHY | manual inspection |

## Dependency drift

| # | Check | How to verify |
|---|---|---|
| D1 | All workspace-inherited deps still resolve in the destination workspace | `cargo check -p <crate>` |
| D2 | All external crate deps explicit version-pinned OR `workspace = true` | grep `[dependencies]` block |
| D3 | `[patch.crates-io]` entries that the crate transitively needs are present in the destination workspace `Cargo.toml` | manual cross-check |
| D4 | No git deps point at a moved-in-tree dep — git-dep transition is intentional, not accidental | grep `git = ` |
| D5 | Feature flag chains still one level deep (Cargo limit) | manual inspection |

## Source-repo cleanup drift (after the CUT phase)

| # | Check | How to verify |
|---|---|---|
| C1 | Source repo `Cargo.toml` `[workspace] members` lists no extracted paths | Read top-level Cargo.toml |
| C2 | Source repo has no `path = "../<extracted-crate>"` references | grep |
| C3 | Source repo has no `use <extracted_crate_old_name>::` imports anywhere | grep |
| C4 | Source repo `xtask` knows nothing about extracted crate's build chain | grep xtask/src |
| C5 | Source repo `release-please-config.json` doesn't list extracted components | Read JSON |
| C6 | Source repo `.release-please-manifest.json` doesn't list extracted components | Read JSON |
| C7 | Source repo lefthook.yml doesn't reference extracted-crate-specific hooks | Read yml |
| C8 | Source repo `docs/` and `scripts/` don't have orphaned references to extracted crates (acceptable to keep in CHANGELOG and historical docs) | grep |
| C9 | Source repo `cargo check -p <kept-crate>` still passes for every remaining crate | per-crate matrix run |

## Hardcoded-constant drift

| # | Check | How to verify |
|---|---|---|
| H1 | No new hardcoded numeric constants in lib files (all from SSOT TOML) | grep for `\\d+\\s*[;,]` in non-test code |
| H2 | No new hardcoded URLs / hostnames | grep `https?://` |
| H3 | No new hardcoded paths | grep `[CcDd]:[\\\\/]` |
| H4 | No new hardcoded ports (must come from config) | grep `:[0-9]{4,5}\\b` |
| H5 | No new hardcoded usernames / IDs / credentials | grep common patterns |
| H6 | Existing hardcoded constants are NOT silently moved — each is flagged for refactor-to-config in the phase plan | manual review |

## Lefthook / CI drift

| # | Check | How to verify |
|---|---|---|
| L1 | Destination repo has lefthook.yml | file exists |
| L2 | Destination lefthook covers: clippy, fmt --check, cargo-deny, svelte-check (if frontend), commit-msg | Read lefthook.yml |
| L3 | `pre-push` includes the same gates as source repo | grep |
| L4 | Destination CI workflow runs against the same Rust toolchain | Read .github/workflows/ |
| L5 | Destination has IP boundary check if it owns kernel content | per `references/ip-boundary-relocation.md` |
| L6 | Destination cargo-deny ledger ported | Read deny.toml |

## Documentation drift

| # | Check | How to verify |
|---|---|---|
| M1 | Destination repo has top-level README.md explaining what it is, who it's for, how to build | file exists, manual read |
| M2 | Each moved crate's docstring updated to reflect new home (no "this lives in monorepo X" stale text) | grep stale phrasing |
| M3 | Cross-references between docs and code use the new crate names | grep |
| M4 | Source repo's stale references to extracted crates are explicitly removed (not stripped silently — track in CHANGELOG) | review CHANGELOG entries |

## How violations are surfaced

The fold step emits a `drift_findings` array per crate in the saved plan:

```markdown
## 2. Anti-drift findings

### `clyffyos-cortex` (from `kernel/devpulse-clyffy/`)

- ✗ H1: 3 hardcoded constants found in `src/cortex/persistence/surreal/intelligence.rs` lines 122, 188, 304
  - **Resolution:** Pre-phase fix-up. Lift to `crate::config::IntelligenceTunables` first.
- ✗ S7: missing `src/interactions/mod.rs` module docstring
  - **Resolution:** Phase 0 add-only edit.
- ✓ S1, S2, S3, S5, S8, S10 (passing)
```

Pre-phase fix-ups become PHASE -1 edits (still 5-file capped per CC-002). The extraction phase doesn't start until pre-phase fixes land green.

## Refusal posture (this checklist is mandatory)

- Skipping the sweep at fold-time → refuse with citation
- Skipping per-phase verification of S1–S10 + Y1–Y4 → refuse
- Marking a check ✓ without running the verification command → refuse and re-run
- Adding NEW drift to silence an existing failure → refuse and cite [[strict-rust-engineering]]
