# ColdLight Forensic Audit — 2026-03-28

> Full pipeline trace: DTCG JSON → SD5 → CSS → Types → App imports.
> Full structural audit: primitives, behaviors, components, utils, attachments.
> No assumptions. Every finding verified by reading disk.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The TRUE Pipeline (Style Dictionary → App)](#the-true-pipeline)
3. [The TRUE Layer Map (What Actually Exists)](#the-true-layer-map)
4. [CRITICAL: Pipeline Issues](#critical-pipeline-issues)
5. [CRITICAL: Structural Issues](#critical-structural-issues)
6. [CRITICAL: Duplicate Definitions (SSOT Violations)](#critical-duplicates)
7. [MAJOR: Dead Code & Stale Artifacts](#major-dead-code)
8. [MAJOR: Misclassified Files](#major-misclassified)
9. [MAJOR: Naming & Terminology Violations](#major-naming)
10. [MINOR: Cleanup Items](#minor-cleanup)
11. [Owner Decisions Required](#owner-decisions)
12. [Recommended Sprint Sequence](#recommended-sprint-sequence)

---

## Executive Summary

The ColdLight pipeline from tokens to rendered UI is **structurally sound in its core path** (SD5 → CSS → components → routes). The component authoring pattern is **consistent and correctly Svelte 5** — all 15 sampled components use `$props()`, `$derived`, `resolveMacro()`, and `use{Kind}()` hooks identically.

**However, the system has three systemic problems:**

1. **The `primitives/` directory is the WRONG THING.** It contains 41 empty structural shells (`<div data-kind="...">`) with zero behavior, zero ARIA, and zero importers. The REAL primitive hooks layer lives in `behaviors/` — which even self-describes as "primitives" in its JSDoc. This is an identity crisis, not a 2-layer architecture.

2. **The SD5 tier classification is incomplete.** Token groups added after the initial config (`glassBlur`, `gradientDuration`, `scrollbarSize`, `opacity`, `meshGradient`, `easing`, `duration`) silently fall through to `components.generated.css` with no `@layer` protection. This is a single config fix.

3. **Four behavior implementations are duplicated** between `attachments/` and `behaviors/_shared/` — scroll-lock, focus-trap, typeahead, roving-focus. The `_shared` versions are superior. The attachment versions are dead but exported in the public barrel.

---

## The TRUE Pipeline

```
tokens/src/*.json (18 DTCG source files)
  │
  ├─ collect-element-seed-defs.mjs   [NO-OP — scaffold only]
  ├─ collect-component-tokens.ts      [NO-OP — scaffold only]
  ├─ collect-preset-styles.mjs        [NO-OP — scaffold only]
  ├─ derive-kind-families.mjs         [ACTIVE → style-macro/generated/kind-families.ts]
  │
  └─ sd.config.mjs + build.mjs → StyleDictionary.buildAllPlatforms()
       │
       ├─ css-primitives  → styles/primitives/{11 files}.css     (@layer tokens.primitives)
       ├─ css-semantic    → styles/semantic/{12 files}.css        (@layer tokens.semantic)
       ├─ css-components  → styles/components/components.generated.css  (:root — NO @layer!)
       ├─ css-svg-presets → svg/presets/svg-presets.generated.css
       ├─ theme-*         → theme/{21 files}.css                  (@theme blocks)
       ├─ types-*         → types/{16 .d.ts files}
       └─ manifest        → generated/token-manifest.json

  build.mjs also writes:
    styles/index.css   [barrel — AUTO-GENERATED]
    theme/index.css    [barrel — AUTO-GENERATED]
    types/index.d.ts   [barrel — AUTO-GENERATED]

  ┌─────────────────────────────────────────────────┐
  │ app.css                                         │
  │   └─ @import "$lib/design/index.css"            │
  │        └─ @import styles/index.css              │
  │        └─ @import theme/index.css               │
  │        └─ @import generated/{typography,focus,   │
  │              scrollbars,keyframes,macro-base}.css│
  │        └─ @import svg/...                       │
  │                                                 │
  │ +layout.svelte                                  │
  │   └─ import "../app.css"                        │
  └─────────────────────────────────────────────────┘
```

### Token Source Files (18)

| File | Token Groups | Tier |
|------|-------------|------|
| `color.json` | color.* | primitive |
| `spacing.json` | space, radius, size, container | primitive |
| `typography.json` | font-size, font-weight, line-height, letter-spacing, font-family | primitive |
| `motion.json` | motion.duration, motion.ease | primitive |
| `elevation.json` | elevation (z-index scale) | primitive |
| `border.json` | border.width, outline.offset, backdrop.grid.* | primitive |
| `surface.json` | glass, matte, surface, **glassBlur** | primitive (glassBlur LEAKS) |
| `shadow.json` | shadow | primitive |
| `bevel.json` | bevel | primitive |
| `glow.json` | glow, glow-spread | primitive |
| `gradient.json` | gradient, **gradientDuration** | primitive (duration LEAKS) |
| `blur.json` | blur | primitive |
| `scrollbar.json` | scrollbar, **scrollbarSize** | semantic (size LEAKS) |
| `signal.json` | signal.* | semantic |
| `interaction.json` | interaction.* | semantic |
| `accent.json` | accent.* | semantic |
| `chat.json` | chat.* | semantic |
| `generated-scales.tokens.json` | **easing, duration, opacity, meshGradient** | ALL LEAK |

---

## The TRUE Layer Map

What CLAUDE.md says (2-layer):
```
primitives/ (behavior hooks) → components/ (the product)
```

What ACTUALLY exists on disk (5+ layers):
```
attachments/     — DOM binding functions (Svelte 5 attachment pattern)
                   4 entries DUPLICATE behaviors/_shared/

behaviors/       — THE REAL PRIMITIVE HOOKS LAYER
  _shared/       — Composable sub-behaviors (scroll-lock, focus-trap, roving-focus, typeahead, live-region)
  _internal/     — Internal utils (uid, dom-query)
  {kind}/        — Per-kind behavior hooks (useAccordion, useDialog, useTabs, etc.)
                   60+ hooks, WAI-ARIA compliant, Svelte 5 runes

primitives/      — DEAD LAYER: 41 empty structural shells
                   35 are identical <div data-kind="..."> templates
                   6 are layout atoms (Stack, Row, Surface, Text, Heading, Separator)
                   2 are visual atoms (Dot, IconSlot)
                   ZERO importers anywhere in codebase

style-macro/     — resolveMacro() pure resolver
                   Returns { kind, dataAttrs, cssVars }
                   Family-split glue CSS via data-cl-* attributes

_base/           — Visual contract (ComponentProps, schema, registry)

components/      — THE PRODUCT (correctly authored)
                   Hook + resolveMacro in one file
                   Consistent Svelte 5 pattern across all sampled

utils/           — Mixed bag: layout helpers + real utilities
                   9 layout "primitives" (box, stack, hstack, flex, grid-layout, container, center, spacer, sticky)
                   + genuine utils (cn, clamp, idGen, ariaAnnounce, visually-hidden, aspect-ratio, divider)

blocks/          — Page-level compositions (chat, governance, widgets)

config/coldlight/ — DEAD: Pre-SD5 legacy config (adapters, meltui refs, old taxonomy)
```

### TRUE Dependency Graph

```
routes/layouts   ─→ components/    ─→ behaviors/{kind}/    ─→ behaviors/_shared/
                 ─→ utils/ (layout)                        ─→ behaviors/_internal/
                 ─→ blocks/         ─→ components/

components/      ─→ behaviors/{kind}/     (behavior hook)
                 ─→ style-macro/resolve   (visual resolver)
                 ─→ _base/types           (prop contract)
                 ─→ utils/cn              (class merging)

behaviors/       ─→ behaviors/_shared/    (composable sub-behaviors)
                 ─→ behaviors/_internal/  (uid, dom helpers)
                 ╳  NO imports from attachments/ (correct)
                 ╳  NO imports from primitives/ (correct — dead layer)

attachments/     ─→ standalone (no deps on behaviors/)
                    BUT 4 entries duplicate _shared/ with worse implementations

primitives/      ─→ utils/cn only
                    ZERO reverse imports from anywhere
```

---

## CRITICAL: Pipeline Issues

### C1. Token Tier Leaks — 5 groups fall through to components.generated.css

**Root cause:** `sd.config.mjs` `tiers.primitive` and `tiers.semantic` lists are incomplete. Any token group not listed silently falls to the `isComponent` catch-all, landing in `components.generated.css` with `:root {}` and NO `@layer`.

| Token Group | Source File | Expected Tier | Actual Location |
|------------|-------------|---------------|-----------------|
| `glassBlur` | surface.json | primitive | components.generated.css:7138-7143 |
| `gradientDuration` | gradient.json | primitive | components.generated.css:66-68 |
| `scrollbarSize` | scrollbar.json | semantic | components.generated.css:69-71 |
| `opacity` | generated-scales.tokens.json | primitive | components.generated.css:40-49 |
| `meshGradient` | generated-scales.tokens.json | primitive | components.generated.css:62-65 |

**Fix:** Add to `tiers.primitive`: `'glassBlur', 'gradientDuration', 'opacity', 'meshGradient'`. Add to `tiers.semantic`: `'scrollbarSize'`. Update corresponding filter arrays in `css-primitives`, `css-semantic`, `theme-*`, `types-*` platforms.

### C2. Duplicate Motion Tokens — easing/duration defined twice with different var names

| Source | Var Pattern | Tier | Location |
|--------|-----------|------|----------|
| `motion.json` | `--motion-duration-*`, `--motion-ease-*` | primitive | styles/primitives/motion.css |
| `generated-scales.tokens.json` | `--easing-*`, `--duration-*` | NONE (leaks) | components.generated.css:50-60 |

Same values, two CSS var names, two locations, two specificity contexts. **`motion.json` is the SSOT. Delete the `easing` and `duration` groups from `generated-scales.tokens.json`.**

### C3. `outputReferences: true` on CSS output contradicts architecture

`sd.config.mjs` line 585: `cssFile()` defaults to `outputReferences: true`. Result: `styles/semantic/surface.css` emits `--surface-base: var(--glass-void)` instead of resolved oklch values. MEMORY.md locks: "No var() chains at runtime." The `@layer` ordering makes it work, but it violates the declared architecture.

### C4. Light Mode Tokens Orphaned

`tokens/src/modes/light.tokens.json` exists with full light mode overrides (surface, text, border, signal). The SD5 source glob is `tokens/src/*.json` — does NOT include subdirectories. This file is never processed. Either delete or wire it.

---

## CRITICAL: Structural Issues

### C5. `primitives/` Is Dead — 0 Importers, 0 Behavior

- 41 directories, ~120 files
- 35 are byte-identical `<div data-kind="..." data-slot="root">{@render children?.()}</div>` templates
- Zero ARIA roles, zero keyboard handling, zero state management
- ZERO imports from anywhere in the codebase
- `behaviors/index.ts` self-describes as "primitives" in its JSDoc

### C6. `behaviors/` IS the Primitive Hooks Layer

- 60+ hooks, all Svelte 5 runes ($state, $derived, $effect)
- WAI-ARIA APG compliant
- Every component imports from `behaviors/{kind}/`
- JSDoc header: "Primitives are behavioral hooks: ARIA, keyboard, state management."
- Named `behaviors/` but is architecturally `primitives/`

### C7. 10+ ARIA Violations in primitives/ Structural Shells

These files render interactive elements without required ARIA:
- `checkbox/Checkbox.svelte` — `<button>` missing `role="checkbox"`, `aria-checked`
- `switch/Switch.svelte` — `<button>` missing `role="switch"`, `aria-checked`
- `toggle/Toggle.svelte` — `<button>` missing `aria-pressed`
- `listbox/Listbox.svelte` — `<div>` missing `role="listbox"`
- `toolbar/Toolbar.svelte` — `<div>` missing `role="toolbar"`
- `menu/Menu.svelte` — `<div>` missing `role="menu"`
- `tree/Tree.svelte` — `<div>` missing `role="tree"`
- `meter/Meter.svelte` — `<div>` missing `role="meter"`
- `grid-list/GridList.svelte` — `<div>` missing `role="grid"`

**These are moot if C5 decision is to delete `primitives/`.**

---

## CRITICAL: Duplicate Definitions (SSOT Violations)

### C8. `SurfaceToken` — 2 definitions, different values

| File | Values |
|------|--------|
| `types/surface.d.ts` (SD5 generated) | `"base" \| "raised" \| "overlay" \| "frosted" \| "inset" \| "subtle" \| "chrome" \| "primary"` |
| `components/types.ts` (manual) | `"glass-void" \| "glass-smoke" \| "glass-deep" \| "glass-frost" \| "glass-teal" \| "glass-purple" \| "matte-dark" \| "matte-medium" \| "matte-light"` |

Different concepts, same name. Active landmine.

### C9. `SizeToken` — 2 definitions, incompatible values

| File | Values |
|------|--------|
| `types/spacing.d.ts` (SD5 generated) | 17 values including container-xs through container-2xl |
| `components/types.ts` (manual) | `"sm" \| "md" \| "lg"` |

Different concepts (design token scale vs component size variant), same name.

### C10. `RadiusToken` — 2 definitions, same values (for now)

| File | Values |
|------|--------|
| `types/spacing.d.ts` (SD5 generated) | Runtime const array |
| `components/types.ts` (manual) | `"none" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "full"` |

Will silently drift when tokens change.

### C11. `BadgeVariant` — 2 definitions, incompatible

| File | Values |
|------|--------|
| `behaviors/badge/badge.types.ts` | 25 color values (gray, red, orange, ...) |
| `components/badge/badge.types.ts` | 6 semantic values (neutral, accent, ...) |

Component passes 6-value type into behavior expecting 25-value type.

### C12. Four Behavior Implementations Duplicated in Attachments

| Behavior | `attachments/` (DEAD) | `behaviors/_shared/` (ACTIVE) | Difference |
|----------|----------------------|-------------------------------|------------|
| scroll-lock | `layout/scroll-lock.ts` | `_shared/scroll-lock/` | No ref-counting, no iOS workaround |
| focus-trap | `focus/trap.ts` | `_shared/focus-trap/` | No autofocus, no visibility check |
| typeahead | `keyboard/typeahead.ts` | `_shared/typeahead/` | Starts from index 0 (BUG) |
| roving-focus | `focus/roving.ts` | `_shared/roving-focus/` | No RTL support |

### C13. ID Generation — 2 parallel counters, can collide

| Location | Export | Used By |
|----------|--------|---------|
| `utils/idGen.ts` | `idGen()`, `idGenPair()` | `blocks/factory.ts` only |
| `behaviors/_internal/utils/uid.ts` | `uid()`, `createIds()` | Every behavior |

Two monotonic counters with no shared state = potential ID collisions.

### C14. ARIA Announcer — 2 implementations

| Location | Implementation |
|----------|---------------|
| `utils/ariaAnnounce.ts` | Single live region, reuses one element |
| `behaviors/_shared/live-region/` | Separate polite+assertive regions, rAF queuing |

The `_shared` version is correct. The utils version is dead.

---

## MAJOR: Dead Code & Stale Artifacts

### M1. `config/coldlight/` — Entire directory is dead pre-SD5 config
References melt-ui adapters, old taxonomy, deleted recipe system. Nothing in the live build reads it.

### M2. `generated/coldlight.manifest.json` — Dead artifact from 2026-03-18
Old manifest format (categories/tiers/classes). Current manifest is `token-manifest.json`.

### M3. `.generated/` directory — Ghost of adapter-cloak architecture
Contains `coldlight.manifest.json` (2026-03-02) and `imports.gen.ts` (empty meltui map).

### M4. `components/README.md` — Documents deleted architecture
References Melt UI, variant payloads (`v-s1z2l3t1m2`), taxonomy/, semantics/. None exists.

### M5. `SPRINT-PRIMITIVES.md` — Describes state that never existed
Sprint doc for converting MeltUI re-exports that were already replaced.

### M6. Component `tokens.ts` files — Exported but consumed nowhere
Every component with `tokens.ts` exports DTCG const objects. No build script imports them.

### M7. 4 attachment implementations — Dead, worse than _shared counterparts
`scrollLock`, `focusTrap`, `typeahead`, `rovingFocus` in public barrel but nothing calls them.

### M8. `blocks/dialogs/index.ts` — Empty stub (`export {}`)

### M9. `primitives/separator/separator.props.ts` — Unused, drifted from .svelte interface

---

## MAJOR: Misclassified Files

### M10. Layout Atoms in `primitives/` Should Be in `utils/` or `components/`

| File | What It Is | Where It Should Be |
|------|-----------|-------------------|
| `primitives/stack/Stack.svelte` | Flex column layout | `utils/` (already has `utils/stack/`) |
| `primitives/row/Row.svelte` | Flex row layout | `utils/` (already has `utils/hstack/`) |
| `primitives/surface/Surface.svelte` | Polymorphic container | `components/_base/` or `components/` |
| `primitives/text/Text.svelte` | Polymorphic text element | `components/` |
| `primitives/heading/Heading.svelte` | Level-based h1-h6 | `components/` |
| `primitives/separator/Separator.svelte` | Styled HR | `components/` |
| `primitives/dot/Dot.svelte` | Visual indicator atom | `components/` |
| `primitives/icon-slot/IconSlot.svelte` | Layout container | `utils/` |

### M11. Layout Utils in `utils/` Are Actually Layout Primitives

`utils/box`, `utils/stack`, `utils/hstack`, `utils/flex`, `utils/grid-layout`, `utils/container`, `utils/center`, `utils/spacer`, `utils/sticky` — these return Tailwind class strings for layout concepts. They are layout primitives, not utilities.

`utils/stack` and `primitives/stack/Stack.svelte` DUPLICATE the same ALIGN/JUSTIFY lookup tables independently.

### M12. `utils/divider/use-divider.ts` Returns ARIA Attrs — Behavior Territory

Returns `{ role: "separator", "aria-orientation": ... }`. A utility has no business touching ARIA. Belongs in `behaviors/separator/`.

### M13. `utils/visually-hidden` Duplicates `attachments/layout/visually-hidden.ts`

Utils version: Tailwind classes (correct). Attachments version: inline `style.setProperty` (wrong).

---

## MAJOR: Naming & Terminology Violations

### M14. `recipe` Used in `blocks/schema.ts` and `blocks/factory.ts`

MEMORY.md locks: **NEVER USE: recipe**. Replacement term: `Style Preset`. Field should be `preset: string`.

### M15. Schema Field `variant` vs Component Prop `preset`

`button/schema.ts` uses `variant`. `Button.svelte` uses `preset`. MEMORY.md locks: **preset prop (NOT intent)**. Schemas should use `preset`.

### M16. `types/*.d.ts` Files Contain Runtime `export const` Values

`.d.ts` files do not emit JavaScript. Files like `spacing.d.ts`, `surface.d.ts` contain `export const SpaceTokens = [...] as const` — runtime values in declaration files. Should be `.ts`.

---

## MINOR: Cleanup Items

### m1. `design/index.css` comment numbering skips "4"
### m2. `TokenDebugOverlay.svelte` uses `onMount` (Svelte 4) instead of `$effect`
### m3. `behaviors/index.ts` is a 96-line unused barrel (components import directly)
### m4. Attachment sub-barrels add one hop with no filtering

---

## Owner Decisions Required

### D1. What happens to `primitives/`?

**Option A: Delete entirely.**
- The 35 shell-wrappers are dead weight (zero importers, zero behavior)
- Move the 8 layout/visual atoms to proper homes (utils, components, _base)
- `behaviors/` continues as the primitive hooks layer under its current name

**Option B: Rename `behaviors/` → `primitives/`, delete current `primitives/`.**
- Aligns directory name to ADR-001 terminology
- More disruptive (every component import path changes)
- The 8 layout atoms still need homes elsewhere

**Option C: Rename `behaviors/` → `primitives/`, rename current `primitives/` → `structural/`.**
- Keeps the structural shells alive under an honest name
- But they still have zero importers and questionable value

### D2. What happens to duplicate implementations?

The 4 duplicated behaviors (scroll-lock, focus-trap, typeahead, roving-focus):
- **Delete from `attachments/`** — the `_shared` versions are strictly superior
- Update `attachments/index.ts` barrel

The 2 duplicate utils (idGen, ariaAnnounce):
- **Delete from `utils/`** — behaviors/_internal and _shared versions are better
- Update `blocks/factory.ts` to use `createIds` from behaviors

### D3. What happens to `components/types.ts` manual type definitions?

`SurfaceToken`, `SizeToken`, `RadiusToken` collide with SD5-generated types.
- **Rename the component-layer types** to avoid collision (e.g., `ComponentSize`, `ComponentSurface`)
- Or **delete them** and use only the SD5-generated types with adapter unions

### D4. `outputReferences: true` or `false`?

Currently `true` → semantic CSS has `var()` chains. Architecture spec says `false`.
- If you want pure resolved values everywhere: set `false`
- If you want semantic indirection (surface-base = glass-void): keep `true` but update MEMORY.md

### D5. Light mode support?

`tokens/src/modes/light.tokens.json` exists but is never built.
- Wire it into SD5 with `[data-theme="light"]` selector
- Or delete it if dark-only is intentional

---

## Recommended Sprint Sequence

### Sprint A: Pipeline Fix (1 session)
1. Fix `tiers` in `sd.config.mjs` (C1)
2. Delete duplicate easing/duration from generated-scales.tokens.json (C2)
3. Decide and apply `outputReferences` setting (C3/D4)
4. Rebuild tokens (`pnpm tokens:build`)
5. Rename `types/*.d.ts` → `types/*.ts` (M16)
6. Verify all tokens land in correct @layer

### Sprint B: Dead Code Purge (1 session)
1. Delete `config/coldlight/` directory (M1)
2. Delete `generated/coldlight.manifest.json` (M2)
3. Delete `.generated/` directory (M3)
4. Delete `components/README.md` (M4)
5. Delete `SPRINT-PRIMITIVES.md` (M5)
6. Delete `blocks/dialogs/index.ts` stub (M8)
7. Delete `primitives/separator/separator.props.ts` (M9)

### Sprint C: Structural Cleanup (owner decision D1 required first)
1. Execute D1 decision (primitives/ disposition)
2. Delete 4 duplicate attachments (C12, M7)
3. Delete `utils/idGen.ts`, wire `blocks/factory.ts` to `behaviors/_internal/uid` (C13)
4. Delete `utils/ariaAnnounce.ts` (C14)
5. Delete `attachments/layout/visually-hidden.ts` (M13)
6. Move layout atoms to proper homes (M10)
7. Resolve `utils/divider` ARIA leak (M12)

### Sprint D: Type & Terminology Alignment (owner decision D3 required first)
1. Execute D3 decision (rename or delete colliding types)
2. Rename `recipe` → `preset` in blocks/ (M14)
3. Rename schema `variant` → `preset` (M15)
4. Resolve BadgeVariant divergence (C11)

### Sprint E: Component Planning
1. Audit which behaviors have no component counterpart and are needed
2. Plan component authoring for: menu, meter, number-field, search-field, tag-group, grid-list, listbox, breadcrumbs
3. Wire component `tokens.ts` to build pipeline or delete them (M6)
4. Add `preset` prop passthrough to Dialog/Tooltip root components

---

## Stats

| Category | Count |
|----------|-------|
| Source JSON files | 18 |
| Generated CSS files | 46 |
| Generated type files | 17 |
| Critical issues | 14 |
| Major issues | 16 |
| Minor issues | 4 |
| Owner decisions required | 5 |
| Recommended sprints | 5 |
