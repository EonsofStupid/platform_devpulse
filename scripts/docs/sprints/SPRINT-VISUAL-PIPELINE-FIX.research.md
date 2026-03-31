# Research: ColdLight Visual Pipeline — Full Audit

**Date**: 2026-03-25
**Sprint**: SPRINT-VISUAL-PIPELINE-FIX
**Status**: COMPLETE

## SSOT Map

| Concern | SSOT Location | Status |
|---------|--------------|--------|
| DTCG token source | `scripts/build/styledictionary/tokens/src/*.json` | 15 files, 3815 tokens |
| SD5 config | `scripts/build/styledictionary/sd.config.mjs` | Authoritative build config |
| SD5 build orchestrator | `scripts/build/styledictionary/build.mjs` | Barrel file generation |
| Primitive CSS output | `styles/primitives/*.css` | 11 files, 517 vars |
| Semantic CSS output | `styles/semantic/*.css` | 11 files, 167 vars |
| Component CSS output | `styles/components/components.generated.css` | 3259 vars |
| Theme CSS output | `theme/*.css` | 22 files |
| Alias bridge | `generated/aliases.css` | 25 vars — ACTIVELY BREAKING glows |
| StyleMacro | `styles/StyleMacro.svelte` | Visual resolver |
| Macro mappings | `styles/macro-mappings.ts` | 11-axis prop→CSS var dictionary |
| Glue CSS | `generated/macro-base.css` | [data-kind] consumes --cl-* |
| v-* variants | `generated/variants.css` | 63 utilities — COMPETING SYSTEM |

## Root Causes of Empty Visuals

### ROOT CAUSE 1: Intent→Preset Name Mismatch

Components use semantic intent names (`primary`, `ghost`, `secondary`, `danger`).
DTCG presets use visual names (`default`, `glass`, `flat`, `matte`, `stark`).

- `Button` default intent = `"primary"` → styleId = `"button-primary"` → looks for `--style-button-primary-*` → DOESN'T EXIST
- DTCG has: `button-default`, `button-glass`, `button-flat`, `button-matte`, `button-stark`
- No resolver exists to map intent→visual preset

**85 kinds × 4 missing intents = 340 missing preset lookups**

### ROOT CAUSE 2: aliases.css Clobbers SD5 Glow Output

SD5 emits correct glow shorthands in `styles/primitives/glow.css`:
```css
--glow-teal: 0 0 1.875rem 0.75rem oklch(0.586 0.0624 164.59 / 0.702);
```

aliases.css OVERWRITES them with broken sub-property references:
```css
--glow-teal: var(--glow-teal-offset-x) var(--glow-teal-offset-y) ...;
```

Sub-properties (`--glow-teal-offset-x`, etc.) DON'T EXIST in current SD5 output.
Result: `--glow-teal` resolves to empty string. All glow effects broken.

### ROOT CAUSE 3: StyleMacro Adoption = 8%

Only 1 of 12 blocks uses StyleMacro (Tabs root). Everything else uses:
- Hardcoded Tailwind classes
- Inline `style=""` with var() refs
- v-* variant classes (competing system)

### ROOT CAUSE 4: v-* System Is Dead But Still Referenced

- `variants.css` defines 63 `@utility` rules for 8-axis encoding
- 26+ lines across 7 files still use `v-*` classes in markup
- `v-r*` (radius) classes are used but NEVER DEFINED
- v-* is NOT DTCG-aligned, NOT StyleMacro-integrated
- ADR-001 says StyleMacro is the SOLE visual authority

### ROOT CAUSE 5: Style Presets Missing Properties

DTCG presets only define 8 of 15 possible properties per preset:
- Defined: background-color, border-radius, box-shadow, color, border-color, border-width, backdrop-filter, opacity
- Missing: animation, transition-duration, transition-timing-function, gradient, font-family, font-size, font-weight, letter-spacing, line-height

Result: `--style-button-default-animation` etc. resolve to empty → `--cl-animation` stays empty

## What Components Actually Need (from debug overlay)

### By component on the dashboard page:

| Component | Intent Used | Preset That Would Match | StyleMacro? |
|-----------|-------------|------------------------|-------------|
| Widget (×6) | class="v-s3 v-d2..." | widget-glass | NO — uses v-* |
| RadialGauge (×3) | accent="teal/purple/cyber" | N/A — SVG, no preset | NO — inline |
| SparkLine (×3) | accent="teal/purple/cyber" | N/A — SVG, no preset | NO — inline |
| Text (×20+) | color="muted" | text-default | YES (via StyleMacro) |
| Button (retry) | intent implied | button-default | YES |

### By component on the chat page:

| Component | What It Uses | What It Should Use |
|-----------|-------------|-------------------|
| Card (thread sidebar) | variant="default" | card-default via StyleMacro |
| ThreadList | hardcoded var() refs | sidebar-default via StyleMacro |
| ChatPanel | delegates to Card | card-default via StyleMacro |
| Text | class="text-[var(--text-muted)]" | text-default via StyleMacro |

## Visual Reference Analysis

### DASHBOARD-REFERENCE-01.png shows:
- Deep void background with teal circuit grid
- Glass panels with visible backdrop-blur, teal-tinted borders
- Radial gauges with teal/purple/cyber glow halos
- Sparkline charts with glowing strokes and area fills
- Card bevels (subtle inset shadow at top edge)
- Tab bar with active state glow
- Status dots with colored glow halo

### CHAT-REFERENCE-01/02.png shows:
- Thread sidebar with active state glow border (teal left edge)
- Main chat panel with glass depth
- Message bubbles with differentiated user/AI styling
- Context visualization panel (right side, graph nodes)
- Purple-shifted neural backdrop (different grid from dashboard)
- Chrome-style tab bar for switching DEVELOPMENT/CONTEXT MEMORY

### What's missing from current render:
- ALL glass effects (backdrop-blur not painting because --cl-blur is empty)
- ALL glow effects (--glow-teal clobbered by aliases.css)
- ALL bevel effects (--bevel-* not composed into shorthand)
- ALL surface tinting (-bg is empty because preset lookup fails)
- ALL border treatments (--cl-border is empty)
- Tab active state styling
- Circuit grid background IS working (app.css uses direct var refs, not StyleMacro)

## Anti-Pattern Risks

1. **Duplicating presets for intents** — WRONG. Build a resolver, not more tokens.
2. **Adding more aliases** — WRONG. Fix the SD5 output or delete the broken alias.
3. **Keeping v-* alongside StyleMacro** — WRONG. Pick one. StyleMacro won.
4. **Hardcoding visual values in components** — WRONG. All values from presets via StyleMacro.

## Recommendations

### Phase 1: Delete the broken, stop the bleeding
1. Remove glow composite lines from aliases.css (SD5 already outputs shorthands)
2. Delete variants.css (v-* system is dead, competing with StyleMacro)
3. Remove all v-* class usage from .svelte files (7 files, 26+ lines)

### Phase 2: Build the intent resolver (ONE file, ONE map)
1. Add intent resolver to StyleMacro or macro-mappings.ts
2. Map: primary→glass, secondary→matte, ghost→flat, danger→stark, default→default
3. StyleMacro resolves intent before looking up --style-* vars

### Phase 3: Wire StyleMacro into every block/widget
1. Widget → StyleMacro with kind="widget"
2. ChatPanel → StyleMacro with kind="chat-panel" (or delegates to Card)
3. ThreadList → StyleMacro with kind="sidebar"
4. RadialGauge → keep SVG inline but consume accent tokens properly
5. SparkLine → keep SVG inline but consume accent tokens properly
6. GovernanceControls → delegates to Card via StyleMacro

### Phase 4: Complete the presets
1. Add missing properties to DTCG presets (animation, transition, font-*)
2. Or: accept that missing = inherit (which is correct for most cases)
3. Run SD5 build to regenerate

## Files Referenced
- `styles/StyleMacro.svelte`: Visual resolver component
- `styles/macro-mappings.ts`: 11-axis mapping dictionary
- `generated/macro-base.css`: Glue CSS consuming --cl-* vars
- `generated/aliases.css`: Bridge tokens — BROKEN glow overrides
- `generated/variants.css`: Dead v-* encoding system
- `styles/primitives/glow.css`: Correct SD5 glow output (shorthands)
- `styles/components/components.generated.css`: 3259 preset vars
- `routes/(app)/devpulse/+page.svelte`: Dashboard using v-* classes
- `routes/(chat)/chat/+page.svelte`: Chat using hardcoded var refs
- `blocks/widgets/Widget.svelte`: Widget block (no StyleMacro)
- `blocks/chat/ThreadList.svelte`: Thread sidebar (hardcoded styling)
- `components/tabs/Tabs.svelte`: ONLY block using StyleMacro correctly
