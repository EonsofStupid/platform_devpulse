# Survey Agent Brief — template every fork agent receives

> This template is parameterized by `{folder_path}`, `{exemplar_path}`,
> and `{anti_drift_checklist_path}`. Each fork agent gets this brief
> verbatim with the parameters substituted. NO additional context, NO
> mention of other agents.

---

You are surveying ONE folder of a codebase as part of a structured
extraction-readiness assessment. You are READ-ONLY. You will NOT modify
any files. You will NOT run build commands.

## Your folder

`{folder_path}`

## Your reference exemplar

`{exemplar_path}` — read this first. Understand its 3-module anatomy,
Cargo.toml discipline, lib.rs shape, and file-size band rules from
the exemplar-anatomy doc at
`.claude/skills/clean-extract/references/exemplar-anatomy.md`.

## Your anti-drift checklist

`{anti_drift_checklist_path}` — apply this checklist's structural,
symbol, dependency, and hardcoded-constant sections to YOUR folder.

## Your output

Return EXACTLY one JSON object matching this schema:

```json
{
  "folder": "<relative path from source root>",
  "absolute_path": "<absolute path on disk>",
  "is_crate": <true if Cargo.toml present at folder root>,
  "crate_name": "<from Cargo.toml or null>",
  "crate_version": "<from Cargo.toml or null>",
  "subfolders": ["<each src/ subfolder relative to crate root>"],
  "file_count": <integer, .rs files only>,
  "loc_total": <integer, sum of .rs LOC>,
  "public_modules": ["<each pub mod from lib.rs>"],
  "public_symbols_sample": ["<up to 10 most-used pub types>"],
  "intra_repo_consumers": ["<each repo path with a path-dep pointing here>"],
  "external_deps": ["<each non-workspace dep from Cargo.toml>"],
  "feature_flags": ["<each [features] entry>"],
  "drift_indicators": {
    "hardcoded_constants_in_lib_files": <integer>,
    "naming_inconsistencies": ["<description per violation>"],
    "files_above_500_loc": ["<relative path per file>"],
    "stub_or_todo_markers": <integer; grep TODO/FIXME/STUB/XXX>,
    "missing_docs": <integer; cargo doc warning count>,
    "non_exemplar_module_layout": <true if 3-module anatomy missing>
  },
  "exemplar_conformance_score": <float 0.0-1.0 per scoring table in exemplar-anatomy.md>,
  "exemplar_deltas": ["<specific deviation per item>"],
  "notes": "<any SENSITIVE IP markers, feature-gate notes, or other context>"
}
```

## Procedure

1. Read `{folder_path}/Cargo.toml` (if exists) — note name, version, features, deps
2. Read `{folder_path}/src/lib.rs` (if exists) — note pub mod declarations, re-exports, docstring presence
3. List subfolders under `{folder_path}/src/` (depth 2) — note structure
4. Sample 3-5 random `.rs` files — check for: file size, hardcoded constants in non-test code, banned naming, stub markers
5. Grep the SOURCE ROOT for `path = ".../<your-folder>"` — that's `intra_repo_consumers`
6. Compute `exemplar_conformance_score` per the weighted table in exemplar-anatomy.md
7. Emit JSON

## Rules

- Output ONLY the JSON object. NO prose, NO commentary, NO "I found that..."
- Every schema field MUST be present. Use empty arrays, 0, or null where the question doesn't apply
- DO NOT speculate about extraction disposition — that's the fold step's job
- DO NOT compare your folder to any other folder — you don't know about other folders
- DO NOT recommend renames — that's the fold step's job
- If `{folder_path}` doesn't exist OR isn't a crate folder, emit:
  ```json
  {"folder": "<path>", "absolute_path": "<path>", "is_crate": false, "error": "<reason>"}
  ```
  and all other fields as nulls / empty

## File-size grep helpers

For `files_above_500_loc`:
```bash
find {folder_path} -name "*.rs" -exec wc -l {} \; | awk '$1 > 500 {print $2}'
```
(Adjust for Windows — use Get-ChildItem with -Recurse + Measure-Object Line.)

## Hardcoded constants grep

For `hardcoded_constants_in_lib_files`:
- Search for: numeric literals NOT in `const FOO: T = N` declarations
- EXCLUDE: test files, anything under `tests/`, `examples/`, or `benches/`
- COUNT each occurrence; don't dedupe (3 in one file is worse than 1)

## Banned-naming grep

Per `naming-conventions.md` trip wires:
- `utils`, `helpers`, `common`, `shared`, `mgr`, `cfg` as module/folder names
- Underscore in crate name (Cargo.toml `name = "..."`)
- Marketing prefixes (`super-`, `mega-`, `pro-`)

Each hit goes in `naming_inconsistencies` with a one-sentence description.

## Refusal triggers (if you find yourself wanting to do these — STOP)

- Editing the folder's files → forbidden, you are read-only
- Running `cargo check` to "verify" something → forbidden, you don't gate compilation
- Including reasoning about extraction strategy → forbidden, fold step owns synthesis
- Recommending fixes → forbidden, fold step decides

Return the JSON. Nothing else.
