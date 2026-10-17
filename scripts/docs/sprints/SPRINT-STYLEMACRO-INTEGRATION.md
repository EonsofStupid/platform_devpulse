# SPRINT: StyleMacro Integration — ADR-001 Enforcement

**Status**: DRAFT — OWNER APPROVAL REQUIRED
**Date**: 2026-03-21
**Prereq**: ADR-001 ACCEPTED, StyleMacro exists on disk, SD5 pipeline working

---

## Goal

Wire the StyleMacro provider pattern end-to-end per ADR-001:
- Components are DUMB (structure + ARIA + class)
- Recipes are DTCG composite tokens in JSON — SD5 processes them
- UI wrappers compose StyleMacro + component — what users import
- Tokens render in the browser

---

## Architecture (from ADR-001 + DTCG spec)

### 11 Axes = 11 DTCG Types (every axis maps to a real DTCG `$type`)

| # | Axis | DTCG `$type` | CSS Property | Composite? |
|---|------|-------------|-------------|------------|
| 1 | `backgroundColor` | `color` | `background-color` | No |
| 2 | `backgroundBlur` | `dimension` | `backdrop-filter: blur()` | No |
| 3 | `shadow` | `shadow` | `box-shadow` (depth+bevel+glow as layers) | Yes — color, offsetX/Y, blur, spread, inset |
| 4 | `border` | `border` | `border` | Yes — color, width, style |
| 5 | `animation` | `duration` | `animation` | No |
| 6 | `transition` | `transition` | `transition` | Yes — duration, delay, timingFunction |
| 7 | `typography` | `typography` | `font-*`, `letter-spacing`, `line-height` | Yes — fontFamily, fontSize, fontWeight, letterSpacing, lineHeight |
| 8 | `gradient` | `gradient` | `background-image: linear-gradient()` | Yes — array of color stops |
| 9 | `color` | `color` | `color` (foreground/text/icon) | No |
| 10 | `borderRadius` | `dimension` | `border-radius` | No |
| 11 | `opacity` | `number` | `opacity` | No |

### Recipe = DTCG Token Group (one token per axis, each with its real DTCG type)

```json
{
  "style": {
    "button-primary": {
      "backgroundColor": { "$type": "color", "$value": "{color.teal-600}" },
      "backgroundBlur": { "$type": "dimension", "$value": "{blur.none}" },
      "shadow": { "$type": "shadow", "$value": ["{shadow.z1}"] },
      "border": { "$type": "border", "$value": { "color": "{color.teal-500}", "width": "{border-width.thin}", "style": "solid" } },
      "animation": { "$type": "duration", "$value": "{motion.duration.none}" },
      "transition": { "$type": "transition", "$value": { "duration": "{motion.duration.fast}", "delay": "{motion.delay.none}", "timingFunction": "{motion.ease.out}" } },
      "typography": { "$type": "typography", "$value": { "fontFamily": "{font.sans}", "fontSize": "{text-size.sm}", "fontWeight": 500, "letterSpacing": "{tracking.normal}", "lineHeight": 1.5 } },
      "gradient": { "$type": "gradient", "$value": [{ "color": "{color.teal-600}", "position": 0 }, { "color": "{color.teal-500}", "position": 1 }] },
      "color": { "$type": "color", "$value": "{color.white}" },
      "borderRadius": { "$type": "dimension", "$value": "{radius.lg}" },
      "opacity": { "$type": "number", "$value": 1 }
    }
  }
}
```

Each axis is its own token with its REAL DTCG `$type`. The group name (`button-primary`) is the style ID.
SD5 knows how to process every one because they're spec-compliant.
No invented types. Pure DTCG. 11 axes cover every visual concern a UI compiler needs.

### 3-Layer Model

```
Component (components/{kind}/)     → structure + ARIA + class prop. DUMB.
Recipe (DTCG JSON → SD5 → CSS)    → 6-axis visual definitions. NO JavaScript.
UI (ui/{kind}/)                    → StyleMacro + component. What users import.
```

### Flow

```
DTCG JSON tokens (authored)
  → SD5 build (pnpm ds:tokens:build)
    → CSS custom properties (--style-button-primary-bg, etc.)
      → StyleMacro resolves (kind defaults → local overrides)
        → Sets --cl-* vars on wrapper div
          → Glue CSS maps --cl-* → CSS properties on [data-kind]
            → Browser paints
              → Component inside renders structure + ARIA
```

---

## SSOT Map

| Concern | SSOT Location | Status |
|---------|--------------|--------|
| Visual axes | `style/macro-mappings.ts` | EXISTS |
| Global theme state | `style/base-state.svelte.ts` | EXISTS |
| StyleMacro component | `style/StyleMacro.svelte` | EXISTS — var() construction needs fix |
| DTCG token source | `tokens/src/*.json` (TBD — style composite tokens) | DOES NOT EXIST |
| SD5 config | `scripts/build/styledictionary/sd.config.ts` | EXISTS — needs composite platform |
| Component tokens (generated) | `styles/components/component.css` | EXISTS |
| Glue CSS | `generated/macro-base.css` | DOES NOT EXIST |
| ui/ wrappers | `design/ui/` | DOES NOT EXIST |

### To Delete (ADR-001)

| Asset | Location |
|-------|----------|
| `useColdLight()` | `components/_base/use-coldlight.svelte.ts` |
| `recipes/` JS system | `design/recipes/` (entire folder) |
| `registry/resolve-visual.ts` | old resolution pipeline |
| `registry/presets.ts` | old preset system |
| `registry/token-categories.ts` | old 8-axis encoding |
| `registry/encoding.ts` | old encoding |
| `registry/kind-definitions.ts` | old CDOs |

---

## Phases

### Phase 1: Foundation (StyleMacro + Glue CSS + One Token)

**1.1** Author ONE DTCG composite style token in JSON (button-primary)
- [ ] Create `tokens/src/style.json` with `style.button-primary` composite token
- [ ] Sub-values reference existing primitive tokens (`{color.teal-600}`, `{shadow.z1}`, etc.)
- [ ] Follows DTCG spec exactly — `$type`, `$value`, references via `{path}`

**1.2** Add SD5 platform for style composite tokens
- [ ] Read `sd.config.ts` to understand existing platform structure
- [ ] Add platform that outputs `--style-{name}-{axis}` CSS custom properties
- [ ] Run `pnpm ds:tokens:build` — verify CSS output

### STOP — Owner Review
Verify: token JSON is correct DTCG. SD5 output matches expected CSS vars. Naming convention approved.

**1.3** Fix StyleMacro var() construction
- [ ] Current: `var(--${category}-${activeId}-${value})` — constructs phantom var names
- [ ] Fix to: reference actual SD5 output var names
- [ ] Verify resolved CSS string matches real custom properties

**1.4** Create glue CSS (`generated/macro-base.css`)
- [ ] Maps `--cl-*` vars to CSS properties on `[data-kind]` elements
- [ ] Wire into `index.css` import chain
- [ ] 6 visual axes + text color + accent + border-radius

**1.5** Compile check
- [ ] `pnpm svelte-check` — 0 new errors
- [ ] `pnpm build` — passes

### Phase 2: Gold Standard Component (Button)

**2.1** Strip Button to DUMB
- [ ] Remove all visual classes (INTENT_CLASSES, color refs)
- [ ] Keep structural recipe (size → height/padding/font)
- [ ] Accept `class` prop, render structure + ARIA via primitive hook
- [ ] Emit `data-kind="button"` `data-slot="root"` (already from anatomy)

**2.2** Author button style tokens
- [ ] `style.button-primary`, `style.button-secondary`, `style.button-ghost`, `style.button-danger`
- [ ] Each is a DTCG composite with 6-axis values
- [ ] SD5 processes → CSS custom properties

**2.3** Create UI wrapper (`ui/button/Button.svelte`)
- [ ] Imports StyleMacro + component
- [ ] `intent` prop maps to style token name
- [ ] Props: size, intent, disabled, loading, pressed, expanded, type, children, class
- [ ] `<StyleMacro kind="button" style={styleForIntent}>` wraps `<ButtonComponent>`

**2.4** Update barrel exports
- [ ] `ui/button/index.ts` exports the UI wrapper
- [ ] Consumers import from `ui/button/` not `components/button/`

**2.5** Verify renders
- [ ] `pnpm dev` — Button renders with token-driven colors
- [ ] Intent switching works (primary/secondary/ghost/danger)
- [ ] `pnpm svelte-check` — 0 new errors

### STOP — Owner Review
Verify: Button renders. Tokens drive visual. Component is dumb. Pattern is correct.

### Phase 3: Batch Migration (remaining components)

**3.1** Author DTCG style tokens for each component kind
- [ ] badge, avatar, text-field, heading, text, progress, card, etc.
- [ ] Each gets default + variant composite tokens

**3.2** Strip each component to DUMB
- [ ] Remove visual classes, keep structural recipe
- [ ] One component at a time, compile-check after each

**3.3** Create UI wrapper for each component
- [ ] Same pattern as Button UI wrapper

**3.4** Update all consumers
- [ ] Routes, layouts, stories → import from `ui/` not `components/`

### Phase 4: Cleanup

**4.1** Delete old systems
- [ ] `recipes/` folder
- [ ] `registry/` folder (resolve-visual, presets, token-categories, encoding, kind-definitions)
- [ ] `components/_base/use-coldlight.svelte.ts`
- [ ] Old `style/components/tokens.css` (competing duplicate)

**4.2** Update docs
- [ ] MASTER-PLAN.md — align to ADR-001 reality
- [ ] COLDLIGHT.md — remove references to deleted concepts
- [ ] .claude/CLAUDE.md — same

**4.3** Final verification
- [ ] `pnpm ds:tokens:build` — clean
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `pnpm build` — passes
- [ ] `pnpm dev` — all components render with token-driven styling

---

## Anti-Pattern Watchlist

- DO NOT hardcode colors in components — that's what tokens are for
- DO NOT create JS recipe functions with visual classes — recipes are DTCG JSON
- DO NOT invent CSS var names — only reference what SD5 generates
- DO NOT skip compile-check between component edits
- DO NOT batch-delete before replacements exist
- DO NOT add backwards-compat shims — pre-release mode

---

## Decision Log

| # | Decision | Owner Approved |
|---|----------|---------------|
| 1 | 6 axes = 6 DTCG types | Pending |
| 2 | Style composite tokens in `tokens/src/style.json` | Pending |
| 3 | SD5 output naming: `--style-{name}-{axis}` | Pending |
| 4 | Button as gold standard first | Pending |
| 5 | ui/ folder for user-facing imports | Pending |
