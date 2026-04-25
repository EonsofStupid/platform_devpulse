# platform/_shared — Devtool primitive convention

This folder is the canonical chrome + content kit for `/devtools/*` pages.
Every per-service devtool composes the components here instead of
re-rolling cards, error panels, refresh buttons, log tables, or empty
states.

## When to use which component

| Need                                 | Component               | Notes                                         |
|--------------------------------------|-------------------------|-----------------------------------------------|
| 5-tab page chrome                    | `ServiceDevtoolShell`   | Status / Config / Logs / Actions / Debug + extras |
| One-line "what is this" intro chip   | `DevtoolDescription`    | Top of any tab body                           |
| Single label/value tile              | `DevtoolStatBox`        | Status / Debug grids                          |
| Empty / waiting placeholder          | `DevtoolEmptyState`     | Replaces `<Text color="muted">No entries…</Text>` |
| Command failure surface              | `DevtoolErrorPanel`     | Accepts `CommandError | string | null`        |
| Refresh affordance bound to a query  | `DevtoolRefreshButton`  | Pass a `TauriQuery` / `PolledQuery` instance  |
| Logs tab body (preset selector + tail) | `DevtoolLogsTab`      | Owns the `queryScopedLog` query internally    |
| Single-target legacy log tail        | `ScopedLogPanel`        | DEPRECATED — migrate to `DevtoolLogsTab` on next touch |

## Patterns to follow

**Always pass a query, never raw state.** `DevtoolRefreshButton` and
`DevtoolLogsTab` consume rune-helper instances from `$lib/sys/runes`
(`TauriQuery`, `PolledQuery`). Do not manage `loading` / `error` /
`lastFetchedAt` by hand — that's exactly the duplication this folder
exists to delete.

**Always pass `CommandError`, not a string, to `DevtoolErrorPanel`.** The
panel shows the `kind` as a tone-colored Badge so users can tell
"rate-limited" from "auth-failed" at a glance. Bare strings work as a
migration shim only.

**Brand accents come from the shell.** Inside any of these components,
`var(--accent-service-main)` resolves to the per-page brand accent the
shell scoped. Don't hardcode `--accent-purple-main` in a child — let the
shell pick.

**No raw `<div style="background: var(--surface-base); border: 1px
solid var(--border-subtle); …">` blocks in new devtool code.** That
shape is what `DevtoolStatBox` / `DevtoolEmptyState` / `DevtoolDescription`
encode. New uses are review-blocked.

## Authoring a new component here

1. Match the `<!-- @file Name @domain platform/_shared -->` header
   convention used by every existing component.
2. Add a `# Usage` comment block with at least one realistic snippet.
3. Re-export from `index.ts`. Keep the barrel alphabetical.
4. Add a row to the table above.
5. Migrate at least one existing devtool to consume it as proof.

## Migration status

| Devtool                  | Uses F-3 components | Logs tab                     |
|--------------------------|---------------------|------------------------------|
| `/devtools/claude`       | YES (proof of concept, F-3 commit) | `DevtoolLogsTab`             |
| `/devtools/stt`          | partial (Logs tab only) | `DevtoolLogsTab`             |
| `/devtools/cache`        | not yet             | `ScopedLogPanel` (deprecated) |
| `/devtools/devforge`     | not yet             | `ScopedLogPanel` (deprecated) |
| `/devtools/ollama_sidecar` | not yet           | `ScopedLogPanel` (deprecated) |
| `/devtools/surrealdb_sidecar` | not yet        | `ScopedLogPanel` (deprecated) |
| `/devtools/vision`       | not yet             | `ScopedLogPanel` (deprecated) |

Lazy migration policy: convert each on next touch. Don't sweep — the
five `ScopedLogPanel` consumers are stable and not blocking the F-3
exit criteria.
