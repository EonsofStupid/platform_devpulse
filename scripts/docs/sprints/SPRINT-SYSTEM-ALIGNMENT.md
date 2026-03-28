# SPRINT: System Alignment — Enterprise Foundation Reset

**Date**: 2026-03-27
**Status**: DRAFT — Owner approval required before execution
**Prerequisite**: Lefthook reconnected (done this session)
**Branch**: TBD — owner decides

---

## Context

Audit this session revealed systemic violations across the entire ColdLight design system,
route architecture, and platform wiring. This is not a patch sprint. This is a foundation
reset to align everything to Macro Law, industry standards (React Spectrum S2, Ark UI),
and the owner's enterprise architecture.

### Key Findings

- **64 components** have no primitive foundation
- **101 components** missing style-macro connection
- **38 components** missing behavior hooks
- **41 stale .svelte files** in `primitives/` (should be structural only, no .props.ts)
- **7 chat-\* component folders** are anti-pattern (should be preset variants, not separate components)
- **Chat has no Tauri window**, no domain service, invisible shell, business logic in route
- **Lefthook** has no architectural enforcement (only formatting/linting)
- **SurrealDB** tables are empty — no seeded enterprise config
- **SD5 presets** generate CSS but nothing renders visually
- **4 stale README docs** in `domains/` describing banned architecture (MeltUI, intent props, recipes, .svelte in domains)
- **22 .svelte files in `domains/`** — domains must be pure logic (Option B confirmed). No rendering.
- **5 rogue Glass\* components** in `domains/app/ui-demo/` outside ColdLight
- **Chrome-style tabs** do not exist (needed for widget system)
- **`resolveMacro()` pipeline is architecturally correct** — SD5 tokens exist on :root, var() chains work, macro-base.css glue exists. Problem is incomplete wiring, not broken design.

### Verified Working

- `resolveMacro()` → returns `{ kind, dataAttrs, cssVars }` — correct per Macro Law
- `components.generated.css` → has `--style-{kind}-{preset}-{axis}` tokens (oklch, rem)
- `macro-base.css` → has family-split `[data-cl-*]` selectors per Law 5
- `behaviors/` → 67 hooks, properly structured (anatomy, types, use-*.svelte.ts)
- `components/button/Button.svelte` → near gold-standard (behavior + style-macro + preset)
- `routes/(app)/devpulse/+page.svelte` → correct thin route with domain service

---

## Phase 0: Kill Stale Documentation (FIRST — Before Anything Else)

### Why This Is Phase 0

Every AI session reads these docs and follows their outdated instructions. They are the
ROOT CAUSE of pattern drift. They must die before any execution begins.

### Task 0.1: Delete or Rewrite Stale Domain READMEs

These files describe BANNED architecture from January 2026:

| File | Banned patterns it teaches |
|------|---------------------------|
| `domains/app/devpulse/ReadMe.md` | MeltUI imports, `DsCoreProps` with intent/tone/density, `FocusProvider` context cascade, recipes (`panel.glass`), class composition (`btn btn-primary v-cyber`), 6-Stage Gate with taxonomy, `components/` and `pages/` in domains |
| `domains/app/devpulse/CHECKLIST.md` | Feature scaffold with `components/`, `pages/` per feature in domains, DsCoreProps compliance |
| `domains/app/overmind/README.md` | `components/`, `pages/`, `stores/` in domains |
| `domains/chat/README.md` | `interactions/components/`, `interactions/pages/` in domains |

**Action**: DELETE all 4 files. Write replacements that state:
- Domains are PURE LOGIC — runes, services, types, IPC wrappers
- NO `.svelte` files in domains
- ALL rendering is in `design/` (components, blocks) and `routes/` (thin pages)
- Preset prop only, not intent/tone/density
- resolveMacro(), not recipes or class composition

### Task 0.2: Delete Rogue .svelte Files in Domains

**22 .svelte files** that violate the boundary. Confirmed Option B: domains are pure logic.

```
DELETE: domains/app/ui-demo/components/GlassButton.svelte
DELETE: domains/app/ui-demo/components/GlassCard.svelte
DELETE: domains/app/ui-demo/components/GlassContainer.svelte
DELETE: domains/app/ui-demo/components/GlassInput.svelte
DELETE: domains/app/ui-demo/components/GlassTypography.svelte
DELETE: domains/app/ui-demo/pages/UIDemoPage.svelte
DELETE: domains/app/devforge/features/friends/pages/UserDashboard.svelte
DELETE: domains/app/devforge/features/friends/pages/UserFrame.svelte
DELETE: domains/app/devforge/pages/DevDashboard.svelte
DELETE: domains/app/devpulse/features/community/pages/CommunityDashboard.svelte
DELETE: domains/app/devpulse/features/community/components/Carousel.svelte
DELETE: domains/app/devpulse/features/dashboard/pages/DevPulseDashboard.svelte
DELETE: domains/app/devpulse/features/profile/pages/ProfileDashboard.svelte
DELETE: domains/app/overmind/Canvas.svelte
DELETE: domains/app/overmind/OvermindDashboard.svelte
DELETE: domains/app/overmind/OvermindFrame.svelte
DELETE: domains/app/wiredfront/features/connectorhub/pages/ConnectionHub.svelte
DELETE: domains/app/wiredfront/features/gallery/pages/MediaGallery.svelte
DELETE: domains/app/wiredfront/features/viziwizi/pages/ViziWiziDashboard.svelte
DELETE: domains/app/wiredfront/features/viziwizi/pages/ViziWiziEditor.svelte
DELETE: domains/app/wiredfront/pages/WiredDashboard.svelte
DELETE: domains/app/wiredfront/pages/WiredfrontFrame.svelte
```

### Task 0.2a: BEFORE DELETING — Capture Glass* Visual Knowledge into SD5

The Glass* files contain 16 tokens and 7 visual patterns NOT in SD5. Deleting without
capturing loses your visual identity.

**Tokens to author into DTCG JSON before delete:**

```
Surface tokens (tokens/src/surface.json):
  --glass-standard          (missing — between deep and light)
  --glass-light             (missing)
  --glass-standard-blur     (missing)
  --glass-deep-blur         (missing)
  --glass-light-blur        (missing)
  --glass-frost-blur        (missing)

Bevel tokens (tokens/src/bevel.json — NEW):
  --bevel-raised            (missing — outer shadow for raised surfaces)
  --bevel-raised-deep       (missing — deeper version for hover/active)
  --bevel-pressed           (missing — inset shadow for pressed/input)

Border tokens (tokens/src/border.json):
  --border-rise-soft        (missing — subtle luminance border)
  --border-rise-subtle      (missing — thinner version)

Shadow tokens (tokens/src/shadow.json):
  --shadow-purple-2         (missing — colored depth shadow)
  --shadow-purple-3         (missing — deeper colored shadow)

Glow tokens (add to existing glow.css):
  --glow-blue               (missing — blue variant)

Gradient tokens (tokens/src/gradient.json — NEW):
  --gradient-bg-1           (missing — animated gradient layer 1)
  --gradient-bg-2           (missing — animated gradient layer 2)
```

**Visual patterns to capture as presets:**

1. 4-tier glass system (deep/standard/light/frost) with per-tier blur
2. Bevel raised/pressed/deep system
3. Rise border luminance system
4. Colored shadow tiers (purple-2, purple-3)
5. Animated dual-gradient background with mix-blend-mode overlay
6. Hover lift translateY with shadow escalation
7. Focus glow ring (inset bevel + glow)

**Two preset scopes (industry standard):**

**Seed Presets** — generic, reusable across ANY component kind:
```
tokens/src/presets/seed/
  glass-deep.json          # 4-tier glass: deep variant + blur + bevel-raised + rise-border
  glass.json               # 4-tier glass: standard (default) + blur + bevel-raised
  glass-light.json         # 4-tier glass: light variant + blur
  glass-frost.json         # 4-tier glass: frost variant + blur
  stark.json               # Opaque dark, hard borders, no glass
  matte.json               # Solid muted surface, subtle shadow
  flat.json                # Zero depth, zero shadow, zero border
  neuro-elevated.json      # Neumorphic with raised bevel + glow
```

**Kind Presets** — scoped to a specific component kind:
```
tokens/src/presets/kind/
  button-destructive.json  # Red accent, danger shadow
  chat-bubble-ai.json      # Left-aligned, glass-deep, teal glow
  chat-bubble-user.json    # Right-aligned, glass-standard, subtle border
  chat-appbar.json         # Compact topbar, teal accent
  chat-rail.json           # Vertical icon nav, mode indicators
  chat-pane.json           # Scrollable content area
  chat-actionbar.json      # Input zone, inset bevel
  chat-inspector.json      # Context/detail panel
```

**Shared visual pattern tokens** (used by seed presets, not component-specific):
```
tokens/src/bevel.json      # NEW — raised, raised-deep, pressed
tokens/src/border-rise.json # NEW — soft, subtle luminance borders
tokens/src/gradient.json   # NEW — animated dual-layer backgrounds
tokens/src/shadow.json     # UPDATE — add colored shadow tiers (purple-2, purple-3)
tokens/src/glow.json       # UPDATE — add --glow-blue
tokens/src/surface.json    # UPDATE — add glass-standard, glass-light, per-tier blur
```

**resolveMacro() resolution order:**
1. Look up `--style-{kind}-{preset}-{axis}` (kind preset — most specific)
2. Fall back to `--seed-{preset}-{axis}` (seed preset — generic)
3. Fall back to `--seed-default-{axis}` (default seed)

The Glass* files are then redundant because the token system produces the same
output through resolveMacro(). Every visual pattern they contain is captured in
either a seed preset or shared tokens.

### Task 0.2b: Capture Roadmap from Stub Files BEFORE Delete

17 of the 22 files are empty stubs with TODO headers. They represent PLANNED features.
Capture as roadmap items in the domain README replacements (Task 0.1):

| Domain | Planned Page | Route |
|--------|-------------|-------|
| devforge | Friends/Social Dashboard | `/devforge/friends` |
| devforge | User Profile Frame | `/devforge/friends/user` |
| devforge | DevForge Main Dashboard | `/devforge` |
| devpulse | Community Dashboard | `/devpulse/community` |
| devpulse | Profile Dashboard | `/devpulse/profile` |
| overmind | Sandbox Canvas | `/overmind/canvas` |
| overmind | Sandbox Dashboard | `/overmind` |
| overmind | Sandbox Frame | `/overmind` (layout) |
| wiredfront | API Connector Hub | `/wiredfront/connectors` |
| wiredfront | Media Gallery | `/wiredfront/gallery` |
| wiredfront | ViziWizi Dashboard | `/wiredfront/viziwizi` |
| wiredfront | ViziWizi Editor | `/wiredfront/viziwizi/editor` |
| wiredfront | WiredFront Dashboard | `/wiredfront` |
| wiredfront | WiredFront Frame | `/wiredfront` (layout) |
| ui-demo | Design System Showcase | `/ui-demo` |

**1 file has real code that must be preserved:**
- `Carousel.svelte` — 3D perspective card carousel with keyboard navigation.
  Uses ColdLight Card + Text correctly. Move to `design/blocks/` or `design/components/carousel/`.
  Also captures 3D perspective pattern (`perspective: 1000px`, `transform-style: preserve-3d`, `translate-z`)
  which no other component has.

### Task 0.2c: Correct Token Audit (Dry Run Findings)

**Sprint originally claimed 16 tokens missing. Actual count after reading DTCG source:**

ALREADY EXISTS in SD5 (DO NOT re-author):
- `bevel.*` — full 7-tier system (off→subtle→soft→medium→pronounced→deep) in `bevel.json`
- `glow.teal/purple/magenta/ember/frost/cyber` — 7 colors in `glow.json`
- `glass.void/deep/smoke/frost/teal/purple` — 6 surfaces in `surface.json`
- `matte.dark/medium/light` — 3 matte surfaces in `surface.json`

NEEDS MAPPING (exists but naming differs from Glass* files):
- Glass* uses `--bevel-raised` → maps to `bevel.soft` or `bevel.medium`
- Glass* uses `--bevel-raised-deep` → maps to `bevel.pronounced` or `bevel.deep`
- Glass* uses `--bevel-pressed` → needs new inset variant (inverted bevel)
- Glass* uses `--shadow-purple-2/3` → may compose from `glow.purple` + depth shadows

ACTUALLY MISSING (must author):
- `glass.standard` — between smoke and frost (the most common glass tier)
- `glass.light` — lighter than standard
- Per-glass blur dimensions — `backdrop.glass-deep`, `backdrop.glass-standard`, etc. (check backdrop.json)
- `glow.blue` — missing from glow.json
- `border-rise.soft` / `border-rise.subtle` — luminance border tokens
- `gradient.animated-1` / `gradient.animated-2` — dual-layer animated background
- `bevel.pressed` — inverted/inset bevel for inputs (opposite of raised)

### STOP — Owner Decision Required

**Question**: Confirm all 22 deletions. Carousel.svelte code will be preserved by moving
to design/. Roadmap captured above. Glass* visual knowledge captured. Any exceptions?

### Task 0.3: Add Lefthook Hard-Stop for .svelte in Domains

Immediate hook so this never happens again:

```bash
# scripts/hooks/no-svelte-in-domains.sh
# HARD STOP: .svelte files in domains/ violate architecture boundary
files=$(find interfaces/desktop/src/lib/domains -name "*.svelte" 2>/dev/null)
if [ -n "$files" ]; then
  echo "HARD STOP: .svelte files found in domains/"
  echo "Domains are PURE LOGIC — runes, services, types only."
  echo "Move rendering to design/ (components, blocks) or routes/ (thin pages)."
  echo ""
  echo "$files"
  exit 1
fi
```

---

## Phase 1: Primitives — Pure Contracts, Not Wrapper Components

### The Problem

**ZERO components import from primitives/.** The primitives layer is 100% disconnected.
Components go straight to style-macro + raw HTML divs. No structural contract. No shared
foundation. Every component independently authors its own HTML structure.

### The Industry Standard (2026)

Primitives are **contracts** — anatomy declarations + typed interfaces. NOT wrapper
components. The component renders its OWN semantic HTML, using the primitive's anatomy
for consistent data attributes and the primitive's types for structural props.

- React Spectrum S2: shared style utilities (`control()`, `field()`) — functions, not components
- Ark UI / Zag: anatomy declares parts, component renders its own HTML with `data-part`
- Macro Law 2: "No Wrapper Elements. Ever. The styled element IS the semantic root."

**Wrapper components like `<Surface>` around `<article>` violate Law 2.** Card IS a surface.
It renders its own `<article>` and spreads the surface anatomy attributes directly.

### Two Categories of Primitives

**A. Contracts (anatomy + types)** — consumed by components, not rendered directly:
```
primitives/
  container/
    container.anatomy.ts    # createAnatomy("container", ["root", "header", "body", "footer"])
    container.types.ts      # ContainerProps { as?: "div"|"article"|"section"|"aside" }
    index.ts
  field/
    field.anatomy.ts        # createAnatomy("field", ["root", "label", "input", "description", "error"])
    field.types.ts          # FieldProps { orientation?: "vertical"|"horizontal" }
    index.ts
  feedback/
    feedback.anatomy.ts     # createAnatomy("feedback", ["root", "icon", "message", "action"])
    feedback.types.ts       # FeedbackProps { severity: "info"|"warning"|"error"|"success" }
    index.ts
  indicator/
    indicator.anatomy.ts    # createAnatomy("indicator", ["root", "track", "fill", "label", "value"])
    indicator.types.ts      # IndicatorProps { min?: number, max?: number }
    index.ts
  avatar/
    avatar.anatomy.ts       # createAnatomy("avatar", ["root", "image", "fallback"])
    avatar.types.ts         # AvatarProps { size?: "sm"|"md"|"lg"|"xl" }
    index.ts
```

**B. Layout components (rendered directly by users)** — these ARE the output:
```
primitives/
  stack/
    Stack.svelte            # KEEP — users render <Stack> directly
    stack.anatomy.ts        # NEW
    stack.types.ts          # NEW (extract from inline interface)
    index.ts                # EXISTS
  row/
    Row.svelte              # KEEP — users render <Row> directly
    row.anatomy.ts          # NEW
    row.types.ts            # NEW (extract from inline interface)
    index.ts                # EXISTS
  separator/
    Separator.svelte        # KEEP — users render <Separator> directly
    separator.anatomy.ts    # NEW
    separator.types.ts      # NEW
    index.ts                # EXISTS
```

### How Contracts Work (Gold Standard)

**Container anatomy contract:**
```typescript
// primitives/container/container.anatomy.ts
import { createAnatomy } from "../../schema/anatomy.schema.js";
export const containerAnatomy = createAnatomy("container", [
  "root", "header", "body", "footer"
] as const);
```

**Card consumes the contract — NO wrapper:**
```svelte
<script lang="ts">
  import { containerAnatomy } from "$lib/design/primitives/container/index.js";
  import { useCard } from "$lib/design/behaviors/card/index.js"; // if interactive
  import { resolveMacro, cssVarString } from "$lib/design/style-macro";

  let { preset = "default", children, class: className }: CardProps = $props();
  const m = $derived(resolveMacro({ kind: "card", preset }));
</script>

<!-- Card IS the surface. No wrapper. Semantic root renders directly. -->
<article
  {...containerAnatomy.attrs.root}
  {...m.dataAttrs}
  style={cssVarString(m.cssVars)}
  class={cn("overflow-hidden", className)}
>
  {@render children?.()}
</article>
```

The anatomy provides `data-kind="container"` and `data-slot="root"` via spread.
The component renders its own `<article>`. No wrapper. No indirection.
`resolveMacro` adds `data-cl-*` family markers and `--cl-*` CSS vars.

**Field anatomy contract — multi-slot:**
```svelte
<script lang="ts">
  import { fieldAnatomy } from "$lib/design/primitives/field/index.js";
  import { useTextField } from "$lib/design/behaviors/text-field/index.js";
  import { resolveMacro, cssVarString } from "$lib/design/style-macro";
</script>

<div {...fieldAnatomy.attrs.root} {...m.dataAttrs} style={cssVarString(m.cssVars)}>
  <label {...fieldAnatomy.attrs.label}>{label}</label>
  <input {...fieldAnatomy.attrs.input} {...tf.input} />
  {#if description}
    <span {...fieldAnatomy.attrs.description}>{description}</span>
  {/if}
  {#if error}
    <span {...fieldAnatomy.attrs.error}>{error}</span>
  {/if}
</div>
```

### What Gets Deleted

**31 duplicate primitive folders** (they duplicate behaviors/ — already listed above).

**Delete .svelte from contract primitives** (Surface, Field, Dot, IconSlot):
```
DELETE: primitives/surface/Surface.svelte    → becomes contract only
DELETE: primitives/field/Field.svelte         → becomes contract only
DELETE: primitives/dot/Dot.svelte             → becomes contract only
DELETE: primitives/icon-slot/IconSlot.svelte  → becomes contract only
DELETE: ALL .props.ts files (35 total)
```

**Keep .svelte for layout primitives:**
```
KEEP: primitives/stack/Stack.svelte
KEEP: primitives/row/Row.svelte
KEEP: primitives/separator/Separator.svelte
```

**Text/Heading/Label** — these are components, not primitives. They render directly.
Move any primitive contract (anatomy) into their component folders or into behaviors.

### Component × Contract Matrix

Which contract each component family imports:

| Component | Primitive Contract | Behavior Hook | Style-macro |
|-----------|-------------------|---------------|-------------|
| Card | `container` | none (structural) | `resolveMacro("card")` |
| Alert | `feedback` | `useAlert` | `resolveMacro("alert")` |
| Banner | `feedback` | `useBanner` | `resolveMacro("banner")` |
| InlineMessage | `feedback` | `useInlineMessage` | `resolveMacro("inline-message")` |
| Badge | none (inline span) | `useBadge` | `resolveMacro("badge")` |
| Progress | `indicator` | `useProgress` | `resolveMacro("progress")` |
| Spinner | `indicator` | `useSpinner` | `resolveMacro("spinner")` |
| RadialGauge | `indicator` | none | `resolveSvgMacro("radial-gauge")` |
| SparkLine | none (SVG) | none | `resolveSvgMacro("spark-line")` |
| Stat | `indicator` | none | `resolveMacro("stat")` |
| TextField | `field` | `useTextField` | `resolveMacro("text-field")` |
| Textarea | `field` | `useTextarea` | `resolveMacro("textarea")` |
| Select | `field` | `useSelect` | `resolveMacro("select")` |
| Combobox | `field` | `useCombobox` | `resolveMacro("combobox")` |
| Checkbox | none (single element) | `useCheckbox` | `resolveMacro("checkbox")` |
| Switch | none (single element) | `useSwitch` | `resolveMacro("switch")` |
| Toggle | none (single element) | `useToggle` | `resolveMacro("toggle")` |
| Button | none (single element) | `useButton` | `resolveMacro("button")` |
| Dialog | none (dialog element) | `useDialog` | `resolveMacro("dialog")` |
| Tabs | none (compound) | `useTabs` | `resolveMacro("tabs")` |
| Accordion | `container` | `useAccordion` | `resolveMacro("accordion")` |
| Avatar | `avatar` | none | `resolveMacro("avatar")` |
| Widget | `container` | none | inherits from Card |
| EmptyState | `container` | none | `resolveMacro("empty-state")` |

Single-element components (Button, Checkbox, Switch, Toggle, Badge) don't need a
primitive contract — they ARE their own structure. The contract adds value for
multi-slot components where consistent slot naming matters.

### Execution Order for Phase 1

```
1.1  Delete 31 duplicate primitive folders
1.2  Delete .svelte + .props.ts from contract primitives (Surface, Field, Dot, IconSlot)
1.3  Author 5 contract primitives: container, field, feedback, indicator, avatar
     (anatomy.ts + types.ts + index.ts each)
1.4  svelte-check
1.5  Extract Stack/Row/Separator types from inline interfaces to .types.ts files
1.6  svelte-check
1.7  Wire container anatomy into Card (gold standard) — spread attrs, no wrapper
1.8  svelte-check → verify Card renders
1.9  Wire container anatomy into remaining: Alert, Banner, Callout, Widget, EmptyState, Accordion
1.10 svelte-check
1.11 Wire field anatomy into TextField (gold standard for fields)
1.12 svelte-check → verify TextField renders
1.13 Wire field anatomy into remaining: Textarea, ColorField, DateField, Select, Combobox, FormField
1.14 svelte-check
1.15 Wire feedback anatomy into Alert, Banner, InlineMessage
1.16 svelte-check
1.17 Wire indicator anatomy into Progress, Stat
1.18 svelte-check
1.19 Wire avatar anatomy into Avatar, AvatarGroup
1.20 svelte-check final — 0 errors required
```

---

## Phase 1b: Primitives — Restructure as Families

### Current State

`primitives/` has 41 `.svelte` files and 35 `.props.ts` files. They are inconsistently
structured — some are pure structural (Surface, Stack, Row), others duplicate what
`behaviors/` already provides (Accordion, Dialog, etc.). No types folder. No anatomy.
No named family structure matching behaviors' gold standard.

### Target State

Primitives become **structural family helpers** — the S2 equivalent of `style-utils.ts`.
They provide the structural contract (slots, anatomy, element type) that components
compose from. They are NOT 1:1 with components. They are shared families.

Behaviors remain separate — they provide ARIA, keyboard, focus. A component composes
**primitive (structure) + behavior (interaction) + style-macro (visual)**.

### STOP — Owner Decision Required

**Question**: The 13 families identified this session:

| Family | Structural role | Existing primitive? |
|--------|----------------|-------------------|
| Container | Box with header/body/footer slots | `surface` (partial) |
| Feedback | Status region, icon+message+action | None |
| Indicator | Value display, progress, loading | `progress`, `meter` (in behaviors only) |
| Field | label+input+description+error anatomy | `field` exists |
| Picker | Field+trigger+popup+content | None (composed from Field+Disclosure) |
| Toggle | Pressable on/off, single or grouped | `checkbox`, `switch`, `toggle` exist |
| Disclosure | Trigger+content+overlay | `dialog`, `sheet`, `popover` exist |
| Navigation | Route/section switching, ordered items | `tabs` exists |
| Collection | Ordered list, selection model | `table`, `listbox`, `grid-list` exist |
| Layout | Stack, Row, Separator, Grid zones | `stack`, `row`, `surface`, `separator`, `dot`, `icon-slot` exist |
| Text | Typography, semantic level | `text`, `heading`, `label` exist |
| Trigger | Clickable action, button | In behaviors only |
| Avatar | User/entity representation | None |

**Options**:
A) Author all 13 families as proper primitive folders with types, anatomy, index.ts — matching behaviors' structure
B) Only author families that don't already exist (Feedback, Indicator, Picker, Avatar) — restructure existing ones in place
C) Different grouping — owner redefines

**Impact**: This determines the folder structure for the entire primitive layer.

---

### Task 1.1: Define Primitive Family Folder Structure

Each primitive family folder must match the behaviors gold standard:

```
primitives/
  {family}/
    {family}.anatomy.ts      # createAnatomy() — declares structural parts/slots
    {family}.types.ts        # TypeScript interfaces for structural props
    index.ts                 # Public exports
```

No `.svelte` files in primitives. No `.props.ts` files. Primitives are **contracts only** —
anatomy + types. The structural rendering lives in the component layer, using the
primitive's anatomy to declare data-slot attributes.

### STOP — Owner Decision Required

**Question**: Should primitives remain as `.svelte` structural components (Surface.svelte, Stack.svelte)
or become pure contracts (anatomy + types only) like behaviors?

**Options**:
A) **Pure contracts** — primitives are anatomy + types. Components render their own structure using the anatomy.
   - Pro: Matches behaviors pattern exactly. One pattern for both layers.
   - Pro: No confusion about whether to import primitives or components.
   - Con: Components need more boilerplate (each renders its own structure).

B) **Structural components** — primitives stay as .svelte files but restructured with proper types/anatomy.
   - Pro: Reusable structural rendering (Surface, Stack, Row used directly).
   - Pro: Simpler components (compose from structural primitives).
   - Con: Two patterns — behaviors are hooks, primitives are components. More to learn.

C) **Hybrid** — Layout family (Stack, Row, Surface, Separator) stays as .svelte structural components
   because they ARE the rendered output. All other families become pure contracts
   because their rendering is component-specific.
   - Pro: Layout primitives are genuinely reusable structural components.
   - Pro: Non-layout families are contracts that components interpret per their needs.

**Impact**: Determines whether Surface.svelte, Stack.svelte, Row.svelte survive or become anatomy-only.

---

### Task 1.2: Clean Up Stale Primitive Files

Remove the 35 `.props.ts` files and any `.svelte` files that duplicate `behaviors/`.

**Files to audit and likely delete** (they exist in both `primitives/` AND `behaviors/`):

```
primitives/accordion/      → behaviors/accordion/ exists (use-accordion.svelte.ts)
primitives/alert-dialog/   → behaviors/alert-dialog/ exists
primitives/badge/          → behaviors/badge/ exists
primitives/checkbox/       → behaviors/checkbox/ exists
primitives/color-field/    → behaviors/color-field/ exists
primitives/color-slider/   → behaviors/color-slider/ exists
primitives/combobox/       → behaviors/combobox/ exists
primitives/dialog/         → behaviors/dialog/ exists
primitives/heading/        → behaviors/heading/ exists
primitives/label/          → behaviors/label/ exists
primitives/listbox/        → behaviors/listbox/ exists
primitives/menu/           → behaviors/menu/ exists
primitives/meter/          → behaviors/meter/ exists
primitives/number-field/   → behaviors/number-field/ exists
primitives/popover/        → behaviors/popover/ exists
primitives/progress/       → behaviors/progress/ exists
primitives/radio-group/    → behaviors/radio-group/ exists
primitives/search-field/   → behaviors/search-field/ exists
primitives/select/         → behaviors/select/ exists
primitives/separator/      → behaviors/separator/ exists
primitives/sheet/          → behaviors/sheet/ exists
primitives/slider/         → behaviors/slider/ exists
primitives/switch/         → behaviors/switch/ exists
primitives/table/          → behaviors/table/ exists
primitives/tabs/           → behaviors/tabs/ exists
primitives/tag-group/      → behaviors/tag-group/ exists
primitives/text-field/     → behaviors/text-field/ exists
primitives/toggle/         → behaviors/toggle/ exists
primitives/toolbar/        → behaviors/toolbar/ exists
primitives/tooltip/        → behaviors/tooltip/ exists
primitives/tree/           → behaviors/tree/ exists
```

**31 primitive folders duplicate behaviors.** These get deleted.

**Primitives that should STAY** (structural, no behavior equivalent):

```
primitives/surface/        → Layout family structural
primitives/stack/          → Layout family structural
primitives/row/            → Layout family structural
primitives/dot/            → Layout family structural
primitives/icon-slot/      → Layout family structural
primitives/separator/      → Layout family structural (has behavior too, but structural is primary)
primitives/text/           → Text family structural
primitives/heading/        → Text family structural (has behavior too)
primitives/label/          → Text family structural (has behavior too)
primitives/field/          → Field family structural
```

### STOP — Owner Decision Required

**Question**: Confirm the 31 deletions and 10 keeps above. Any exceptions?

---

### Task 1.3: Author Missing Family Anatomy

For each family, create the anatomy definition:

```typescript
// primitives/container/container.anatomy.ts
import { createAnatomy } from "../../schema/anatomy.schema.js";

export const containerAnatomy = createAnatomy("container", [
  "root", "header", "body", "footer"
] as const);
```

Families needing anatomy authored:

| Family | Slots |
|--------|-------|
| Container | root, header, body, footer |
| Feedback | root, icon, message, action |
| Indicator | root, track, fill, label, value |
| Picker | root, trigger, content, list |
| Avatar | root, image, fallback |

Families with anatomy already in behaviors (no duplicate needed):
- Toggle, Disclosure, Navigation, Collection, Trigger — anatomy lives in `behaviors/`

---

## Phase 2: Chat Architecture — Domain Variant, Not Separate Components

### Current State

7 `chat-*` folders in `components/`:
- `chat-frame`, `chat-topbar`, `chat-sidebar`, `chat-dashboard`, `chat-footer`, `chat-context-panel`, `chat-bubble`

These are anti-pattern per industry standards. They should be **preset variants** of
standard components, composed in the layout layer.

### Target State

| Current | Becomes | Preset |
|---------|---------|--------|
| `chat-frame` | Layout composition in `lib/layouts/chat/` | Uses standard Frame + `preset="chat"` |
| `chat-topbar` | Standard TopBar/AppBar component | `preset="chat-appbar"` |
| `chat-sidebar` | Standard Nav component | `preset="chat-rail"` |
| `chat-dashboard` | Standard content pane (div) | `preset="chat-pane"` |
| `chat-footer` | Standard ActionBar/Footer component | `preset="chat-actionbar"` |
| `chat-context-panel` | Standard Panel/Aside component | `preset="chat-inspector"` |
| `chat-bubble` | Standard Card component | `preset="chat-bubble-user"` / `preset="chat-bubble-ai"` |

### STOP — Owner Decision Required

**Question**: Delete the 7 `chat-*` component folders and replace with preset variants?
Or keep them as thin wrappers that internally compose standard components + chat presets?

**Options**:
A) **Delete and replace** — `lib/layouts/chat/Frame.svelte` directly uses `<Nav preset="chat-rail">`, `<Card preset="chat-bubble-ai">`, etc. No chat-specific component folders.
B) **Thin domain wrappers** — keep `components/chat-frame/` but internally it just renders `<Frame preset="chat">`. Convenience for the layout layer. Still in `components/`.
C) **Move to blocks** — `blocks/chat/` already exists. Move all chat compositions there. `blocks/` is the correct layer for domain-specific compositions per shadcn's registry model.

**Impact**: Determines where chat UI code lives and how VPB categorizes it.

---

### Task 2.1: Author Chat Presets in SD5

Add chat-specific presets to the DTCG token source:

```
tokens/src/presets/chat-appbar.json
tokens/src/presets/chat-rail.json
tokens/src/presets/chat-pane.json
tokens/src/presets/chat-actionbar.json
tokens/src/presets/chat-inspector.json
tokens/src/presets/chat-bubble-user.json
tokens/src/presets/chat-bubble-ai.json
```

Each preset defines the visual axes for that chat variant using the existing
11-axis DTCG system. The SD5 pipeline compiles them to CSS custom properties.

### Task 2.2: Author Chat Domain Service

Create `lib/domains/chat/` following the devpulse pattern:

```
lib/domains/chat/
  index.ts                  # Public exports
  chat.state.svelte.ts      # Svelte 5 rune — thread, message, send state
  chat.ipc.ts               # Tauri invoke wrappers (load_recent, send_message)
  chat.types.ts             # ChatThread, ChatMessage, ChatMode
```

All business logic moves out of the route page into here.

### Task 2.3: Add Tauri Chat Window

Add to `tauri.conf.json`:

```json
{
  "label": "chat",
  "title": "DevPulse Chat",
  "width": 600,
  "height": 800,
  "minWidth": 400,
  "minHeight": 500,
  "resizable": true,
  "transparent": false,
  "decorations": true,
  "visible": false,
  "url": "/chat"
}
```

### STOP — Owner Decision Required

**Question**: Chat window dimensions, decorations, transparency settings.
Also: should the chat window be `transparent: true` for the glass effect, or handle
that in CSS only?

---

### Task 2.4: Rewrite Chat Route Page (Thin)

`routes/(chat)/chat/+page.svelte` becomes:

```svelte
<script lang="ts">
  import { chatState } from "$lib/domains/chat/index.js";
</script>

<!-- Route renders what domain provides. No business logic. -->
{#if chatState.loading}
  <Spinner preset="chat" />
{:else if chatState.messages.length === 0}
  <EmptyState preset="chat" />
{:else}
  {#each chatState.messages as msg (msg.id)}
    <Card preset={msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'}>
      {msg.content}
    </Card>
  {/each}
{/if}
```

### Task 2.5: Fix Chat Layout Visibility

`(chat)/+layout.svelte` must ensure the chat shell is visible when the route is active.
This is a layout lifecycle concern — NOT a bandaid `globalState.chat_open = true`.

### STOP — Owner Decision Required

**Question**: How should chat shell visibility work?

**Options**:
A) Chat route group always renders visible — no open/closed state. If you're at `/chat`, you see chat. The `chat_open` state in globalState controls whether the chat OVERLAY appears from the app shell, not the dedicated chat route.
B) Chat window is managed by Tauri — `open_chat_window` Rust command creates the window, navigates to `/chat`, the layout renders visible by default.
C) Different approach — owner defines.

---

## Phase 3: Route Architecture — Enterprise SvelteKit 5

### Current State

- `routes/(app)/devpulse/+page.svelte` — GOOD pattern. Thin. Uses domain service.
- `routes/(chat)/chat/+page.svelte` — BAD. Business logic inlined. Fights its layout.
- `routes/+page.svelte` — Has BOTH `+page.ts` and `+page.server.ts` doing the same redirect (duplicate)

### Task 3.1: Audit All Route Pages

| Route | Domain Service | Thin? | Issues |
|-------|---------------|-------|--------|
| `(app)/devpulse/+page.svelte` | `devpulseState` | Yes | Good reference |
| `(app)/devpulse/projects/+page.svelte` | ? | ? | Needs audit |
| `(app)/devpulse/community/+page.svelte` | ? | ? | Needs audit |
| `(app)/devpulse/settings/+page.svelte` | ? | ? | Needs audit |
| `(app)/devpulse/stats/+page.svelte` | ? | ? | Needs audit |
| `(app)/maestro/+page.svelte` | ? | ? | Needs audit |
| `(app)/overmind/+page.svelte` | ? | ? | Needs audit |
| `(app)/wiredfront/+page.svelte` | ? | ? | Needs audit |
| `(app)/devforge/+page.svelte` | ? | ? | Needs audit |
| `(app)/ui-demo/+page.svelte` | ? | ? | Needs audit |
| `(chat)/chat/+page.svelte` | None | No | Rewrite in Phase 2 |

### Task 3.2: Remove Duplicate Root Redirect

`+page.ts` and `+page.server.ts` both redirect to `/devpulse`. With `ssr = false`,
the server load never runs. Delete `+page.server.ts`.

### Task 3.3: Ensure Every Route Group Has Proper Layout Chain

```
routes/+layout.svelte          → Root: CSS imports, SvgFilters, BootOverlay, platform init
routes/(app)/+layout.svelte    → App shell: Frame (topbar, sidebar, content, context, statusbar)
routes/(chat)/+layout.svelte   → Chat shell: ChatShell (frame, panels, zones)
```

Verify the import chain is correct and uses `.js` extensions.

---

## Phase 4: Component Alignment — Wire All 183 to Macro Law

### Current Alignment

| Status | Count | What's needed |
|--------|-------|---------------|
| Has style-macro + behaviors | **50** | Aligned — verify against Macro Law |
| Has style-macro, missing behaviors | **32** | Wire behavior hook |
| Has behaviors, missing style-macro | **16** | Wire resolveMacro() |
| Has neither | **85** | Full authoring needed |

### Task 4.1: Establish Gold Standard Component

Before touching 183 files, author ONE perfect component that serves as the template.

**Candidate**: Button (already closest to correct)

Gold standard checklist:
- [ ] Imports behavior hook from `behaviors/button/index.js`
- [ ] Imports `resolveMacro`, `cssVarString` from `style-macro`
- [ ] Uses `preset` prop (NOT intent)
- [ ] Calls `resolveMacro({ kind: 'button', preset })` in `$derived`
- [ ] Spreads `m.dataAttrs` on semantic root (no wrapper)
- [ ] Sets `style={cssVarString(m.cssVars)}` on semantic root
- [ ] Spreads behavior hook attrs on semantic root (`{...button.root}`)
- [ ] Uses scoped kind string (Law 3)
- [ ] No visual context inheritance (Law 4)
- [ ] No `class` override on visual properties (Law 1 closed system)
- [ ] Types in separate `.types.ts` file
- [ ] Exported from `index.ts`

### STOP — Owner Decision Required

**Question**: Button is currently the closest. Use it as gold standard, or pick a different component?

---

### Task 4.2: Author Chrome-Style Tabs Behavior

The existing `behaviors/tabs/` provides basic tab switching. Chrome-style tabs for
the widget system need additional behavior:

- **Closeable** — each tab has a close button, fires `onClose(id)`
- **Reorderable** — drag-and-drop tab reordering
- **Overflow** — horizontal scroll when tabs exceed container width
- **Pinnable** — pin tabs to the left (optional)

**Options**:
A) Extend `use-tabs.svelte.ts` with optional chrome features
B) Author a separate `use-chrome-tabs.svelte.ts` in `behaviors/tabs/`

### STOP — Owner Decision Required

**Question**: Extend existing tabs behavior or author separate chrome-tabs behavior?

---

### Task 4.3: Batch Alignment by Family

After gold standard is approved, align components family by family:

**Batch 1 — Dashboard Critical** (must render for devpulse route):
- Card, Widget, RadialGauge, SparkLine, Text, Heading, Badge, Stat, Spinner, Progress

**Batch 2 — Chat Critical** (must render for chat route):
- (Uses standard components with chat presets — covered by Batch 1 + Phase 2)

**Batch 3 — Form Controls**:
- Button, TextField, Textarea, Checkbox, Switch, Toggle, Select, Combobox, RadioGroup, ToggleGroup, Slider

**Batch 4 — Disclosure/Overlay**:
- Dialog, AlertDialog, Sheet, Popover, Tooltip, ContextualHelp, Collapsible

**Batch 5 — Navigation + Chrome Tabs**:
- Tabs (including chrome-style variant), Nav, NavigationMenu, Sidebar, Pagination, Steps, TableOfContents

**Batch 6 — Data Display**:
- Table, DataTable, List, DescriptionList, KeyValue, ScrollArea

**Batch 7 — Remaining**:
- All remaining components

Each batch: author → svelte-check → verify rendering → next batch.
NO claiming done after one pass. Each batch gets verified by running the app
and confirming visual output in the browser.

---

## Phase 4c: Fix Commit-Blocking Hooks (BEFORE ANY COMMIT)

Lefthook blocks ALL commits. 5 hooks fail. Nothing can be committed until fixed.

### Blocker 1: biome-lint (7 errors)

**Lint errors (5):**
- `Alert.svelte:52` — `undefined!` non-null assertion → replace with `$state<boolean>(false)`
- `logger.ts:121` — `console` usage → add biome-ignore (intentional logging facade)
- `TokenDebugOverlay.svelte:90,124,148` — `while(match = regex.exec())` → refactor to standard loop

**Format errors (2):**
- SD5 generates `.d.ts` files with single-quote compact format. Biome wants double-quote multi-line.
- Affected: `types/component.d.ts`, `types/gradient.d.ts`, `types/shadow.d.ts`, `types/surface.d.ts`

**Root cause:** SD5 `.d.ts` format template not biome-compliant.
**Fix:** Update SD5 format template → rebuild → biome-compliant output.

### Blocker 2 + 3: coldlight-docs + coldlight-verify — ROOT CAUSE: phantom package.json

**Root cause:** `src/lib/design/package.json` exports map references 7 deleted modules:
```json
".": "./index.ts"              // DELETED
"./manifest": "./manifest.ts"  // DELETED
"./constraints": "./constraints.ts"  // DELETED
"./tokens": "./tokens/tokens.ts"     // DELETED
"./taxonomy": "./taxonomy/index.ts"  // DELETED
"./recipes": "./recipes/index.ts"    // DELETED
"./primitives": "./primitives/index.ts"  // DELETED
```

`generate-docs.ts` reads this exports map → finds nothing → fails.
`verify-manifest.ts` imports `scanner.js` (also deleted) → fails.

**Fix — rewrite package.json exports to current architecture:**
```json
{
  "exports": {
    "./style-macro": {
      "types": "./style-macro/types.d.ts",
      "import": "./style-macro/index.ts"
    },
    "./behaviors": {
      "import": "./behaviors/index.ts"
    },
    "./components": {
      "svelte": "./components/index.ts"
    },
    "./blocks": {
      "svelte": "./blocks/index.ts"
    },
    "./utils": {
      "import": "./utils/index.ts"
    }
  }
}
```

**Fix — rewrite verify-manifest.ts to verify ACTUAL architecture:**

Instead of importing deleted `scanner.js`, the verifier should check:
1. Every `components/{kind}/` has: `.svelte` root file, `types.ts`, `index.ts`
2. Every component `.svelte` imports `resolveMacro` from `style-macro`
3. Every component `.svelte` has `data-kind` on semantic root
4. Every component uses `preset` prop, NOT `intent`
5. No wrapper elements (Law 2)
6. Components with behaviors import from `behaviors/{kind}/`
7. Multi-slot components import primitive anatomy contract

This becomes the REAL ColdLight verifier — not a manifest diff, but an architecture enforcer.

**Fix — rewrite generate-docs.ts:**

Update entry points to match new exports map. The TypeDoc generation is fine,
it just needs the correct files to scan.

### Blocker 4: docs-preflight — primitive-structure check outdated

`check.primitive-structure.ts` requires:
- `types.ts` in every primitive folder ✓ (correct)
- `index.ts` in every primitive folder ✓ (correct)
- `.svelte` file in every primitive folder ✗ (WRONG for contract primitives)

Line 53: `const hasSvelte = files.some(f => f.endsWith('.svelte'));`

This enforces the OLD pattern where every primitive was a `.svelte` component.
Contract primitives (container, field, feedback, indicator, avatar) have NO `.svelte`.
Only layout primitives (Stack, Row, Separator) keep `.svelte`.

**Fix:** Update `check.primitive-structure.ts`:
```typescript
const REQUIRED_FILES = ['types.ts', 'index.ts'];
const LAYOUT_PRIMITIVES = ['stack', 'row', 'separator'];

// .svelte only required for layout primitives
if (LAYOUT_PRIMITIVES.includes(dir)) {
  const hasSvelte = files.some(f => f.endsWith('.svelte'));
  if (!hasSvelte) { /* fail */ }
}

// anatomy.ts required for ALL primitives
const hasAnatomy = files.some(f => f.endsWith('.anatomy.ts'));
if (!hasAnatomy) { /* fail */ }
```

### Execution order to unblock commits

```
Step 1: Fix 5 biome lint errors (Alert, logger, TokenDebugOverlay)
Step 2: Fix SD5 .d.ts format template → rebuild → biome passes
Step 3: Rewrite design/package.json exports → current architecture
Step 4: Rewrite verify-manifest.ts → architecture enforcer (not phantom scanner)
Step 5: Update generate-docs.ts entry points → match new exports
Step 6: Delete 31 duplicate primitive folders (Phase 1)
Step 7: Author anatomy.ts + types.ts for remaining/new primitives (Phase 1)
Step 8: Update check.primitive-structure.ts → contract model (anatomy required, .svelte only for layout)
Step 9: All hooks pass → commits unblocked
```

Steps 1-5 are commit infrastructure — do first.
Steps 6-7 are Phase 1 primitives work.
Step 8 is preflight alignment.

---

## Phase 5: Lefthook Hard-Stops

### Task 5.1: Author Architectural Enforcement Scripts

All scripts go in `scripts/hooks/`. All are HARD FAILURES, not warnings.

**Hook 1: `no-business-in-routes.sh`**

Scans `routes/**/*.svelte` for:
- `invoke(` — Tauri IPC calls belong in `lib/domains/`
- `async function` that isn't a SvelteKit load — business logic
- `$state<` with domain types — state management belongs in lib/

Error message:
```
HARD STOP: Business logic detected in route page: {file}:{line}
  Found: {match}
  Routes must be thin renderers. Move business logic to lib/domains/ or lib/sys/runes/.
  See: routes/(app)/devpulse/+page.svelte for correct pattern.
```

**Hook 2: `route-layout-integrity.sh`**

Every route group `(name)/+layout.svelte` must import from `lib/layouts/{name}/`.

Error message:
```
HARD STOP: Route group layout violation: {file}
  Expected import from: $lib/layouts/{group}/
  Routes/(group) layouts must compose their shell from lib/layouts/{group}/.
```

**Hook 3: `component-macro-law.sh`**

Every `.svelte` file in `components/` must:
- Import from `style-macro` (resolveMacro)
- Have `data-kind` on root element
- NOT have wrapper elements around semantic root

Error message:
```
HARD STOP: Macro Law violation in {file}
  Missing: {resolveMacro import | data-kind attribute | wrapper detected}
  Every component must follow MACRO-LAW.md. No exceptions.
```

**Hook 4: `no-phantom-architecture.sh`**

Scans comments for references to functions/commands/files that don't exist.

Error message:
```
HARD STOP: Phantom architecture in {file}:{line}
  Comment references "{term}" which does not exist on disk.
  Delete the comment or author the code it describes.
```

**Hook 5: `primitive-no-svelte.sh`**

After Phase 1 cleanup, ensures no `.svelte` files creep back into primitive folders
(except Layout family structural components if owner chose Option B/C).

---

### Task 5.2: Wire Into lefthook.yml

Add all 5 hooks to pre-commit parallel commands.

---

## Phase 6: SurrealDB Enterprise Setup

### Current State

SurrealDB is healthy on :8822. Auth works (`devpulse_engine:dp_sys_2026!`).
All tables are empty. No data seeded.

### Task 6.1: Seed Developer Profile

```sql
-- NS: global, DB: knowledge
CREATE dev_profile SET
  category = 'identity',
  key = 'name',
  value = 'Jessa',
  created_at = time::now();

CREATE dev_profile SET
  category = 'values',
  key = 'core',
  value = 'Transparency, honesty, stern correction, teaching best practices, boring predictable enterprise patterns',
  created_at = time::now();

CREATE dev_profile SET
  category = 'stack',
  key = 'primary',
  value = 'SvelteKit 5 + Svelte 5 runes, Tauri 2, Rust, TypeScript, ColdLight design system',
  created_at = time::now();
```

### Task 6.2: Seed Rejections

Populate from memory files — things the owner has explicitly rejected:

```sql
CREATE rejections SET what = 'melt-ui direct imports', reason = 'ColdLight owns all UI', created_at = time::now();
CREATE rejections SET what = 'ui/ folder', reason = 'ADR-001: 2 layers only, no middle layer', created_at = time::now();
CREATE rejections SET what = 'React patterns in Svelte', reason = 'Svelte 5 runes, attachments, NOT React hooks pattern', created_at = time::now();
CREATE rejections SET what = '.def.json files', reason = 'Deleted, replaced by @defaults annotations', created_at = time::now();
CREATE rejections SET what = 'catalog.ts', reason = 'Deleted, replaced by scanner', created_at = time::now();
CREATE rejections SET what = 'ui-catalog.json', reason = 'Deleted', created_at = time::now();
CREATE rejections SET what = 'intent prop on components', reason = 'MACRO LAW: preset prop only', created_at = time::now();
CREATE rejections SET what = 'StyleMacro.svelte wrapper', reason = 'Deleted 2026-03-27, replaced by resolveMacro()', created_at = time::now();
CREATE rejections SET what = 'useColdLight()', reason = 'Deleted', created_at = time::now();
CREATE rejections SET what = 'Python anywhere', reason = 'Full Rust. No exceptions.', created_at = time::now();
CREATE rejections SET what = 'domain-specific component folders', reason = 'Industry standard: presets + compositions, not ChatButton/DashboardCard', created_at = time::now();
CREATE rejections SET what = 'backwards compatibility shims', reason = 'Pre-release mode. Reauthor correctly.', created_at = time::now();
CREATE rejections SET what = 'hex colors', reason = 'All oklch. No hex, no rgb, no hsl.', created_at = time::now();
CREATE rejections SET what = 'px values', reason = 'All rem. No px.', created_at = time::now();
```

### Task 6.3: Seed Shared Learnings

```sql
CREATE shared_learnings SET
  content = 'Lefthook was silently disconnected via core.hooksPath pointing to nonexistent .git-hooks/. All commits went unchecked.',
  severity = 'critical',
  category = 'tooling',
  created_at = time::now();

CREATE shared_learnings SET
  content = 'Chat system had no Tauri window configured. Frame.svelte comment described multi-window architecture that was never built.',
  severity = 'critical',
  category = 'architecture',
  created_at = time::now();

CREATE shared_learnings SET
  content = '101 of 183 components have no style-macro connection. They compile but render with no token-driven styling.',
  severity = 'critical',
  category = 'design-system',
  created_at = time::now();
```

### Task 6.4: Seed Per-Project Context

```sql
-- NS: project, DB: devpulse
CREATE context SET
  key = 'active_sprint',
  value = 'SPRINT-SYSTEM-ALIGNMENT',
  updated_at = time::now();

CREATE architecture SET
  key = 'macro_law',
  value = '6 immutable laws. resolveMacro() pure resolver. preset prop only. No wrappers. Scoped kinds. No visual context inheritance. Family-split glue CSS. Shared intent resolution.',
  locked = true,
  locked_at = time::now();
```

---

## Phase 7: SD5 Presets — Make Tokens Render

### Current State

SD5 pipeline generates `components.generated.css` with chat vars and token values.
The CSS is imported in the chain. But components don't visually render the presets
because:
1. `resolveMacro()` needs preset data to resolve CSS vars
2. The preset registry may not have entries for all component kinds
3. The glue CSS (`macro-base.css`) needs family-split selectors (Law 5)

### Task 7.1: Audit resolveMacro() Resolver

Read `style-macro/resolve.ts` and verify:
- Does it have preset data for all component kinds?
- Does it return `cssVars` with actual resolved token values?
- Does it return `dataAttrs` with family markers (`data-cl-surface`, etc.)?

### Task 7.2: Audit Glue CSS

Read `generated/macro-base.css` and verify:
- Does it have family-split selectors per Law 5?
- `[data-cl-surface]` → background, border, shadow
- `[data-cl-text]` → color, font-family, font-size
- `[data-cl-frame]` → border-radius, border-width, padding
- `[data-cl-interactive]` → cursor, focus-visible, hover, disabled
- `[data-cl-layout]` → gap
- `[data-cl-overlay]` → backdrop-filter, z-index

### Task 7.3: Wire One Route End-to-End

Pick ONE route (devpulse dashboard) and verify:
1. Component renders with `resolveMacro()` output
2. CSS vars are set on the DOM element
3. Glue CSS paints the visual properties from those vars
4. Token values from SD5 are visible in the rendered output

If this doesn't work, trace the break: is it resolve → cssVars → glue CSS → DOM?

### STOP — Owner Decision Required

**Question**: Which route to verify first? DevPulse dashboard is the most complete.
Chat requires Phase 2 work first.

---

## Execution Order

```
Phase 0 → Kill stale docs + delete rogue .svelte in domains (FIRST)
Phase 1 → Primitives restructured as families
Phase 2 → Chat architecture (domain service, Tauri window, presets, thin route)
Phase 3 → Route audit and cleanup + layouts wired to resolveMacro
Phase 4 → Component alignment (gold standard → chrome tabs → batches)
Phase 5 → Lefthook hard-stops (all hooks including no-svelte-in-domains)
Phase 6 → SurrealDB seeding
Phase 7 → SD5 preset rendering verification → MUST SEE IT IN THE BROWSER
```

Phase 0 is prerequisite for EVERYTHING — stale docs cause drift in every session.
Phases 5 and 6 can run in parallel with anything.
Phases 1 and 2 are prerequisite for Phase 4.
Phase 7 requires Phase 4 Batch 1 minimum.
Phase 7 is NOT done until devpulse dashboard AND chat RENDER VISUALLY.

---

## Rules During Execution

1. **PLAN BEFORE EXECUTE** — this document IS the plan. No deviation without owner approval.
2. **STOP at every STOP marker** — get clarity before continuing.
3. **Edit → check → edit → check** — compile after every file change.
4. **No patching** — author correctly from the ground up.
5. **No bandaid code** — if something doesn't fit, stop and ask.
6. **No actions during rage** — wait for direction.
7. **Svelte 5 runes** — `$state`, `$derived`, `$effect`, attachments. NOT React patterns.
8. **All colors oklch, all sizes rem** — no exceptions.
9. **`.js` extensions** in all TypeScript imports.
10. **`forEach` for Set iteration** — not `for...of`.
