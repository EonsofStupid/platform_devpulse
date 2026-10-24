# Research: ColdLight Primitives Foundation

**Date**: 2026-02-20
**Sprint**: SPRINT-PRIMITIVES-FOUNDATION
**Status**: COMPLETE

---

## Question/Goal

Three things are broken and blocking all UI output:

1. `ds:tokens:build` runs the OLD hand-rolled script, not SD5
2. No `.svelte` primitive exists anywhere in the codebase
3. MASTER-PLAN does not state that ColdLight is a **portable, multi-project design system**

Until these three things are fixed, there is no foundation to build on.

---

## Real State Audit (Honest)

| Claim | Reality |
|-------|---------|
| SD5 drives token pipeline | ❌ `ds:tokens:build` runs `ds-tokens-build.ts` (hand-rolled) |
| SD5 script exists | ✅ `ds-tokens-sd5.ts` exists but NOT wired as default |
| Token watch on dev | ❌ `ds:tokens:watch` runs OLD script, no Vite integration |
| Primitives exist | ❌ Zero `.svelte` files in taxonomy |
| Button primitive exists | ❌ `taxonomy/button/` created in wrong location |
| MASTER-PLAN accurate | ❌ Says "catalog/" (codebase uses "taxonomy/"), omits portable/multi-project purpose |
| ColdLight is portable | ❌ Never stated in any documentation |

---

## What Actually Works

- `ds-tokens-sd5.ts` — SD5 pipeline, reads coldlightConfig, generates tokens.css + types.ts + DTCG JSON
- `taxonomy/kinds/primitives/contract.ts` — PrimitiveContractSchema (Zod) — solid
- `taxonomy/kinds/component/contract.ts` — ComponentContractSchema (Zod) — solid
- `config/coldlight/vocabularies.cfg.ts` — all ARIA roles, attributes, keyboard keys, state tokens — solid
- `tokens/tokens.ts` + `tokens/semantic.ts` + `tokens/components.ts` — token SSOT — solid

---

## ColdLight Purpose (Locked)

ColdLight is a **portable, UI-driven design system** owned by the architect.

- Deployed across **multiple projects** (devpulse platform + customer projects)
- **Config-first**: `coldlight.config.ts` is project-specific configuration
- **UI-driven**: The VPB reads config + manifest to present a UI for configuration
- **Not open source** — owned by one architect, distributed to their own projects

This is why primitives exist as separate from styled components:
- Different projects style the same primitive differently
- The primitive = HTML structure + ARIA + data attributes (no CSS)
- The component = primitive + project-specific token classes

---

## Primitive Definition (Locked, Final)

A ColdLight primitive:
- Renders ONE HTML element (or tightly coupled group)
- Owns ARIA (`role`, `aria-*` attributes) — ColdLight is the authority
- Emits `data-kind`, `data-slot`, `data-state` data attributes
- Has ZERO CSS — `class` prop is empty string by default
- Accepts `class` prop — the component/recipe layer fills it
- Uses Svelte 5 runes (`$props()`, `$derived`)
- Lives at `taxonomy/kinds/{name}/{Name}.svelte`

---

## Folder Structure (Locked)

```
taxonomy/
  kinds/
    {name}/                    ← ONE folder per primitive
      contract.ts              ← PrimitiveContract data (satisfies PrimitiveContractSchema)
      {Name}.svelte            ← ColdLight primitive (unstyled, ARIA-owned)
      types.ts                 ← Props, slots, states
      index.ts                 ← Barrel export
    button/                    ← Example
    badge/
    input/
    panel/
    ...
  kinds/primitives/            ← MASTER SCHEMAS ONLY (PrimitiveContractSchema)
  kinds/component/             ← MASTER SCHEMAS ONLY (ComponentContractSchema)
  .generated/                  ← coldlight.manifest.json (scanner output)
  registry.ts                  ← Runtime manifest reader
  scanner.ts                   ← Build-time parity checker
```

---

## Complete Primitive List (Derived from Reference Images)

### Tier 1 — Required for dashboard + chat UI

**Interactive**
- `button` — click action, toggle, submit
- `input` — text input field
- `textarea` — multi-line text
- `checkbox` — boolean selection
- `radio` — single selection from group
- `toggle` — binary on/off
- `switch` — binary on/off (visual variant of toggle)
- `slider` — range value selection

**Navigation**
- `tabs` — panel switcher
- `accordion` — collapsible sections
- `breadcrumb` — navigation trail

**Overlay**
- `dialog` — modal (focus trap)
- `popover` — anchored overlay (no focus trap)
- `tooltip` — hover info (no focus trap)
- `dropdown-menu` — anchored menu list
- `sheet` — side panel (focus trap)

**Display**
- `badge` — status/count indicator
- `avatar` — user/entity image
- `progress` — linear/circular progress
- `spinner` — loading indicator
- `separator` — visual divider
- `skeleton` — loading placeholder
- `label` — form field label

**Layout**
- `panel` — glass/matte surface container
- `scroll-area` — custom scrollbar container
- `card` — elevated surface with slots

**Feedback**
- `toast` — notification (svelte-sonner wraps this)
- `alert` — inline status message

### Tier 2 — Required for full system

- `select` — dropdown value picker
- `nav-menu` — navigation menu (horizontal/vertical)
- `toolbar` — grouped action bar
- `toggle-group` — mutually exclusive or multi-select toggles
- `kbd` — keyboard shortcut display
- `visually-hidden` — screen-reader-only text

---

## Files Referenced

- `scripts/dev/design/ds-tokens-build.ts` — OLD hand-rolled script (to be retired)
- `scripts/dev/design/ds-tokens-sd5.ts` — SD5 pipeline (to become default)
- `package.json` — scripts section (ds:tokens:build points to wrong file)
- `taxonomy/kinds/primitives/contract.ts` — PrimitiveContractSchema (solid)
- `taxonomy/kinds/component/contract.ts` — ComponentContractSchema (solid)
- `config/coldlight/vocabularies.cfg.ts` — all vocabulary constants (solid)
- `taxonomy/button/` — created in wrong location (needs move to taxonomy/kinds/button/)
- `MASTER-PLAN.md` — needs reauthor: portable system, correct folder names, accurate phases
