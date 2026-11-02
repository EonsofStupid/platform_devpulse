# Recovery status — 2026-11-02

`recovered/` is temporary staging. The owner requires restoration to proper
owning locations, including documentation and planning. Staged source is
excluded from the workspace build and does not restore a working feature.

## Working-owner restoration — 2026-11-02

- Current inventory: 6,066 provenance records; 812 restored or reconciled;
  **5,254 still staged**. The dated checkpoints below are historical counts.
- Restored the missing ColdLight Tree renderer in
  `packages/coldlight/components/tree/`, with TreeItem, colocated types,
  existing owned behavior, generated styling and a review story. Eight browser
  tests cover navigation, selection, controlled state and disabled/nested items.
  Both historical Tree shells now reference that owner in `repo/SOURCES.tsv`.
- Verified 36 historical anatomy modules against their current ColdLight
  behavior owners. Only relative schema imports differ. These are existing
  implementations reconciled with provenance, not newly restored features.
- Reviewed six additional kernel sources against their cortex owners:
  community cache, knowledge selector/sync/tests, persona types and guidance
  persistence. Each manifest note records actual storage/API differences.
  The comparison exposed a lost version-only knowledge checkpoint; the current
  owner is fixed and its database regression test passes (10 knowledge tests).
- Those 46 records retain original Git references and reviewed destination
  hashes. Staging copies were removed only after checking original bytes,
  recording destinations and rechecking destination hashes. Unreviewed sources
  remain preserved. This does not complete restoration or AgentHub R3b.
- The final preservation audit verifies all 6,066 records with zero uncovered
  sources within its documented extension/history coverage; 18 recovery tests
  pass. Two historical Tree sources (behavior and primitive contract) previously
  survived verbatim; they now have explicit provenance for their repaired owners.
- ColdLight, desktop and story typechecks, 31 token tests, generated-output
  freshness, workspace all-target checking and strict Clippy pass. Architecture
  tests pass 20/20 on retry after a source-scan timeout during concurrent builds.
  The Tauri app has not been launched for visual acceptance of this batch.

## Restoration to original locations — 2026-11-01

- Restored 691 documentation and documentation-support files, 2,870,573 bytes,
  to their recorded original paths. Each destination was absent before the
  move and matches the original Git blob byte-for-byte. No existing document
  was overwritten. Staging copies were removed only after verification and
  recording the destination in `repo/SOURCES.tsv` (`restored_to`).
- This includes 338 Markdown and two MDX files, the original `history.txt`,
  documentation-site supporting source/assets, historical sprint/research plans
  under `scripts/docs/sprints/`,
  and ColdLight documentation under its recorded directories. Historical
  instructions are preserved evidence, not a reversal of current owner rulings.
- Two further uncovered files were preserved: chat `SessionRow.svelte` remains
  staged pending consumer reconciliation; the old design `CLAUDE.md` was restored
  with the documents. Its old prohibition on `ui/` does not override the owner's
  current component/type/colocated-UI architecture.
- All 6,054 provenance entries pass comparison against their original Git blob
  or explicitly reviewed restoration digest. There are now 756 restored or
  reconciled entries and 5,298 still staged. Another 403 deleted paths survive
  verbatim in active HEAD. Imported devpulselabs sources are counted separately.
- Six of those reconciled entries record direct replacements for obsolete
  hiding policies under the owner's 2026-11-01 reversal. These are not six newly
  restored features: build-only UI flags now use runtime presentation;
  vocabulary bans now use label validation; architecture checks require an
  included kernel; unused model-loader access restrictions are removed. Each
  original Git source is retained alongside a reviewed replacement digest.
  No staged implementation was discarded by this policy correction.
  The current model-loader suite passes 170 tests without secrecy features;
  five old build-mode policy tests no longer apply. See plan 0009 for UI,
  engine, browser, architecture and production-build validation.
- Restored the 12-file persona MCP crate into `kernel/devpulse-persona-mcp`
  and the Rust workspace. Its 26 tests pass, including actual stdio subprocess
  tests, concurrent writes, transaction rollback and persistence across restart.
  It uses the current Turso adapter, one connection per operation, atomic
  idempotent writes, and explicit database configuration. Clippy and rustfmt
  pass. Desktop bundling, session attachment and non-text retrieval remain open.
- Reconciled 13 old connectome files with their existing cortex owners. The
  reviewed differences are solely connectome-to-cortex names/imports; current
  implementations were not overwritten. Original Git provenance and reviewed
  destination hashes are retained before removing redundant staging copies.
- Reviewed another 24 kernel files against their cortex owners. Changes are
  storage terminology/imports, module exports, test error handling, and the
  existing serialized Surreal server boundary. Each manifest note identifies
  the actual difference. This establishes source preservation per file, not
  completion of every feature those modules describe.
- Reconciled ten historical ColdLight files with current package owners after
  verifying that only internal import prefixes differ. ColdLight `pnpm check`
  passes with zero errors/warnings. Generated-style verification finds all 114
  outputs current, with zero changed outputs; Style Dictionary still emits
  metadata collision warnings. Other historical design code needs review.
- Moved llama-server, STT and TTS settings out of engine into
  `kernel/model-loader/src/runtimes/`, updating desktop callers directly.
  Settings writes now use unique temporary files, checked synchronization,
  atomic replacement and shared/exclusive file locks for readers/writers.
  Fixed download path sanitization for dot segments and deserialized projects.
  The selected model-loader suite (`--no-default-features --features
  specta,mode-dev --lib`) passes all 175 tests, including the ten runtime
  settings tests. Its all-target Clippy check and targeted rustfmt pass;
  engine and desktop backend compile after the changes.
- The fourteen recovery regression tests pass. They cover original-path restoration,
  destination conflicts, modified/missing restored files, interrupted cleanup,
  repeat runs, new discoveries in one command, workspace path containment and
  preservation of earlier recovered versions and explicit reconciled digests,
  and a clean clone without the local deletion commit. Source references now
  use full resolved commit IDs; all 169 source revisions are reachable from
  published origin history or the current branch being pushed.
- `pnpm check` passes with zero errors/warnings. `cargo check -p devpulse-clyffy
  -p devpulse-engine` and targeted `cargo fmt --check` pass after moving the
  endpoint adapter from engine onboarding to kernel provider adapters.
- The moved adapter's four unit tests pass. Its live endpoint test remains
  explicitly ignored because no live endpoint was supplied for this check.
- Remaining: reconcile documents with current architecture while retaining
  history; audit changed-in-place work; restore remaining executable source to
  current owners and wire consumers. This is not full project restoration.

```powershell
python -I scripts/recovery/restore_history.py --restore-docs
python -I scripts/recovery/restore_history.py --check
```

The checker requires unreconciled restored content to match its source blob.
Reviewed integration changes require both `restored_sha256` and a review note;
the original source revision remains recorded. It reports unrecorded changes
rather than overwriting them.

## Earlier staging audit — 2026-10-27

- The original 4,923 manifest entries all matched their source blobs byte
  for byte. None of those archived files was missing or altered.
- The audit restored another 1,110 files omitted by the original extension
  filter or no longer surviving verbatim in the active tree: 591 HTML files,
  337 Markdown files, 148 JSON files, 20 image/icon files, 13 other supporting
  text/script/configuration files and one Rust file. HTML includes
  archived generated documentation; these counts are not feature counts.
- The remaining-format audit restored 13 more files: two grammars, the
  adapter manifest, editor configuration, ignore files, a CSS backup, a
  documentation marker, and the original design/font ZIP archives. The
  archives are preserved intact; they have not been unpacked or executed.
- `repo/SOURCES.tsv` then recorded 6,046 source files (119,284,910 bytes), each
  with its original path and source/deletion commit. All 6,046 match Git.
- Another 404 deleted source paths have their exact content elsewhere in
  active HEAD. This proves content presence, not that a feature is wired in.

Run from the repository root:

```powershell
python -I scripts/recovery/restore_history.py --check
python -I scripts/recovery/test_restore_history.py
```

The first command is read-only and fails on missing/changed archive content
or an uncovered deletion within its documented scope. The six regression
tests use temporary Git repositories and verify that rerunning recovery
preserves the manifest, changed files and earlier recovered revisions.

## Active delivery is separate

| Capability | Preserved source | Active delivery status |
| --- | --- | --- |
| Provider history | `devpulselabs/crates/chat/store` and Claude/Codex providers | Ported into kernel history readers and engine facade; retained indexes and parent metadata tested. Board UI is unfinished. |
| Agent conversations and rooms | `devpulselabs/crates/chat/runtime` and providers | Active engine/kernel execution exists. Completion persistence, subprocess extraction and full UI remain unfinished. |
| Persona memory MCP | `kernel/devpulse-persona-mcp`; original revisions in `repo/SOURCES.tsv` | Restored workspace binary; 26 tests pass, including real stdio and restart persistence. Desktop bundling and session attachment remain open under plan 0001 B6. |
| Maestro | `repo/systems/maestro` and `repo/kernel/devpulse-maestro` | Preserved; no restored Maestro workspace member. |
| Historical desktop/design implementations | `repo/interfaces/desktop`, `repo/alpha` and related paths | Preserved; they must be mapped to active owners individually, not blindly compiled alongside the current UI. |

## Limits of this audit

The recovery script covers the latest deletion of each absent path across
locally available Git refs, using its explicit source/supporting-file
extensions and exclusions. It preserves all already-recorded revisions.
It does not prove that an existing file still implements every historical
capability, recover never-committed files, inspect unavailable Git refs, or
restore all historical versions of every file. Only explicitly named
extensionless files are covered; build output, debug logs and submodule or
worktree targets are not copied into the archive. The imported
`devpulselabs` tree is separate from this repository-history manifest; this
audit did not revisit its original external checkout.

The governing implementation and ownership requirements remain in
[plan 0009](../.plan/0009-repo--wire-recovered-code.md).
