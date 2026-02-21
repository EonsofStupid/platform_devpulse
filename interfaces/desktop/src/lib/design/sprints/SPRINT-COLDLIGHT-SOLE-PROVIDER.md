# SPRINT: ColdLight Sole Provider

> **Date**: 2026-02-08
> **Status**: READY FOR EXECUTION
> **Priority**: CRITICAL
> **Research**: `SPRINT-COLDLIGHT-SOLE-PROVIDER.research.md`
> **Principle**: ColdLight is the ONLY source of visual CSS. Recipes drive all styling. No hand-wired classes in layouts.

---

## Architecture

```
tokens.ts (SSOT)
    → ds-tokens-build.ts
    → tokens.css (:root vars + @theme block)
    → Tailwind v4 generates utilities from @theme

molecules/*.css (@utility directives)
    → glass-void, glass-deep, glass-smoke, glass-frost
    → bevel-subtle, bevel-soft, bevel-medium
    → glow-teal, glow-purple, glow-magenta
    → depth-float, depth-raised, depth-elevated, depth-lifted
    → neu-outset, neu-inset, frame-bevel

recipes/*.ts (TypeScript functions)
    → DsSurfaceProps in → per-slot class strings out
    → Classes reference molecule names + Tailwind token utilities
    → Registered via registerRecipe() at app startup

layouts/components
    → Call getRecipe(id).classes(props) for per-slot class strings
    → Apply via class attribute on data-slot elements
    → NEVER hand-write visual CSS
```

---

## Phase 0: DONE — Delete Hand-Written CSS

**9 files deleted this session. ~1,748 lines of bypassing CSS removed.**

- [x] Delete `layouts/app/styles/surfaces.css`
- [x] Delete `layouts/app/styles/depth.css`
- [x] Delete `layouts/chat/styles/surfaces.css`
- [x] Delete `layouts/chat/styles/depth.css`
- [x] Delete `layouts/chat/styles/interactions.css`
- [x] Delete `layouts/common/styles/focus.css`
- [x] Delete `layouts/common/styles/scrollbars.css`
- [x] Delete `layouts/common/styles/keyframes.css`
- [x] Delete `layouts/common/styles/typography.css`
- [x] Fix `layouts/app/styles/index.css` — now only imports `shell.css`

---

## Phase 1: Fix Molecule Shadow Composition

**Goal**: Molecules compose via internal shadow vars. Use `--_shadow-*` prefix (underscore = internal, not a token).

### Task 1.1: Rewrite `design/molecules/glass.css`
- [ ] **READ** `design/molecules/glass.css`
- [ ] Each glass variant sets `--_shadow-glass` with its shadow values
- [ ] Shared formula: `box-shadow: var(--_shadow-glass, 0 0 #0000), var(--_shadow-bevel, 0 0 #0000), var(--_shadow-glow, 0 0 #0000), var(--_shadow-depth, 0 0 #0000);`
- [ ] Keep background, backdrop-filter, border, transition unchanged
- [ ] Keep data-state and data-active reactions

### Task 1.2: Rewrite `design/molecules/bevel.css`
- [ ] **READ** `design/molecules/bevel.css`
- [ ] Each bevel variant sets `--_shadow-bevel` and includes shared formula

### Task 1.3: Rewrite `design/molecules/glow.css`
- [ ] **READ** `design/molecules/glow.css`
- [ ] Each glow variant sets `--_shadow-glow` and includes shared formula

### Task 1.4: Rewrite `design/molecules/depth.css`
- [ ] **READ** `design/molecules/depth.css`
- [ ] Each depth variant sets `--_shadow-depth` and includes shared formula
- [ ] `frame-bevel` sets border + radius + `--_shadow-depth`

---

## Phase 2: Fix Recipe Utils

**Goal**: `surfaceClass()` and other utils return ACTUAL molecule/utility class names.

### Task 2.1: Fix `design/recipes/utils.ts`
- [ ] **READ** `design/recipes/utils.ts`
- [ ] `surfaceClass("glass", "void")` must return `"glass-void"` (not `"bg-glass-void"`)
- [ ] `surfaceClass("glass", "deep")` → `"glass-deep"`
- [ ] `surfaceClass("glass", "smoke")` → `"glass-smoke"`
- [ ] `surfaceClass("glass", "frost")` → `"glass-frost"`
- [ ] `surfaceClass("matte", "dark")` → `"bg-[var(--matte-dark)]"` (Tailwind arbitrary)
- [ ] `depthClass()` map: `{ 0: "", 1: "depth-float", 2: "depth-raised", 3: "depth-elevated", 4: "depth-lifted" }`
- [ ] `glowClass()` map: `{ off: "", teal: "glow-teal", purple: "glow-purple", ... }`
- [ ] Add `bevelClass()`: `{ off: "", subtle: "bevel-subtle", soft: "bevel-soft", medium: "bevel-medium" }`

---

## Phase 3: Create Shell Recipes

**Goal**: Layout shells get recipes, same pattern as panel/dialog/tabs.

### Task 3.1: Create `design/recipes/layouts/shell/shell.app.ts`
- [ ] Create directory `design/recipes/layouts/shell/`
- [ ] Recipe `id: "shell.app.default"`, `kind: "shell"`
- [ ] Slots: `frame`, `topbar`, `sidebar`, `sidebarExpanded`, `content`, `statusbar`
- [ ] `frame`: `cn("frame-bevel", "bg-[var(--color-void-950)]")`
- [ ] `topbar`: `cn("glass-void", "bevel-subtle")`
- [ ] `sidebar`: `cn("glass-deep", "bevel-subtle")`
- [ ] `sidebarExpanded`: `cn("glass-smoke", "bevel-subtle")`
- [ ] `content`: `cn("bg-[var(--surface-primary)]")`
- [ ] `statusbar`: `cn("glass-void")`

### Task 3.2: Create `design/recipes/layouts/shell/shell.chat.ts`
- [ ] Recipe `id: "shell.chat.default"`, `kind: "shell"`
- [ ] Slots: `frame`, `topbar`, `modeSelector`, `dashboard`, `footer`
- [ ] `frame`: `cn("frame-bevel", "bg-[var(--color-void-950)]")`
- [ ] `topbar`: `cn("glass-deep", "bevel-subtle")`
- [ ] `modeSelector`: `cn("glass-deep", "bevel-subtle")`
- [ ] `dashboard`: `cn("bg-[var(--surface-primary)]")`
- [ ] `footer`: `cn("glass-deep")`

### Task 3.3: Create `design/recipes/layouts/shell/index.ts`
- [ ] Barrel that imports both shell recipes (side-effect registration)

---

## Phase 4: Wire Recipe Registration

### Task 4.1: Update `design/components/index.ts`
- [ ] **READ** `design/components/index.ts`
- [ ] Add import for shell recipes: `import "$lib/design/recipes/layouts/shell/index.js";`

### Task 4.2: Wire in root layout
- [ ] **READ** `routes/+layout.svelte`
- [ ] Add: `import "$lib/design/components/index.js";`
- [ ] This one import triggers ALL recipe registrations

---

## Phase 5: Apply Recipes in Layouts

**Goal**: Frame.svelte files call `getRecipe()` and apply per-slot classes. No hand-wired visual CSS.

### Task 5.1: Update `layouts/app/Frame.svelte`
- [ ] **READ** `layouts/app/Frame.svelte`
- [ ] Import: `import { getRecipe } from "$lib/design/recipes/index.js";`
- [ ] Get recipe: `const shell = getRecipe("shell.app.default");`
- [ ] Compute classes: `const slots = $derived(shell?.classes({ accent: "teal", surface: "glass", variant: "void", size: "md", radius: "lg", depth: 2, glow: "off", bevel: "subtle" }) ?? {});`
- [ ] Apply: `class={slots.frame}` on `[data-layout="app"]`
- [ ] Apply: `class={slots.topbar}` on `[data-slot="topbar"]`
- [ ] Apply: `class={isExpanded ? slots.sidebarExpanded : slots.sidebar}` on `[data-slot="sidebar"]`
- [ ] Apply: `class={slots.content}` on `[data-slot="content"]`
- [ ] Apply: `class={slots.statusbar}` on `[data-slot="statusbar"]`

### Task 5.2: Update `layouts/chat/components/shell/Frame.svelte`
- [ ] **READ** `layouts/chat/components/shell/Frame.svelte`
- [ ] Remove `import "../../styles/surfaces.css";` (already deleted)
- [ ] Delete entire `<style>` block
- [ ] Import recipe, get `shell.chat.default`, apply per-slot classes same pattern

---

## Phase 6: Fix Structural CSS (Shell Files)

**Goal**: Shell CSS files contain ONLY grid geometry. Zero visual properties.

### Task 6.1: Clean `layouts/app/styles/shell.css`
- [ ] **READ** `layouts/app/styles/shell.css`
- [ ] Remove `background`, `border`, `border-radius`, `box-shadow` from `[data-layout="app"]` — now delivered by recipe
- [ ] Fix scrollbar raw oklch → `var(--color-teal-*)` token references

### Task 6.2: Clean `layouts/chat/styles/shell.css`
- [ ] **READ** `layouts/chat/styles/shell.css`
- [ ] Replace ALL `--space-*` references are correct
- [ ] Replace ALL `--radius-*` references are correct
- [ ] Replace ALL `--color-teal-*` references are correct
- [ ] Replace `4px` for panel gap
- [ ] Remove oklch fallback values (tokens exist now)

---

## Phase 7: Verify

- [ ] **RUN** `cd interfaces/desktop && pnpm exec svelte-check --threshold error` — 0 errors
- [ ] **GREP** for legacy prefixes in `src/` — 0 matches (prefix eliminated)
- [ ] **GREP** for `background:` or `box-shadow:` in `layouts/` CSS — only in shell.css structural rules
- [ ] **VERIFY** recipe registration: `getRecipe("shell.app.default")` returns a valid recipe at runtime

---

## Execution Rules

1. Each task starts with **READ** the target file
2. Declare the exact change before making it
3. One task at a time, mark complete before moving on
4. Never hand-write visual CSS outside `design/`
5. Shadow composition uses `--_shadow-*` internal vars (underscore prefix)
6. Token prefix is NONE. Unprefixed tokens only. Locked.
