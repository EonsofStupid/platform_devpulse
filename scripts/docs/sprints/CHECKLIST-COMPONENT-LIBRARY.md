# Checklist: Component Library — Generic, Composable, VPB-Ready

## Purpose

Max out the component and block library with consistent generic naming.
Every component must be prop-driven, composable, VPB-scannable, and produce
neuromorphic results from DTCG-aligned style tokens and recipes.

---

## Per-Component Checklist

### Primitive (Layer 1 — Behavior)
- [ ] `primitives/{kind}/{kind}.anatomy.ts` — createAnatomy with all slots
- [ ] `primitives/{kind}/{kind}.types.ts` — per-slot typed attrs, behavioral props, return type
- [ ] `primitives/{kind}/{kind}.a11y.ts` — WAI-ARIA APG reference, keyboard, roles
- [ ] `primitives/{kind}/use-{kind}.svelte.ts` — $state + $derived, ARIA attrs, keyboard handlers
- [ ] `primitives/{kind}/index.ts` — barrel: hook, anatomy, a11y, types ONLY
- [ ] Any .svelte in the primitive folder is headless: semantic element + ARIA, no styling (owner, 2026-10-22)
- [ ] NO .props.ts in primitive folder
- [ ] NO visual concerns

### Component (Layer 2 — The Product)
- [ ] `components/{kind}/schema.ts` — Zod 4, extends _base, z.toJSONSchema() ready
- [ ] `components/{kind}/tokens.ts` — as const DTCG, ALL dimensions in px, references existing tokens
- [ ] `components/{kind}/recipe.ts` — as const named presets (neuro-elevated, glass-deep, flat-minimal, matte-solid minimum)
- [ ] `components/{kind}/{Kind}.svelte` — primitive hook + StyleMacro in ONE file
- [ ] `components/{kind}/index.ts` — barrel: component, schema, tokens, recipes, types
- [ ] Types extend ComponentProps from _base
- [ ] Intent/variant prop maps to style ID string
- [ ] ZERO hardcoded colors, shadows, borders
- [ ] ZERO Tailwind color classes (text-teal-400 etc.)
- [ ] ALL visual via token var() refs or StyleMacro cascade
- [ ] Structural sizing from token dimensions (not hardcoded Tailwind)
- [ ] Generic naming (Button not TealGlassButton)

### Token Quality
- [ ] Token naming: `{kind}.{slot}.{property}.{state}` (e.g., button.root.background.hover)
- [ ] ALL dimensions authored in px — SD5 transforms to rem
- [ ] References use existing primitive tokens ({glass.deep}, {border.strong}, {shadow.z1}, etc.)
- [ ] Shadow tokens reference DTCG shadow type (array for multi-layer)
- [ ] Border tokens reference DTCG border composite (color + width + style)
- [ ] Typography tokens reference DTCG typography composite (family + size + weight + spacing + height)
- [ ] Transition tokens reference DTCG transition composite (duration + delay + easing)

### Recipe Quality (Style Catalog)
- [ ] Minimum 3 recipe families: neuro-elevated, glass-deep, flat-minimal
- [ ] Each recipe is pure token overrides — no CSS, no classes
- [ ] Recipes compose complex visual effects via DTCG references:
  - Multi-layer shadows: `{shadow.z2}` + `{bevel.soft}` + `{glow.teal}` composed
  - Glass: `{glass.deep}` + `{blur.lg}` + `{border.subtle}`
  - Neuromorphic: deep bevel + glow emission + shadow depth
- [ ] Recipes are named generically (not component-specific visual descriptions)
- [ ] SD5 can process as mode-specific token groups

### VPB Readiness
- [ ] Schema declares all props with types VPB can render controls for
- [ ] Schema declares token consumption metadata
- [ ] Tokens are individually addressable (SD5 expand: true)
- [ ] Component emits data-kind + data-slot (VPB can target)
- [ ] Colocated vpb.ts (when needed) declares interaction model ONLY
- [ ] Component code is what VPB generates — indistinguishable from hand-written

### Compile + Build
- [ ] `pnpm ds:tokens:build` — tokens generate, CSS in rem
- [ ] `pnpm svelte-check` — zero errors for this component
- [ ] Token CSS vars exist in styles/components/component.css
- [ ] StyleMacro can resolve the component's style IDs

---

## Component Library Inventory (Generic Names)

### Content
- [ ] Text — paragraph, span, inline text
- [ ] Heading — h1-h6
- [ ] Code — code block, inline code
- [ ] Prose — rich text wrapper
- [ ] Image — responsive image
- [ ] Icon — SVG icon wrapper
- [ ] Divider — horizontal/vertical separator
- [ ] Kbd — keyboard shortcut display

### Layout
- [ ] Card — container with header/body/footer
- [ ] Stack — vertical layout
- [ ] HStack — horizontal layout
- [ ] Box — generic container
- [ ] Grid — CSS grid wrapper
- [ ] List — ordered/unordered list
- [ ] Separator — section divider
- [ ] ScrollArea — scrollable region

### Forms
- [ ] Button — interactive button
- [ ] TextField — text input
- [ ] TextArea — multiline input
- [ ] Checkbox — boolean input
- [ ] Switch — toggle
- [ ] Radio — single selection
- [ ] Select — dropdown
- [ ] Slider — range input
- [ ] DateField — date input
- [ ] ComboBox — autocomplete
- [ ] PinInput — verification code
- [ ] FileUpload — file selection
- [ ] FormField — field wrapper (label + input + error)
- [ ] Form — form container

### Feedback
- [ ] Progress — progress bar
- [ ] Spinner — loading indicator
- [ ] Skeleton — loading placeholder
- [ ] Badge — status indicator
- [ ] Alert — inline message
- [ ] Toast — ephemeral notification
- [ ] Banner — persistent banner

### Navigation
- [ ] Tabs — tabbed navigation
- [ ] Accordion — collapsible sections
- [ ] Nav — navigation list
- [ ] Breadcrumbs — path navigation
- [ ] Pagination — page navigation
- [ ] Steps — step indicator
- [ ] Sidebar — side navigation

### Overlay
- [ ] Dialog — modal dialog
- [ ] Sheet — slide-in panel
- [ ] Popover — positioned popup
- [ ] Tooltip — hover info
- [ ] ContextMenu — right-click menu
- [ ] Menu — dropdown menu
- [ ] AlertDialog — confirmation dialog
- [ ] CommandPalette — search/command

### Data Display
- [ ] Table — data table
- [ ] DataTable — sortable/filterable table
- [ ] Avatar — user avatar
- [ ] AvatarGroup — stacked avatars
- [ ] Stat — metric display
- [ ] DescriptionList — key-value pairs
- [ ] Calendar — date grid
- [ ] TreeView — hierarchical list

### Blocks (VPB Compositions)
- [ ] Widget — generic dashboard widget container
- [ ] RadialGauge — circular metric gauge
- [ ] SparkLine — inline chart
- [ ] Carousel — card carousel
- [ ] Hero — hero section
- [ ] Feature — feature showcase
- [ ] CTA — call-to-action
- [ ] Dashboard — dashboard grid layout

### Interaction Surfaces (A2UI Extensions)
- [ ] Toast (A2UI) — agent notifications
- [ ] Overlay (A2UI) — agent modals
- [ ] ChatPanel (A2UI) — conversational AI
- [ ] InlineSurface (A2UI) — embedded agent UI
- [ ] FloatingPanel (A2UI) — docked agent tools
- [ ] ContextMenu (A2UI) — agent actions
- [ ] StatusBar (A2UI) — operation progress

---

## Style Catalog Requirements

### Recipe Families (minimum)
1. **Neuromorphic** — glass + depth + bevel + glow. The ColdLight signature.
2. **Glass** — translucent surfaces, subtle borders, backdrop blur.
3. **Flat** — opaque, minimal shadow, sharp edges.
4. **Material** — matte surfaces, soft shadows, rounded.
5. **Custom** — user-defined via VPB recipe editor.

### Each Family Provides
- Token overrides for ALL 11 visual axes
- Component-specific recipes (button-neuro-elevated, card-neuro-elevated, etc.)
- Composable — can mix families (neuro button in flat card)
- VPB browseable with visual thumbnails

### Composition Rules
- Recipes NEVER contain CSS — only DTCG token references
- Recipes compose via token override chains
- Multi-layer effects expressed as shadow arrays referencing depth + bevel + glow tokens
- Glass expressed as surface token + blur token + border token
- Every recipe must produce neuromorphic-quality results when the neuro family is active

---

## Build Pipeline

```
tokens.ts (as const, px)
  → collect-component-tokens.ts → component-tokens.json
    → SD5 (expand: true, sizePxToRem) → CSS custom properties (rem)
      → StyleMacro → --cl-* vars on wrapper div
        → glue CSS [data-kind] → browser paints
```

```
schema.ts (Zod 4)
  → z.toJSONSchema() → catalog fragment
    → CLI assembles → catalog.json (A2UI compatible)
      → VPB + A2UIBridge consume
```

---

## Definition of Done

- [ ] Every component in inventory has all checklist items passing
- [ ] Every component has minimum 3 recipe families
- [ ] SD5 builds clean with all component tokens
- [ ] svelte-check passes with zero errors
- [ ] Platform boots and renders all components with token-driven visual
- [ ] VPB can scan, identify, and render quick-edit overlays for every component
- [ ] Style catalog is browseable in VPB with visual previews
- [ ] No hardcoded visual values anywhere in layouts, domains, or components
