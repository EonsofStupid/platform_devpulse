# Charters — durable session handoff

A **charter** is a durable, version-controlled spec that carries a primary
mission to a NEW Claude Code session, so the new session self-briefs and the
operator never re-explains. This is the "fork a seeded session" system.

## Why (June 2026 handoff discipline)

- **Handoff > compaction.** Compaction crams one thread to fit; a handoff
  splits threads so each fits naturally — structural, not a band-aid.
- **Durable + explicit.** The charter is a file on disk that any session picks
  up. No implicit state, no re-explaining.
- **Minimal injection, verify before trust.** The SessionStart hook announces
  the active charter in ONE banner and points to the file — it never
  auto-dumps the body. A forked session reads the charter, then VERIFIES it
  against the current repo before trusting it (the charter is durable; code
  moves). Blind-trusting stale notes is the failure mode this avoids.

## Files

| File | Role |
| --- | --- |
| `<slug>.md` | a charter — the mission spec: Primary goal, why, constraints, success criteria, starter refs, blocking decisions |
| `active.json` | pointer to the live charter (`{ slug, goal, activatedAt }`); `slug: null` = none |
| `activate.mjs` | `node activate.mjs <slug>` marks a charter active (robust JSON); `… clear` clears; no-arg lists |
| `fork.ps1` | Windows launcher — activate + start a seeded interactive `claude` session |
| `fork.sh` | POSIX launcher (Linux/Mac seam) — same |

The SessionStart hook [`../hooks/inject-charter.js`](../hooks/inject-charter.js)
reads `active.json` and emits the banner. It is **network-independent** (local
file, not SurrealDB) so it works offline — unlike `restore-memory.js`, which
short-circuits when SurrealDB is down.

## Use

- **Fork into a charter** (plain terminal, NOT inside Claude):
  `pwsh .claude/charters/fork.ps1 <slug>` → new interactive session, seeded
  with the charter as its first message.
- **Claude-triggered fork:** the `/fork` skill is model-invocable and
  `fork.ps1 <slug> -Spawn` opens the seeded session in a NEW window — so Claude
  can trigger a fork itself (e.g. spin off a focused review or extraction
  session) instead of only handing you a command.
- **In-session control:** the `/fork` skill — `/fork <slug>` (activate + print
  launch command), `/fork new <slug>` (author a charter), `/fork list`,
  `/fork clear`.
- **Auto-brief:** with a charter active, every new session in this repo leads
  with the charter banner (minimal; verify-before-trust).

## Conventions

- A one-line `**Primary goal:**` is REQUIRED (the launcher + hook read it).
- Charters are specs → author them through the `/spec-first` discipline; keep
  them current; `/fork clear` (or delete) when the work lands.
- Scripts resolve the workspace from their own location — **no hardcoded
  paths** ([[no-hardcoding-clyffy-agnostic]]).
