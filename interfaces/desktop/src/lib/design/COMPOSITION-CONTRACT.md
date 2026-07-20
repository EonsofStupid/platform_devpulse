# Composition Contract — authoritative spec

> **Sprint 00 deliverable.** Locks the **compose-don't-author** rule
> for every `feature/` orchestrator in the desktop app. States the
> 94 ColdLight primitives that already exist; states what an
> orchestrator may NOT hand-roll; cites the specific anti-pattern
> in the RRO devtool that this spec refuses; documents the
> `feature/` + `ui/` + `util/` colocation pattern with RRO as the
> reference.
>
> **Status:** Locked.
> **Owner:** Jesse.
> **Authored:** 2026-05-09.
> **Cross-references:**
> [`TRUTH.md`](./TRUTH.md) (5-stage pipeline, 5-tier taxonomy),
> [`RENDERFORGE.md`](./RENDERFORGE.md) (P1–P5 properties),
> [`MACRO-LAW.md`](./MACRO-LAW.md) (5 family-CSS laws),
> [`ONBOARDING-CASCADE.md`](./ONBOARDING-CASCADE.md),
> the connector-deferral rule (formerly `CONNECTOR-DEFERRAL.md`, now
> recorded in git history / Clyffy-side),
> locked memory `project_central_ui_library.md`,
> `project_nx_library_types.md`.

## The rule (one line)

A `feature/` orchestrator MAY NOT author markup or CSS that an
existing ColdLight primitive covers. If the primitive doesn't
cover the case, the orchestrator authors a `ui/` adapter colocated
with the feature; the adapter composes the primitives. The
orchestrator never reaches past `ui/` to raw HTML for visual
purposes.

This applies to every feature in
`interfaces/desktop/src/lib/domains/**/feature/` and every devtool
in `interfaces/desktop/src/lib/devtools/**/feature/`.

## Why

The desktop UI deleted 73 components in commit `2035d613` because
they had drifted: hand-rolled markup, inline `oklch()`, hardcoded
strings, custom CSS classes that duplicated primitives. Restoring
them only works if the new authoring discipline prevents the same
drift. This contract is that discipline.

The 5-stage pipeline ([`TRUTH.md`](./TRUTH.md)) routes every visual
through `renderForge` → primitives → glue CSS → presets → tokens.
A feature that bypasses the primitive layer breaks that pipeline at
its top stage; nothing downstream can fix it.

## The 94 primitives (current inventory)

`interfaces/desktop/src/lib/design/components/`:

```
_base, accordion, alert, alert-dialog, avatar, avatar-group,
background-scene, badge, banner, button, calendar, callout, card,
chat-bubble, chat-context-panel, chat-dashboard, chat-footer,
chat-frame, chat-sidebar, chat-topbar, checkbox, code, collapsible,
color-area, color-field, color-slider, color-swatch,
color-swatch-picker, color-wheel, combobox, contextual-help,
data-table, date-field, date-picker, date-range-field,
date-range-picker, description-list, dialog, dynamic-background,
empty-state, field, file-upload, form, form-field, heading,
inline-message, input-group, kbd, key-value, label, link-preview,
list, loading-overlay, menubar, meter, nav, navigation-menu,
notification-center, number-field, pagination, pin-input, popover,
progress, prose, radial-gauge, radio-group, range-calendar,
scroll-area, search-field, select, separator, sheet, sidebar,
skeleton, skip-link, slider, spark-line, spinner, stat, status-dot,
steps, switch, table, table-of-contents, tabs, text, text-field,
textarea, toaster, toggle, toggle-group, toolbar, tooltip, tree
```

(`_base` is the shared types/schema. The others are 93 user-facing
primitives. Plus `factory.ts`, `kinds.ts`, `schema.ts` shared infra.)

Blocks layer (compositions of primitives that ship as-is):
`blocks/chat/`, `blocks/dialogs/`, `blocks/governance/`,
`blocks/widgets/`. Use these BEFORE composing primitives directly
when the block matches.

## Block placement law — generic vs domain (LOCKED)

`design/blocks/` holds **generic, domain-agnostic** compositions ONLY —
units that compose primitives and ship as-is to ANY domain. A block MUST
NOT import `$lib/domains/*` or `$lib/devtools/*` state, services, or types.
The generic set is exactly: `blocks/chat/`, `blocks/dialogs/`,
`blocks/governance/`, `blocks/widgets/`.

A "block" that imports domain state/services is **not a block** — it is a
**domain feature mis-filed in the generic pool**. It belongs under
`domains/<domain>/feature/<name>/`, composed FROM generic blocks +
primitives (the RRO colocation pattern below). A block that reaches into a
domain can never be reused by another domain — it is domain-coupled by
definition, and leaving it in `design/blocks/` lies about the boundary and
lets domain logic leak into the design system. The design boundary stays
domain-agnostic or it is not a design system.

**The test the curator runs (any hit = mis-scoped, relocate the whole dir):**

```bash
grep -rl '\$lib/domains' interfaces/desktop/src/lib/design/blocks/<x>/
```

**Current violations — RULED, relocate:**

| Mis-scoped block | Imports | → Destination |
|---|---|---|
| `blocks/latest/` (1 file) | `app/updates` | `domains/app/devpulse/feature/latest/` |
| `blocks/knowledge/` (14) | `app/knowledge` | `domains/app/knowledge/feature/` |
| `blocks/clyffy/` (3) | `app/knowledge` | `domains/clyffy/feature/` |
| `blocks/community/` (1) | `app/community` | `domains/app/community/feature/` |

Empty scaffold dirs (`carousels, cta, dashboards, features, heroes,
navigation`) stay generic or get deleted — they never become a domain home.

## The colocation pattern (RRO reference)

[`interfaces/desktop/src/lib/devtools/clyffy/reasoning/rro/`](../devtools/clyffy/reasoning/rro/)
is the reference layout every feature/devtool follows:

```
rro/
├── feature/
│   ├── RroDevtool.svelte                  ← orchestrator
│   └── panels/                             ← view-level snippets
│       ├── DenseVectorsPanel.svelte
│       ├── SparseVectorsPanel.svelte
│       └── …
├── ui/                                     ← dumb adapters
│   ├── CapabilityCard.svelte
│   ├── VectorCountBadge.svelte
│   └── …
├── util/                                    ← pure functions + types
│   ├── rro.types.ts
│   ├── rro.format.ts
│   └── rro.wire.ts                         ← specta re-exports only
└── index.ts
```

Rules:
- `feature/` ORCHESTRATES — composes `ui/` and primitives, owns the
  state hookup (via `$lib/sys/data-access/<feature>/`), owns the
  layout grid.
- `ui/` ADAPTS — small components that take primitive props and emit
  primitives. Never holds state. Never imports state runes. Pure
  prop-in / markup-out. Re-usable inside the feature only.
- `util/` THINKS — pure functions, types, formatters. No DOM, no
  IO. `wire.ts` re-exports specta bindings so `feature/` and `ui/`
  consume the same types.

State runes live OUTSIDE the feature tree at
`$lib/sys/data-access/<feature>/<feature>.state.svelte.ts`. RRO's
state lives at `$lib/sys/data-access/rro/`. This separation lets a
state rune be reused across multiple features without circular
dependencies.

## What an orchestrator MAY do

```svelte
<!-- feature/RroDevtool.svelte (orchestrator) -->
<script lang="ts">
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/design/components/...";
import CapabilityCard from "../ui/CapabilityCard.svelte";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";

$effect(() => rroState.subscribe("rro-devtool"));
</script>

<Card preset="glass-deep">
  <Heading>RRO</Heading>
  <Tabs value={activeTab}>
    {#each capabilities as cap}
      <TabsTrigger value={cap.id}>
        <CapabilityCard {...cap} />
      </TabsTrigger>
    {/each}
  </Tabs>
</Card>
```

Compose. Pass typed props. Hook state via `$effect`. Done.

## What an orchestrator MAY NOT do

```svelte
<!-- ❌ NEVER -->
<button class="rro-cap-btn">{cap.label}</button>

<style>
  .rro-cap-btn {
    display: inline-flex;
    padding: 0.1875rem 0.5rem;
    font-size: var(--font-size-xs);   /* rule 28 violation */
    border: 1px solid var(--border-subtle);
    /* …another 12 lines hand-rolling Button */
  }
</style>
```

This is the actual anti-pattern in
[`RroDevtool.svelte:198`](../devtools/clyffy/reasoning/rro/feature/RroDevtool.svelte#L198)
that this spec refuses going forward and that Sprint 02 fixes
during the restoration sweep.

The right move is:

```svelte
<!-- ✅ Compose Button + Badge inside ui/CapabilityCard.svelte -->
<Button preset="ghost" size="sm" onclick={() => onSelect(cap.id)}>
  <span class="inline-flex items-center gap-1">
    <StatusDot status={cap.status} />
    {cap.label}
  </span>
</Button>
```

Hand-rolled CSS dies; the ColdLight `<Button>` carries every
preset/intent/state the feature needs.

## Specific refusals

| Authored in `feature/` | Refuse with |
|---|---|
| `<button>` with custom styling | `<Button preset="…">` exists. |
| `<div class="card">` with custom CSS | `<Card preset="…">` exists. |
| Inline `style="color: oklch(...)"` | `renderForge({kind, preset})` + token vars. |
| Custom tooltip via `title=` | `<Tooltip>` primitive. Rule 67. |
| Hand-rolled gauge SVG | `<RadialGauge>` exists; if not enough, author `ui/<Specific>Gauge.svelte` that wraps it. |
| Hand-rolled gradient text effect | `<Text preset="…">` covers gradient presets; add a preset, don't inline. |
| Hand-rolled progress bar | `<Progress>` or `<Meter>` primitives. |
| `<dialog>` element directly | `<Dialog>` primitive (Melt UI exception per ARIA ownership rule). |
| Hardcoded English strings | Cascade Layer 3 — see [`ONBOARDING-CASCADE.md`](./ONBOARDING-CASCADE.md). |
| `text-xs` anywhere | Rule 28. Minimum `text-sm`. |
| Per-component recipe in `recipe.ts` files | Recipes were deleted in Sprint 02 plan; tokens drive every visual now. |

## Adding a new primitive

If `coldlight-curator` audits a feature and finds a real gap — a
visual the existing primitives can't compose — the missing piece
goes in `design/components/<new-primitive>/`, not in
`feature/<some-feature>/ui/`. `ui/` is for FEATURE-SPECIFIC
adapters; reusable primitives belong to ColdLight.

The threshold: if more than ONE feature would benefit, it's a
primitive. If only this feature has the visual, it's a `ui/`
adapter that wraps existing primitives.

## Adapter discipline (`ui/` files)

```svelte
<!-- ui/ModelInstallRow.svelte -->
<script lang="ts">
import Card from "$lib/design/components/card/Card.svelte";
import { Progress } from "$lib/design/components/progress/index.js";
import { StatusDot } from "$lib/design/components/status-dot/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { ModelInstall } from "../util/wizard.types.js";

interface Props {
  install: ModelInstall;
}

let { install }: Props = $props();
</script>

<Card preset="cortex-node" class="px-3 py-2">
  <div class="flex items-center gap-2">
    <StatusDot status={install.status} />
    <Text size="sm" weight="semibold">{install.label}</Text>
    <Progress value={install.progress} max={100} class="ml-auto w-32" />
  </div>
</Card>
```

Notice:
- No `<style>` block.
- No `oklch(...)`.
- No hand-rolled grid; uses `flex items-center gap-2` (utility classes, not custom CSS).
- One typed prop. Pure markup. Predictable.

Adapters compile to nothing more than a primitive composition tree.
If an adapter accumulates more than ~50 lines of markup, suspect a
missing primitive and check with `coldlight-curator`.

## Storybook / verification

Every restored or new component (Sprint 02 onwards) ships with a
verification entry. The current verification harness is
`pnpm check` plus manual visual smoke; a Storybook-style harness is
a parking-lot item (PL-008 in [`PARKING-LOT.md`](./PARKING-LOT.md)).
For now:

- Every `ui/` adapter renders without crashing on default props.
- Every `feature/` orchestrator passes `coldlight-curator` audit.
- Every commit that touches `feature/` includes the curator's
  sign-off in the body.

## Anti-patterns this spec refuses

- "We'll inline CSS just for this one case." Every "one case" became
  the deleted-73 list. Compose or extend; never inline.
- "The primitive doesn't have a `secondary-glass` preset, so I'll
  hand-roll." Add the preset. The token system is centrally edited;
  features don't fork it.
- "I'll author a sub-orchestrator inside `feature/` that has its own
  `ui/`." Three-deep nesting under `feature/` is a sign the feature
  is too large; split it into two feature trees instead.
- "It's a devtool, the discipline is looser." Devtools follow the
  contract identically. RRO's `.rro-cap-btn` is the proof of what
  loose discipline produces.
- "It's a temporary." There are no temporaries in pre-release. Drift
  in pre-release becomes the deletion sweep that follows.
