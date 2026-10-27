# Recovery status — 2026-10-27

Recovered files are preserved source material. They are excluded from the
workspace build and do not by themselves restore a working product feature.

## Verified against this repository's Git history

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
- `repo/SOURCES.tsv` now records 6,046 source files (119,284,910 bytes), each
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
| Persona memory MCP | `repo/systems/devpulse-persona-mcp` | Preserved; plan 0001 B6 still owns integration. Archive presence is not a running server. |
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
