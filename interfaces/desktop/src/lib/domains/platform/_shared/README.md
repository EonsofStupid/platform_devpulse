# platform/_shared — Devtool golden-pattern playbook

This folder is the canonical chrome + adapter kit for `/devtools/*`
pages. Every per-service devtool composes the primitives from
`$lib/design/components/*` directly. The handful of adapters here
exist only for (a) chrome layout, (b) binding shipped primitives to
the rune helpers in `$lib/sys/runes`, (c) mapping `CommandError.kind`
to Badge variants. **No bespoke divs in tab bodies.**

## The 5-tab schema (WAI-ARIA APG-validated)

`ServiceDevtoolShell` ships these standard tabs in order. Add any
extras after via `extraTabs`. Don't rename — every devtool follows the
same shape so users learn the chrome once.

| Tab | Purpose | Typical primitives |
|---|---|---|
| **Status** | "What needs my attention right now?" Live state, key metrics | `Callout variant="tip"` intro → `DevtoolBentoGrid` of `Stat` (with `glow`) → `StatusDot` row → optional `SparkLine`/`RadialGauge`/`Meter` |
| **Config** | Knobs and toggles, ideally persisted | `Callout` → grouped `Card preset="glass"` panels → form fields |
| **Logs** | Tail + filter scoped tracing log | `<DevtoolLogsTab targetPresets={…} />` |
| **Actions** | Verbs (start/stop/register/clear). Destructive ones get warning callouts + `Kbd` hints | `Card preset="glass"` per action group → `Button` cluster → `Kbd` for shortcuts |
| **Debug** | Power-user probes — sample requests, raw endpoint calls | Same primitives, more raw |

## Use shipped primitives directly

| Need | Component path | Variants/props |
|---|---|---|
| Big metric tile | `$lib/design/components/stat` | `accent` (teal/purple/magenta/ember/frost/cyber), `glow`, `size` (sm/md/lg) |
| Time-series strip | `$lib/design/components/spark-line` | live trend, no chart lib |
| Saturation gauge | `$lib/design/components/radial-gauge` | CPU%, throttle%, etc. |
| Linear progress | `$lib/design/components/meter` / `progress` | animated fill |
| Live state pip | `$lib/design/components/status-dot` | pulses in signal color |
| Frosted card | `$lib/design/components/card` `preset="glass"` | dark-glassmorphism backdrop blur + edge-light border |
| Service intro chip | `$lib/design/components/callout` `variant="tip"` | also `info` / `success` / `warning` / `error` |
| Failure surface | `$lib/design/components/alert` | full WAI-ARIA APG `alert` role + dismissible. **Use `CommandErrorAlert` adapter** for typed `CommandError` mapping |
| Empty / no-data | `$lib/design/components/empty-state` | slot composition (icon/title/description/action) |
| Tab navigation | `$lib/design/components/tabs` | WAI-ARIA APG-compliant; `activateOnFocus={false}` for click-to-activate (e.g. log target chips) |
| Hover-context | `$lib/design/components/tooltip` | `Tooltip` + `TooltipTrigger` + `TooltipContent` |
| Keyboard hints | `$lib/design/components/kbd` | for Actions tab |
| Inline code | `$lib/design/components/code` | token-styled |
| Key-value lists | `$lib/design/components/key-value` / `description-list` | metadata blocks |

## The few `_shared/` adapters

Everything else in this folder. Use these too — they're the boring
bridge between shipped primitives and devpulse-specific concerns.

| Adapter | Wraps | Why it exists |
|---|---|---|
| `ServiceDevtoolShell` | `Tabs` + chrome + `BackgroundScene` | 5-tab schema, axis breadcrumb, accent scoping, capture/copy/export, per-devtool backdrop auto-mount via `backdrop` prop |
| `DevtoolBentoGrid` | CSS grid + fluid space tokens | Bento-style 2/3/4-col responsive layout for tab bodies |
| `DevtoolBentoTile` | `Card preset="glass"` + col-span | Single bento tile for grids that want per-tile glass framing |
| `DevtoolLogsTab` | `Tabs` + `TauriQuery` + `queryScopedLog` | Logs-tab body — owns the target preset selector + log fetch internally |
| `DevtoolRefreshButton` | `Button` + `Spinner` | Binds to `TauriQuery` / `PolledQuery` instance — spinner-while-loading, AlertTriangle on error |
| `CommandErrorAlert` | `Alert` + `Badge` | Maps `CommandError.kind` to a Badge variant + display label inside an `Alert variant="error"` |
| `ScopedLogPanel` | (single-target log tail) | DEPRECATED — migrate to `DevtoolLogsTab` on next touch |

## The accent + backdrop registry

`serviceAccents.ts` is the single source for two things per devtool:

1. **`SERVICE_ACCENTS`** — slug → `BrandAccent` (paints the dot, icon,
   active-tab underline, `--accent-service-{main,glow,fill}`)
2. **`SERVICE_BACKDROPS`** — slug → `ServiceBackdrop` (variation +
   intensity + speed for the per-devtool ambient backdrop)

`accentToBackdropPalette(accent)` derives the BackgroundScene palette
from the accent so the colour family stays in sync. Each devtool just
passes `accent="coral"` and `backdrop="claude"` (its slug) to
`ServiceDevtoolShell` and the rest is wired automatically.

**Brand accent palette** (16 tokens — full list in
`serviceAccents.ts:BrandAccent`):
`teal | purple | magenta | ember | frost | cyber | cyan | green |
hotpink | coral | blue | salmon | gold | violet | electric | azure`

## Patterns to follow

- **Always pass a query, never raw state.** `DevtoolRefreshButton` and
  `DevtoolLogsTab` consume rune-helper instances from `$lib/sys/runes`
  (`TauriQuery`, `PolledQuery`). Don't manage `loading` / `error` /
  `lastFetchedAt` by hand.
- **Always pass `CommandError`, not a string, to `CommandErrorAlert`.**
  The kind→Badge mapping lets users tell rate-limited from auth-failed
  at a glance. Bare strings are a migration shim only.
- **Brand accents come from the shell.** Inside any tab body,
  `var(--accent-service-main)` resolves to the per-page brand accent.
  Don't hardcode `--accent-purple-main` in a child — let the shell pick.
- **Use design tokens.** `var(--space-3)`, `var(--border-width-hairline)`,
  `var(--signal-error-subtle)`. The `no-raw-values` lint hook catches
  raw `1px` / `#hex` / `12px`.
- **Per-devtool backdrop is opt-in.** Pass `backdrop={slug}` (looks up
  `SERVICE_BACKDROPS[slug]`) or an explicit config object. Omit to
  skip the scoped backdrop (the shell-wide cosmic mount in
  `Frame.svelte` still paints behind everything).

## Migration status

| Devtool | Uses shipped primitives | Logs tab | Has backdrop |
|---|---|---|---|
| `/devtools/claude` | YES (golden pattern) | `DevtoolLogsTab` | `backdrop="claude"` |
| `/devtools/stt` | partial | `DevtoolLogsTab` | not yet |
| `/devtools/cache` | not yet | `ScopedLogPanel` (deprecated) | not yet |
| `/devtools/devforge` | not yet | `ScopedLogPanel` (deprecated) | not yet |
| `/devtools/ollama_sidecar` | not yet | `ScopedLogPanel` (deprecated) | not yet |
| `/devtools/surrealdb_sidecar` | not yet | `ScopedLogPanel` (deprecated) | not yet |
| `/devtools/vision` | not yet | `ScopedLogPanel` (deprecated) | not yet |

Lazy migration: convert each on next touch. The five `ScopedLogPanel`
consumers + the bespoke divs in their tab bodies are stable, not
blocking the golden-pattern exit criteria.

## Authoring a new devtool

1. Wrap in `ServiceDevtoolShell` — pass `title`, `axis`, `accent`,
   `backdrop` (slug), `health`, snippet props for each tab body.
2. Inside each snippet: compose shipped primitives directly. Reach
   for `Callout` for intros, `DevtoolBentoGrid` of `Stat` for metrics,
   `Card preset="glass"` for groupings, `EmptyState` for no-data,
   `CommandErrorAlert` for errors, `Tabs` for sub-navigation.
3. Use `TauriQuery` / `PolledQuery` for fetches. Bind
   `DevtoolRefreshButton query={poll}` for the refresh affordance.
4. Use `<DevtoolLogsTab targetPresets={…} />` for the Logs tab — never
   re-roll the chip selector + table.
5. Add the slug to `SERVICE_ACCENTS` + `SERVICE_BACKDROPS`.
6. Verify svelte-check + biome + no-raw-values lint clean.
