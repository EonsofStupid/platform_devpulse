---
name: memory-ledger
description: Maintain and restore a persistent cross-session memory ledger — current context, a "do not repeat" learnings table (trigger / wrong action / correct action), open blockers, pending tasks, and user preferences. Restore it at session start; write to it whenever a mistake, decision, blocker, or preference should outlive the session. Use to stop repeating known mistakes across sessions.
---

# Memory Ledger

Give an agent durable memory and an anti-regression discipline across sessions.
Packaged from the `restore-memory` pattern. Conceptually mirrors Anthropic's
"Dreaming" (between-session memory consolidation) but as an explicit, inspectable
store you own.

## The ledger (schema)

| Store | Fields | Purpose |
|---|---|---|
| `context` | `key`, `value`, `priority` | Current working facts about the project |
| `learnings` | `trigger`, `wrong_action`, `correct_action`, `severity` | The "DO NOT REPEAT" table |
| `blockers` | `category`, `description`, `resolved` | Open impediments |
| `tasks` | `content`, `priority`, `status` | Pending / in-progress work |
| `preferences` | `category`, `key`, `value` | How the user wants things done |
| `sessions` | `session_id`, `summary`, `started_at`, `ended_at`, `message_count` | History |

Reference backend: SurrealDB (local-first with cloud fallback). Any durable
key-value/graph store works; the schema is what matters.

## Restore (at session start)

Emit a context brief the model reads as additional context, ordered:
1. **Critical learnings first** — the `severity = 'critical'` rows, formatted as
   `When X → WRONG: Y → CORRECT: Z`. These prevent repeat mistakes.
2. Current context (top by priority), open blockers, pending tasks, preferences,
   recent session summaries.

If the store is unreachable, degrade gracefully — note it and continue, never block.

## Write a learning (the key discipline)

The moment a mistake is identified and corrected, record it **before moving on**:
- `trigger`: the situation that should cue the correct behavior next time.
- `wrong_action`: what was done that failed.
- `correct_action`: what should happen instead.
- `severity`: `critical` for anything that wasted real time or broke a hard rule.

Deduplicate on `trigger`. A learning is only valuable if it's retrieved *before* the
same mistake recurs — phrase the trigger as the cue, not the postmortem.

## When to write each store

- **learning** — after any corrected mistake or rule violation.
- **blocker** — when stuck on something outside the current diff (infra, access).
- **task** — when work is deferred rather than done.
- **preference** — when the user states how they want things ("always X", "never Y").
- **context** — when a durable project fact is established or changes.

## Anti-patterns

- Treating in-context memory as durable — it vanishes at session end. Persist it.
- Recording learnings as vague postmortems instead of actionable triggers.
- Restoring everything verbatim (noise) instead of prioritized, critical-first.
