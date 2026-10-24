# Research: ColdLight Sole Provider

**Date**: 2026-02-08
**Sprint**: SPRINT-COLDLIGHT-SOLE-PROVIDER
**Status**: COMPLETE

---

## Question/Goal

How should ColdLight deliver ALL visual CSS centrally, so layouts and components never hand-write visual styles? Research real-world design system patterns and map them to what ColdLight already has.

---

## Reference Image Analysis

### Visual DNA (from 3 reference images)

1. **Base**: Deep void-blue (`oklch(6% 0.02 195)`) — never black
2. **Panels**: Glass surfaces with 1px teal-tinted borders, backdrop blur, subtle inner bevel highlights
3. **Frame bevel**: Thick 3-4px teal border on outer shell with multi-layer shadow (ambient + key + contact)
4. **Active states**: Teal glow halo (`0 0 12px`) on active buttons/tabs
5. **Depth**: Neumorphic light/shadow pairing on raised elements
6. **Text**: White/teal primary, muted gray secondary, teal glow on headings
7. **Accents**: Teal (primary), Purple (planning), Magenta (image), Ember (alerts)
8. **Interactions**: Hover = brighter border + subtle glow; Active = teal rim + glow

---

## External Research

### Pattern 1: Panda CSS Presets
**Source**: [panda-css.com/docs/guides/component-library](https://panda-css.com/docs/guides/component-library)

A design system ships as a **preset** containing tokens + recipes. Apps import the preset and components get styled automatically. Recipe = `{ base, variants, compoundVariants, defaultVariants }`. Props in → classes out. No manual class wiring.

### Pattern 2: Shadcn/ui + Tailwind v4 data-slot
**Source**: [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)

Every primitive gets a `data-slot` attribute. CSS targets `[data-slot="trigger"]` etc. `@theme inline` registers tokens with Tailwind. OKLCH colors. No hidden abstractions — "the code you'd write yourself."

### Pattern 3: Radix Themes
**Source**: [radix-ui.com/themes/docs/overview/styling](https://www.radix-ui.com/themes/docs/overview/styling)

Ships `tokens.css`, `components.css`, `utilities.css`. Wrapping in `<Theme>` provides token access. Components come pre-styled. Customization via props + theme config, not CSS overrides.

### Pattern 4: data-slot Automatic Styling
**Source**: [flareapp.io/blog/automating-styles-with-data-slot](https://flareapp.io/blog/automating-styles-with-data-slot)

CSS selectors like `[data-slot="icon"]` enable automatic parent-aware styling via `:has()`. Eliminates prop explosion. Style logic lives in CSS, not JS.

### Key Takeaway

**All four patterns converge on the same architecture:**
1. Tokens define raw values (SSOT)
2. Semantic tokens map values to roles
3. Recipes define per-slot class strings for each component kind
4. A registry/preset bundles everything
5. Components declare what they ARE (via data attributes) — the design system decides how they LOOK

---

## ColdLight Codebase Analysis

### What Already Exists (and works)

| Layer | Status | Files |
|-------|--------|-------|
| **Token SSOT** | ✅ Working | `tokens/tokens.ts` → `ds-tokens-build.ts` → `tokens.css` (`:root` + `@theme`) |
| **Token Types** | ✅ Generated | `tokens/types.ts` — `AccentToken`, `GlowToken`, `SurfaceToken`, etc. |
| **Recipe System** | ✅ Exists, unwired | `recipes/index.ts` — `registerRecipe()` + `getRecipe()` + `getRecipesForKind()` |
| **Recipe Definitions** | ✅ 7 recipes exist | Panel (4 variants), Dialog, Combobox, Tabs |
| **Recipe Utils** | ✅ Working | `recipes/utils.ts` — `surfaceClass()`, `radiusClass()`, `depthClass()`, `glowClass()` |
| **DsSurfaceProps** | ✅ Typed | `{ accent, surface, variant, size, radius, depth, glow, bevel }` |
| **Blueprints** | ✅ Exist | Per-component slot/aria contracts |
| **Component Schema** | ✅ Advanced | Zod-validated ARIA enforcement, slot contracts, keyboard maps |
| **Primitives** | ✅ 20+ exist | Unstyled, accessible, `data-slot`/`data-kind` attributes |
| **Molecules (CSS)** | ⚠️ Partially working | `glass.css`, `glow.css`, `bevel.css`, `depth.css` — `@utility` classes |
| **Recipe Registration** | ❌ Never wired | `components/index.ts` has imports but is never imported at app root |

### What's Broken

1. **Recipe registration never runs** — `components/index.ts` (the barrel that triggers `registerRecipe()`) is never imported in the app's root layout
2. **Recipes reference classes that don't exist** — e.g. `surfaceClass("glass", "void")` returns `bg-glass-void` but no Tailwind utility `bg-glass-void` is defined; molecules define `glass-void` (no `bg-` prefix)
3. **Molecule classes reference nonexistent tokens** — `glass-smoke` uses `var(--glass-smoke)` but this may not be in `@theme`
4. **No layout recipes** — only component recipes exist (panel, dialog, combobox, tabs). No recipes for layout slots (topbar, sidebar, statusbar, content)
5. **Molecule shadow composition was broken** — glass/bevel/glow all set `box-shadow` independently. Shadow layering vars were added this session. Prefix eliminated; use `--_shadow-*` internal vars

### Recipe Architecture (how it SHOULD flow)

```
DsSurfaceProps { accent, surface, variant, size, radius, depth, glow, bevel }
         │
         ▼
   RecipeDefinition.classes(props) → { root: "...", header: "...", body: "...", footer: "..." }
         │
         ▼
   Component receives per-slot class strings via recipe lookup
         │
         ▼
   Tailwind v4 resolves classes → @utility molecules + token-backed utilities → CSS
```

### Recipe Example (existing panel.default.ts)

```typescript
registerRecipe({
    id: "panel.glass.void",
    kind: "panel",
    classes: (props) => ({
        root: cn(surfaceClass("glass", "void"), radiusClass(props.radius), "border border-white/8"),
        header: cn("px-4 py-3", "border-b border-white/6", "text-sm font-medium text-white/90"),
        body: cn("px-4 py-3", "flex-1", "overflow-auto", "text-white/80"),
        footer: cn("px-4 py-3", "border-t border-white/6"),
    }),
});
```

**Problem**: `surfaceClass("glass", "void")` returns `"bg-glass-void"`. There's no Tailwind utility `bg-glass-void`. The molecule is `glass-void` (a `@utility` that sets background, backdrop-filter, border, box-shadow all at once).

---

## Findings

### 1. The recipe system is the RIGHT architecture — it just needs fixing

ColdLight's recipe system already matches the Panda CSS/Shadcn pattern:
- Typed tokens → recipe functions → per-slot class strings
- Registration system with kind-based lookup
- DsSurfaceProps is the variant API

### 2. Recipes must use molecule class names, not fabricated Tailwind utilities

`surfaceClass()` must return actual molecule names (`glass-void`, `glass-deep`) not fake Tailwind classes (`bg-glass-void`).

### 3. Shadow composition needs a shared formula WITHOUT custom prefix

Tailwind's own pattern: `--tw-shadow`, `--tw-ring-shadow`. These are framework-internal vars, not tokens. ColdLight should use the same convention but with NO prefix per the user's locked rule. Use `_` prefix for internal vars: `--_shadow-glass`, `--_shadow-bevel`, `--_shadow-glow`, `--_shadow-depth`.

### 4. Layout slots need recipes too

Create recipes for `kind: "shell"` with slots: `frame`, `topbar`, `sidebar`, `content`, `statusbar`. The app layout Frame.svelte calls `getRecipe("shell.app.default")` and applies per-slot classes. Same for chat shell.

### 5. Wire recipe registration at app root

One import in `+layout.svelte`: `import "#coldlight/components/index.js"` triggers all recipe registrations.

---

## Recommendations

### Architecture: Recipe-Driven, Molecule-Backed

```
tokens.ts (SSOT) → tokens.css (@theme) → Tailwind v4 utilities
                                        ↓
molecules/*.css (@utility) → glass-void, bevel-subtle, glow-teal, depth-raised
                                        ↓
recipes/*.ts → DsSurfaceProps → per-slot class strings using molecule names + Tailwind utilities
                                        ↓
components/layouts → getRecipe(id).classes(props) → applied via data-slot elements
```

### Sprint Phases

1. **Fix `surfaceClass()` and recipe utils** — return actual molecule names
2. **Fix molecule shadow composition** — use `--_shadow-*` internal vars (underscore prefix, unprefixed tokens only)
3. **Create shell recipes** — `shell.app.default`, `shell.chat.default`
4. **Wire recipe registration** — one-line import in root layout
5. **Apply recipes in Frame.svelte** — call `getRecipe()`, spread per-slot classes
6. **Verify** — compile, audit for zero hand-written CSS outside design/

---

## Files Referenced

- `design/recipes/index.ts` — recipe registry (registerRecipe, getRecipe)
- `design/recipes/types.ts` — DsSurfaceProps, RecipeDefinition
- `design/recipes/utils.ts` — surfaceClass, radiusClass, depthClass, glowClass (BROKEN: wrong class names)
- `design/recipes/components/panel/panel.default.ts` — example recipe using molecule names
- `design/components/index.ts` — barrel that triggers registration (NEVER IMPORTED)
- `design/components/schema.ts` — Zod-based ARIA enforcement per slot
- `design/tokens/types.ts` — auto-generated token types
- `design/tokens/tokens.css` — auto-generated CSS vars + @theme
- `design/molecules/glass.css` — glass @utility definitions
- `design/molecules/bevel.css` — bevel @utility definitions
- `design/molecules/glow.css` — glow @utility definitions
- `design/molecules/depth.css` — depth @utility definitions (new this session)
- `design/index.css` — CSS entry point importing molecules
- `layouts/app/Frame.svelte` — app shell (needs recipe application)
- `layouts/app/styles/shell.css` — structural grid CSS (KEEP, fix raw oklch)
- `layouts/chat/styles/shell.css` — chat grid CSS (KEEP, fix to unprefixed tokens)
- `layouts/chat/components/shell/Frame.svelte` — chat shell (needs recipe application)
