---
name: fork
description: Fork a NEW Claude Code session seeded with a durable CHARTER (its primary mission) so the new session self-briefs and the operator never re-explains. Manages .claude/charters/ — author, activate, list, clear charters; prints the one-command seeded launch; a network-independent SessionStart hook auto-announces the active charter (minimal, verify-before-trust). Invoke as `/fork <slug>` to activate + launch, `/fork new <slug>` to author, `/fork list`, `/fork clear`.
---

# `/fork <slug>` — charter-driven session handoff

Hand a primary mission to a NEW session via a durable charter, not by re-typing
context. Charters live at `.claude/charters/<slug>.md` (the spec for that
mission); `active.json` marks which is live; the SessionStart hook
`.claude/hooks/inject-charter.js` announces it; `fork.ps1` / `fork.sh` launch a
seeded interactive session.

The pattern (June 2026 handoff consensus): **handoff beats compaction** — split
threads so each fits, instead of cramming one. Charters are durable; SessionStart
injection is **minimal + verify-before-trust** — announce the charter, point to
the file, re-verify against the repo, never blind-trust stale notes. Canon:
`.claude/charters/README.md`.

## What "fork a session" actually means here

`/fork` is **Claude-triggerable**: this skill is model-invocable, so Claude
activates a charter and can **spawn the new session itself** —
`pwsh .claude/charters/fork.ps1 <slug> -Spawn` (run from the Bash tool) opens a
fresh seeded Claude session in a new terminal window on the operator's desktop.
Without `-Spawn` it activates + prints the one-command launch for the operator
to run. Either way: **zero re-explaining**. Any new session in the repo also
auto-announces the active charter via the SessionStart hook.

## Subcommands

- **`/fork <slug>`** — activate + launch. When Claude runs this:
  1. `node .claude/charters/activate.mjs <slug>` (writes `active.json`).
  2. To TRIGGER the new session directly (Claude-initiated):
     `pwsh .claude/charters/fork.ps1 <slug> -Spawn` from the Bash tool — opens a
     seeded session in a new window. Otherwise hand the operator the one-command
     launch (run in a PLAIN terminal, NOT inside this session):
     - Windows: `pwsh .claude/charters/fork.ps1 <slug>`
     - POSIX: `bash .claude/charters/fork.sh <slug>`
     - or directly: `claude "Read .claude/charters/<slug>.md and begin; verify against the repo first."`
  3. New sessions will also auto-announce this charter.

- **`/fork new <slug>`** — author a NEW charter. This is a `/spec-first` act —
  the charter IS the forked session's spec, so do NOT invent scope. Interview
  the operator for: **Primary goal** (one line), Why/problem, Constraints,
  Success criteria, Starter references, and any blocking decisions. Write
  `.claude/charters/<slug>.md` modeled on `kernel-extraction.md`. A one-line
  `**Primary goal:**` is REQUIRED (the launcher + hook parse it). Then offer to
  `/fork <slug>`.

- **`/fork list`** — `node .claude/charters/activate.mjs` (no args) — lists
  charters and marks the active one.

- **`/fork clear`** — `node .claude/charters/activate.mjs clear` — no active
  charter; the SessionStart hook stops announcing.

## Rules

- Launch scripts run in a plain terminal, never nested inside a Claude session.
- Charters are durable specs — keep current; clear or delete when the work lands.
- No hardcoded paths — scripts resolve the workspace from their own location
  ([[no-hardcoding-clyffy-agnostic]]).
- Composes with [[spec-first-before-code]] (charter = spec), `/clean-extract`,
  `/planning`.

## Related

- `.claude/charters/README.md` — the system spec
- `/clean-extract <subsystem>` — the structural-extraction vehicle a charter
  often points at (e.g. `kernel-extraction` → `/clean-extract clyffyos`)
