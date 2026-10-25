# Your recovered code

Plan 0009. Owner, 2026-10-24: "i still have like none of my actual code
recovered this is bullshit for years of work" — answered with "All of it back
now, then wire".

Everything here is your code, **unchanged, byte for byte**, kept out of the
build, Biome and the commit hooks (`Cargo.toml` `exclude`, `biome.json`,
`lefthook.yml`, and `.gitattributes` `-text` so git never rewrites a line
ending). Nothing here is deleted without your OK per item.

## `repo/` — this repository's history

Every code file (`.rs .ts .svelte .tsx .js .mjs .py .surql .sql .toml .css`)
that any branch's history deleted and that is not at HEAD — build output,
vendored `deps/` and generated files aside — written at its original path from
the commit just before its last deletion: **4,923 files**. 186 more were not
copied because their exact content is still at HEAD under another path.

- `repo/SOURCES.tsv` — per file: its original path, where it was written, the
  commit it was copied from, the commit that deleted it, the date, whether its
  name still exists at HEAD (`no` = truly gone, 2,205 files; `yes` = moved or
  rewritten, 2,718), and that commit's subject.
- Two versions whose paths differ only in case would overwrite each other on
  Windows; the second keeps its commit in its name
  (`HStack@c172b6b4.svelte`).
- Regenerate or extend with `python -I scripts/recovery/restore_history.py`.

## `devpulselabs/` — the chat crates, copied in once

From `D:\projects\devpulselabs` at `c78ec8b` (branch `docs/rulings-2026-10-25`),
your answer "devpulselabs only", 103 files at their original paths:

- `crates/chat/` — 16 crates: accounts, browser-auth, context, core (the
  rooms and roles library), extensions, imagine, interactions, profiles,
  providers, renderers, runtime, social, **store** (the Claude Code and Codex
  session readers AgentHub uses), testkit, window, windows;
- its workspace `Cargo.toml` and `Cargo.lock`;
- its chat design, plans and research (`docs/design`, `docs/plans`,
  `docs/research`) and the screenshots of the native chat (`docs/proof`).

That folder is never read again; this copy is the source.

## Wiring it back

Each capability is authored back into its owning boundary, working, under that
boundary's plan and rules — AgentHub first (plan 0001 B5, plan 0009 R3), then
in the order you set.
