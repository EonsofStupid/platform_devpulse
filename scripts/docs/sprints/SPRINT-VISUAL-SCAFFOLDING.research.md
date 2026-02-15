# Research: ColdLight Visual Scaffolding — Complete Analysis

**Date**: 2026-02-07
**Sprint**: SPRINT-VISUAL-SCAFFOLDING
**Status**: RESEARCH COMPLETE — SPRINT PLAN PENDING

---

## 1. USER VISION (Explicit Demands)

> "Black is NEVER used. NEVER."
> "I was to be using my ColdLight components — the avatar top right, the DevPulse logo, the thick glass bevel and colors from the images."
> "I need to be actually seeing my chat separate window open and the main app open when I run the app."
> "This is means you are properly building up the central design code and correctly applying it to the existing files."
> "ColdLight actually delivering my CSS and on its components etc is the first priority."

### Core Aesthetic Requirements

1. **Never-black palette** — All backgrounds use deep void blues/teals/purples/slate/charcoal (HSL 222 84% 5% or oklch equivalent)
2. **Thick glass bevel** — Steam-like 4px rim, visible neumorphic depth on the frame itself
3. **ColdLight primitives EVERYWHERE** — Avatar top-right, Button/Tooltip in sidebar, Badge in statusbar, Command for search
4. **Lucide SVG icons** — No emoji icons anywhere (lucide-svelte@0.563.0 installed)
5. **Parasite logo** — DevPULSE branding stays in TopBar via the Parasite plugin
6. **Reference image fidelity** — CHAT-REFERENCE-01/02.png, DASHBOARD-REFERENCE-01.png define the target

### Architecture Requirements

1. **Frame border** — The frame itself has a thick bevel glass border (4px rem oklch)
2. **TopBar** — CSS Grid inside, aligned to indicators; persistent across all routes
3. **Content scroll** — Seamlessly scrolls inside the frame; layouts are persistent
4. **Sidebar** — Icon-only OR standard mode; overflows; leverages runes atomic state
5. **Child route overlay** — Click "DevPulse" in sidebar → vertical submenu slides right showing child routes (community, profile, forums) as overlay buttons
6. **Dynamic routes** — Child route buttons auto-generated from filesystem structure (no manual coding)
7. **Chat** — Tauri native child window (separate OS window, true multi-window with IPC)
8. **Fonts** — Hybrid: Orbitron for display/headings + Inter for body text + JetBrains Mono for code
9. **Databases** — Focus on UI first; xtask backend wiring deferred

### User Decisions (2026-02-07)

| Decision | Answer |
|----------|--------|
| Sidebar child-route overlay style | **Vertical submenu** (panel slides right from sidebar) |
| Chat window type | **Tauri native child window** (separate OS window) |
| Database priority | **None yet** — focus on UI first |
| Font stack | **Hybrid**: Orbitron display + Inter body + JetBrains Mono code |

---

## 2. CODEBASE AUDIT — CURRENT STATE

### 2.1 Token System (3-Tier) — COMPLETE

**Tier 1: Global Tokens** (`tokens/tokens.ts` — 288 lines)
- 6 accent hues, 54+ colors, 4 glass variants, 3 matte variants
- 7 text colors, 7 spacing, 6 radius, 5 blur, 7 glow, 5 shadow, 4 bevel
- oklch color model throughout

**Tier 2: Semantic Tokens** (`tokens/semantic.ts` — NEW)
- surface: primary/elevated/overlay/frosted/muted
- border: subtle/soft/emphasis/focus
- depth: flat/raised/panel/overlay/modal
- transition: instant/fast/normal/slow

**Tier 3: Component Tokens** (`tokens/components.ts` — NEW)
- button: bg/bg-hover/border/border-focus
- panel: bg/border/depth
- input: bg/bg-focus/border/border-focus
- badge: bg/border
- dialog: bg/border/depth
- tooltip: bg/border

**Generated Output** (`tokens/tokens.css` — ~240 CSS variables + @theme block)
- Maps to Tailwind v4 utilities via @theme

**Known Issues:**
- `--color-void-base` referenced in glass.css but undefined — needs alias or fix
- `cyber` glow in enum but missing from base tokens object
- `pulse-glow` keyframe defined in app.css, not in tokens

### 2.2 Molecule CSS — MINIMAL

| File | Lines | Status |
|------|-------|--------|
| `molecules/glass.css` | 36 | 3 utilities: glass-void, glass-deep, glass-frost. Missing glass-smoke |
| `molecules/glow.css` | 30 | 3 utilities: glow-teal, glow-accent, glow-track (mouse-following) |
| `molecules/bevel.css` | 11 | 2 utilities: bevel-soft, bevel-medium. Missing subtle/off |

All use Tailwind v4 `@utility` directive. These are the building blocks for visual effects.

### 2.3 Recipe System — SCAFFOLDED

4 recipe kinds registered:
- **Panel**: 4 recipes (glass.void, glass.tint, matte.flat, metal.chrome)
- **Dialog**: 1 recipe (glass.void)
- **Tabs**: 1 recipe (glass.void)
- **Combobox**: 1 recipe (glass.void)

Each recipe returns per-slot CSS class strings via `classes(DsSurfaceProps) → Record<string, string>`.
Classes are applied via `cn()` (clsx + tailwind-merge).

**Missing recipes needed:**
- button.glass — glass button with hover glow
- badge.accent — status badge
- input.glass — inset glass input
- avatar.glass — avatar with rim glow
- sheet.glass — for overlays
- sidebar-submenu.glass — for child route overlay

### 2.4 Primitives — 96+ COMPONENTS ON DISK

All built with the ColdLight contract system:
- `data-kind="button"` / `data-slot="root"` / `data-state="pressed"`
- ARIA via `use:aria` action (MeltUI adapter)
- Class composition via `cn()`
- Runes only (`$props`, `$derived`, `$bindable`)

**Primitives needed by layouts:**
- Avatar, AvatarImage, AvatarFallback
- Badge
- Button, ButtonIcon, ButtonLabel
- Command, CommandInput, CommandItem, CommandList
- Dialog, DialogContent, DialogOverlay, DialogPortal
- DropdownMenu + sub-components
- Input
- ScrollArea
- Separator
- Sheet, SheetContent, SheetOverlay
- Tabs, TabsList, TabsTrigger, TabsContent
- Toggle, ToggleGroup
- Tooltip, TooltipTrigger, TooltipContent

**ALL OF THESE EXIST.** None are used in layouts currently.

### 2.5 Layout Components — RAW HTML, ZERO COLDLIGHT

#### Frame.svelte — PARTIALLY MIGRATED
- CSS Grid structure via data-attribute selectors: DONE
- Imports `./styles/index.css` (shell.css + surfaces.css + depth.css): DONE
- Uses `data-layout="app"`, `data-slot` attributes: DONE
- **Missing**: Thick bevel glass border on the frame itself

#### TopBar.svelte — NEEDS FULL REWRITE
- Uses raw `<button>` with emoji 🔍
- Has `<Parasite />` logo (keep)
- Has inline `track()` pointer function (duplicated)
- Missing: Avatar (top-right), notifications, Lucide icons, ColdLight Button/Tooltip/Command

#### Sidebar.svelte — NEEDS FULL REWRITE
- Uses raw `<a>` elements with emoji icons (🏠🎨🧠📡🔧🎭)
- CSS tooltip hack (`.tooltipWrap`) references deleted layout.css
- 6 nav items: devpulse, ui-demo, overmind, wiredfront, devforge, maestro
- Missing: ColdLight Button/Tooltip primitives, Lucide icons, child route overlay

#### StatusBar.svelte — NEEDS FULL REWRITE
- Hand-rolled badge markup with Tailwind classes
- Hardcoded status values
- Missing: ColdLight Badge primitives, proper data-status attributes

### 2.6 Route Structure

```
routes/
├── +layout.svelte          — Root: imports global CSS
├── +page.svelte            — Redirects to /devpulse
├── +page.server.ts         — redirect(302, "/devpulse")
└── (app)/
    ├── +layout.svelte      — Wraps in <Frame>, includes VPB
    ├── +error.svelte       — Error boundary
    ├── devpulse/
    │   ├── +page.svelte    — DevPulse dashboard
    │   └── community/
    │       └── +page.svelte — Community page
    ├── devforge/+page.svelte
    ├── maestro/+page.svelte
    ├── overmind/+page.svelte
    ├── wiredfront/+page.svelte
    ├── ui-demo/+page.svelte
    └── test-components/+page.svelte
```

**Child routes currently exist only for `/devpulse/community/`.**
Need more child routes per hub for the sidebar submenu to discover dynamically.

### 2.7 Global State

- **VPB Store** (`sys/debug/vpb/state/vpb.svelte.ts`) — Visual Page Builder singleton with Svelte 5 `$state()` runes
- **Feature Flags** (`sys/cfg/flags.ts`) — Boolean toggles for IP protection
- **No global domain/theme state** — `global.svelte.ts` referenced in READMEs but doesn't exist yet
- **Init system** (`sys/init.ts`) — No-op, SvelteKit handles routing

### 2.8 xtask Build Orchestrator

**File:** `xtask/src/main.rs`

Commands: `dev`, `check-all`, `run`, `chat`, `verify`, `check`, `init`, `seed`

Currently orchestrates: Lab Backend (Axum), Lab UI (SvelteKit), Desktop (Tauri).
Uses `xshell`, `clap`, `anyhow`. Handles prereq checks, CMake cache cleaning, service spawning.

**No database service management yet.** Deferred per user decision.

### 2.9 OLD_PROJECTS Reference CSS (401+ lines)

**Critical reference files for the target aesthetic:**

| File | Key Patterns |
|------|-------------|
| `pulseos-tokens.ds.css` | HSL color system, glass blur tiers (6-24px), z-index 10-1080, layout dimensions |
| `pulseos-effect-glass.ds.css` | Glass panels: 70% alpha, 24px blur, saturate(180%), inset highlights, mouse-following radial overlay |
| `pulseos-effect-hero.ds.css` | Deep glass bevel, 3-color cycling (cyan/pink/purple), gold gradient text |
| `scrollbar.ds.css` | Cyan-pink gradient thumb, 20-40px glow, hover scaleY(1.1), ultra variant with 32px blur |
| `tooltip.ds.css` | 95% alpha, 20px blur, structured tooltip with header/stats/attributes |
| `typography.ds.css` | 4-directional text-shadow for depth, liquid gradient animation, drip effects |
| `pulseos-comp-toast.ds.css` | Multi-color gradient bg, 32px blur, toast-enter animation |
| `pulseos-responsive.ds.css` | 3rem min-height buttons, tap-highlight transparent, translateY(-2px) hover |

**Color palette from OLD_PROJECTS:**
```css
--bg-void: rgba(15, 23, 42, 0.97);     /* Never black — dark blue-slate */
--bg-deep: rgba(30, 41, 59, 0.95);     /* Lighter slate */
--color-bg-base: 222 84% 5%;           /* ~#0a0a14 deep void */
--accent-cyan: rgba(65, 240, 219, 1);  /* Primary teal */
--accent-pink: rgba(255, 10, 190, 1);  /* Secondary pink */
--accent-purple: rgba(147, 51, 234, 1); /* Tertiary purple */
```

**Glass panel pattern:**
```css
background: rgba(30, 41, 59, 0.7);
backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(65, 240, 219, 0.15);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.1),
  inset 0 -1px 0 rgba(0, 0, 0, 0.2),
  0 8px 32px rgba(0, 0, 0, 0.3);
```

### 2.10 Chat Layout — 11 STUB FILES

All exist at `layouts/chat/components/`:

| File | Maps To |
|------|---------|
| `shell/Frame.svelte` | **Tauri child window** container |
| `shell/TopBar.svelte` | Tabs for mode switching |
| `shell/LeftSidebar.svelte` | ToggleGroup for modes |
| `shell/ChatDashboard.svelte` | ScrollArea for thread |
| `shell/QuickMenu.svelte` | DropdownMenu/Command |
| `panels/Footer.svelte` | Input/Textarea + Button |
| `panels/ContextPanel.svelte` | Canvas/SVG viz |
| `panels/HistoryPanel.svelte` | ScrollArea + list |
| `panels/StatusBar.svelte` | Badge |
| `overlays/CommandPalette.svelte` | Command primitive |
| `overlays/ModeSelector.svelte` | ToggleGroup/Tabs |

Chat layout also has CSS: shell.css (186 lines), surfaces.css (252 lines), depth.css (132 lines), interactions.css (304 lines).

---

## 3. WEB RESEARCH FINDINGS

### 3.1 Svelte 5 Runes Best Practices

**Sources:**
- [Svelte Docs: $effect](https://svelte.dev/docs/svelte/$effect)
- [Svelte Docs: $derived](https://svelte.dev/docs/svelte/$derived)
- [Mainmatter: Global State in Svelte 5](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/)
- [DEV: $derived vs $effect](https://dev.to/mikehtmlallthethings/understanding-svelte-5-runes-derived-vs-effect-1hh)

**Key rules:**
1. `$derived` > `$effect` — 90% of the time use `$derived`
2. `$effect` is an escape hatch for side effects only
3. No state mutation inside `$derived` (infinite loop)
4. Class-based singletons with `$state()` for global stores (not legacy writable/readable)
5. Direct mutation of arrays/objects works — no reassignment needed

**Application to layouts:**
- Sidebar collapsed/expanded → `$state` in Frame, passed as prop
- Active route detection → `$derived` from `page.url.pathname`
- Child route discovery → `$derived` from `import.meta.glob` result
- Pointer tracking → `$effect` for DOM event cleanup

### 3.2 SvelteKit Dynamic Route Discovery

**Sources:**
- [SvelteKit Routing Docs](https://svelte.dev/docs/kit/routing)
- [Advanced Routing](https://svelte.dev/docs/kit/advanced-routing)
- [Collect All Routes TIL](https://github.com/sophiamersmann/til/blob/main/sveltekit/collect-all-routes.md)
- [GitHub Issue #5793: Programmatically get all routes](https://github.com/sveltejs/kit/issues/5793)

**Approach for dynamic child route buttons:**

```typescript
// Discover child routes at build time via Vite's import.meta.glob
const modules = import.meta.glob('/src/routes/(app)/devpulse/**/+page.svelte');
// Extract route paths from module keys
const childRoutes = Object.keys(modules)
  .map(path => path.replace('/src/routes/(app)', '').replace('/+page.svelte', ''))
  .filter(path => path !== '/devpulse'); // exclude parent
```

This gives us `["/devpulse/community"]` etc. The sidebar submenu reads this to generate buttons.

**Key considerations:**
- `import.meta.glob` is build-time (Vite), not runtime — routes are known at compile
- Group routes `(app)` are invisible in the URL path
- Layout nesting works via `+layout.svelte` at each level
- Rest params `[...slug]` for catch-all patterns

### 3.3 Tailwind CSS v4 @utility and @theme

**Sources:**
- [Tailwind CSS v4 Docs: Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
- [Tailwind CSS v4 Docs: Theme](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [GitHub: Tailwind v4 Utilities Example](https://github.com/mobiwise-dev/tailwind-v4-utilities)

**@utility directive:**
```css
/* Simple utility */
@utility glass-panel {
  background: var(--glass-void);
  backdrop-filter: blur(var(--blur-lg));
}

/* Dynamic utility with argument */
@utility glow-* {
  box-shadow: 0 0 12px color-mix(in oklch, --value(--shadow-glow-*), transparent 60%);
}
```

**@theme block:**
```css
@theme {
  /* These generate Tailwind utility classes automatically */
  --color-glass-void: oklch(...);     /* → bg-glass-void, text-glass-void */
  --shadow-z2: ...;                   /* → shadow-z2 */
  --radius-md: 0.5rem;               /* → rounded-md */
}
```

**Key insight:** Tailwind v4 auto-generates utility classes from @theme CSS variables. The variable name IS the utility name. So `--color-glass-void` in @theme → `bg-glass-void` class.

**This is why recipes were broken:** @theme had `--color-glass-void` but recipes expected `bg-glass-void` — the mapping was correct, the @theme just needed the right variable names.

### 3.4 CSS Glass Morphism + Neumorphism (2025-2026)

**Sources:**
- [Dark Glassmorphism: Defining UI in 2026](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [CSS-Tricks: Apple's Liquid Glass](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [DEV: Recreating Apple's Liquid Glass](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl)
- [Neumorphism.io](https://neumorphism.io/)
- [Glass UI](https://ui.glass)

**Apple Liquid Glass (WWDC 2025) core CSS:**
```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

**Dark glassmorphism best practices:**
- Background: `rgba(30, 41, 59, 0.7)` (blue-slate, NOT black)
- Blur: 12-24px (higher = more frosted, more GPU)
- Saturate: 120-180% (increases vibrancy behind glass)
- Inset highlights: Top `rgba(255,255,255,0.1)`, bottom `rgba(0,0,0,0.2)`
- Border: teal/cyan at 15-30% alpha for accent glow
- Performance: Limit backdrop-filter elements; GPU-intensive

**Neumorphic bevel (thick glass edge):**
```css
.bevel-thick {
  box-shadow:
    inset 2px 2px 4px rgba(255, 255, 255, 0.1),   /* light top-left */
    inset -2px -2px 4px rgba(0, 0, 0, 0.3),         /* dark bottom-right */
    0 4px 16px rgba(0, 0, 0, 0.4);                   /* outer depth */
  border: 4px solid rgba(65, 240, 219, 0.15);         /* thick teal rim */
}
```

**ColdLight application:**
- Frame border → 4px teal-tinted rim with inset bevel shadows
- Panel surfaces → glass-void/deep with backdrop-filter
- Interactive elements → glow on hover, bevel on active
- Scrollbars → cyan-pink gradient with glow (from OLD_PROJECTS)

### 3.5 Tauri 2 Multi-Window

**Sources:**
- [Tauri 2.0 Docs](https://tauri.app)
- [Tauri SQL Plugin](https://v2.tauri.app/plugin/sql/)
- [SurrealDB + Tauri Sidecar](https://github.com/rgeber/sureal-tauri-sidecar)

**Tauri 2 child window approach:**
```rust
// In Rust backend
use tauri::Manager;

app.create_window(
    "chat",
    tauri::WindowUrl::App("chat".into()),
    |window_builder, _| {
        window_builder
            .title("DevPulse Chat")
            .inner_size(400.0, 600.0)
            .decorations(false)  // Custom titlebar
            .transparent(true)   // Glass effect on OS level
            .always_on_top(true) // Float above main
    }
)?;
```

**IPC between windows:**
- Use Tauri events (`emit_to`, `listen`) for cross-window communication
- Both windows share the same Rust backend
- State synchronized via event bus pattern

---

## 4. GAP ANALYSIS

### What EXISTS and WORKS

| Layer | Status | Notes |
|-------|--------|-------|
| Token SSOT (Tier 1) | COMPLETE | 180+ atomic values in oklch |
| Semantic tokens (Tier 2) | COMPLETE | surface/border/depth/transition mappings |
| Component tokens (Tier 3) | COMPLETE | button/panel/input/badge/dialog/tooltip scoped |
| Token build pipeline | COMPLETE | `pnpm ds:tokens:build` generates CSS + types |
| @theme block | COMPLETE | Tailwind v4 utility class generation |
| Primitives | COMPLETE | 96+ Svelte components with contract system |
| Recipe registry | SCAFFOLDED | 4 kinds, classes() functions return per-slot strings |
| Blueprint registry | SCAFFOLDED | 4 kinds, defaults + slot wiring |
| Molecule CSS | MINIMAL | 3 files (glass, glow, bevel), ~77 lines total |
| Frame.svelte grid | MIGRATED | data-layout/data-slot attributes, CSS grid |
| Layout CSS (shell/surfaces/depth) | MIGRATED | Real token references (unprefixed) |
| Lucide SVG icons | INSTALLED | lucide-svelte@0.563.0 |

### What's BROKEN or MISSING

| Gap | Severity | Impact |
|-----|----------|--------|
| TopBar: raw HTML, emoji icon, no Avatar | CRITICAL | Zero ColdLight visual output |
| Sidebar: raw HTML, emoji icons, dead CSS refs | CRITICAL | Zero ColdLight visual output |
| StatusBar: raw HTML, no Badge primitive | CRITICAL | Zero ColdLight visual output |
| Frame: no thick bevel border | HIGH | Doesn't match reference aesthetic |
| No global domain state singleton | HIGH | Sidebar can't track active domain |
| No child route overlay submenu | HIGH | Key navigation pattern missing |
| No Orbitron font loaded | MEDIUM | Display headings not matching vision |
| glass.css missing glass-smoke | MEDIUM | Molecule incomplete |
| bevel.css missing subtle/off | MEDIUM | Molecule incomplete |
| `--color-void-base` undefined | MEDIUM | glass.css references nonexistent token |
| No button/badge/avatar/sheet recipes | MEDIUM | Primitives exist but unstyled |
| Chat layout: all stubs | DEFERRED | 11 files, all empty/minimal |
| Tauri child window for chat | DEFERRED | Requires Rust + IPC work |
| xtask database services | DEFERRED | Focus UI first per user decision |

---

## 5. ARCHITECTURE DECISIONS

### 5.1 Global Domain State

The READMEs reference `global.svelte.ts` but it doesn't exist. We need a minimal singleton:

```typescript
// sys/runes/global.svelte.ts
class GlobalState {
  current_domain = $state<string>("devpulse");
  sidebar_mode = $state<"collapsed" | "expanded">("collapsed");
  sidebar_submenu = $state<string | null>(null); // which hub's submenu is open

  setDomain(domain: string): void { this.current_domain = domain; }
  toggleSidebar(): void {
    this.sidebar_mode = this.sidebar_mode === "collapsed" ? "expanded" : "collapsed";
  }
  openSubmenu(hub: string): void {
    this.sidebar_submenu = this.sidebar_submenu === hub ? null : hub;
  }
}

export const global = new GlobalState();
```

### 5.2 Dynamic Child Route Discovery

Use `import.meta.glob` at build time to discover child routes per hub:

```typescript
// lib/sys/routing/child-routes.ts
const allPages = import.meta.glob('/src/routes/(app)/**/+page.svelte', { eager: false });

export function getChildRoutes(parentPath: string): { path: string; label: string }[] {
  return Object.keys(allPages)
    .map(key => key.replace('/src/routes/(app)', '').replace('/+page.svelte', ''))
    .filter(path => path.startsWith(parentPath + '/') && path.split('/').length === parentPath.split('/').length + 1)
    .map(path => ({
      path,
      label: path.split('/').pop()!.replace(/-/g, ' '),
    }));
}
```

Sidebar calls `getChildRoutes("/devpulse")` → gets `[{ path: "/devpulse/community", label: "community" }]`.

### 5.3 Sidebar Submenu Pattern

When user clicks a hub icon in the sidebar:
1. `global.openSubmenu("devpulse")` toggles the submenu state
2. A glass panel slides right from the sidebar (vertical submenu)
3. Panel contains ColdLight Button primitives for each child route
4. Buttons are generated from `getChildRoutes()` — **not hardcoded**
5. Clicking a child route navigates and closes submenu
6. Panel uses ColdLight Sheet or custom overlay with glass surface

### 5.4 Frame Thick Bevel

The Frame gets a visible thick glass border:
```css
[data-layout="app"] {
  border: 4px solid oklch(from var(--color-teal-700) l c h / 0.25);
  border-radius: var(--radius-lg);
  box-shadow:
    inset 2px 2px 4px oklch(80% 0.06 195 / 0.15),    /* light top-left bevel */
    inset -2px -2px 4px oklch(5% 0.02 280 / 0.4),     /* dark bottom-right bevel */
    0 0 40px oklch(55% 0.15 195 / 0.1),                /* outer teal glow */
    0 8px 32px oklch(2% 0.01 280 / 0.5);               /* depth shadow */
}
```

### 5.5 Font Stack Update

```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap');

/* Hybrid stack */
--font-display: 'Orbitron', system-ui, sans-serif;  /* Headings, logo, display */
--font-sans: 'Inter', system-ui, sans-serif;         /* Body text */
--font-mono: 'JetBrains Mono', monospace;            /* Code */
```

### 5.6 ColdLight CSS Delivery Chain

```
tokens.ts (SSOT)
    ↓ pnpm ds:tokens:build
tokens.css (CSS custom properties + @theme)
    ↓ imported by app.css
Tailwind v4 generates utility classes from @theme
    ↓
molecules/*.css (@utility definitions using tokens)
    ↓ imported by design/index.css
layouts/app/styles/*.css (structural CSS using tokens)
    ↓ imported by Frame.svelte
recipes/*.ts classes() functions → Tailwind class strings
    ↓ applied via cn() at component level
Primitives render with data-kind/data-slot/data-state + class
```

**This chain must be unbroken.** Every CSS value traces back to tokens.ts.

---

## 6. WHAT NEEDS TO HAPPEN (Ordered)

### Phase A: ColdLight CSS Foundation (IMMEDIATE)

1. **Fix `--color-void-base`** — Add alias in tokens.ts or fix glass.css reference
2. **Complete molecule set** — Add glass-smoke to glass.css, add bevel-subtle to bevel.css
3. **Add Frame bevel** — Thick 4px glass border with neumorphic inset shadows
4. **Add Orbitron font** — Import in app.css, add `--font-display` token
5. **Add missing recipes** — button.glass, badge.accent, avatar.glass (minimal, just enough for layouts)

### Phase B: App Shell with ColdLight Primitives (IMMEDIATE)

1. **Create `global.svelte.ts`** — Domain state singleton
2. **Create `child-routes.ts`** — Dynamic route discovery utility
3. **Rewrite TopBar.svelte** — Parasite logo, Lucide icons, ColdLight Button/Tooltip, Avatar top-right
4. **Rewrite Sidebar.svelte** — ColdLight Button/Tooltip, Lucide icons, child route submenu overlay
5. **Rewrite StatusBar.svelte** — ColdLight Badge primitives, data-status attributes
6. **Update Frame.svelte** — Add thick bevel border, verify grid
7. **Create `index.ts`** — Barrel exports
8. **Delete duplicates** — `components/shell/`, `AppLayout.svelte`

### Phase C: Verify + Polish (IMMEDIATE)

1. **`pnpm dev`** — App renders with glass aesthetic, no black, ColdLight components visible
2. **`svelte-check`** — Zero type errors
3. **Visual audit** — Compare to DASHBOARD-REFERENCE-01.png
4. **Scrollbar styling** — Apply token-based scrollbar CSS (from OLD_PROJECTS reference)

### Phase D: Chat System (NEXT SPRINT)

1. **Tauri Rust** — Create child window command
2. **Chat route** — `/chat` route rendered in child window
3. **Chat frame** — Glass overlay with mode tabs
4. **Chat components** — Wire 11 stubs using ColdLight primitives

### Phase E: Future Sprints

1. Variant key system (CSS + TypeScript + schema)
2. SVG depth/bevel filters
3. Recipe expansion (20+ recipes)
4. Dashboard scaffold with Gauge, Sparkline, Panel compositions
5. CSS audit enforcement (lefthook pre-commit)
6. xtask database services

---

## 7. COMPONENT REWRITES — SPECIFICATION

### TopBar.svelte

```
┌─────────────────────────────────────────────────────────┐
│ [DevPULSE logo]  ──── spacer ────  [🔍] [🔔] [🔗] [👤] │
│  Parasite                          Btn  Btn  Btn Avatar │
└─────────────────────────────────────────────────────────┘
```

**Imports:** Parasite, Button, Tooltip, TooltipTrigger, TooltipContent, Avatar, AvatarImage, AvatarFallback
**Lucide icons:** Search, Bell, Link
**State:** `searchOpen: $state(false)`
**Search:** Command primitive (Cmd+K accessible pattern)

### Sidebar.svelte

```
┌────────┐
│  [🏠]  │  ← Button + Tooltip
│  [🎨]  │
│  [🧠]  │
│  [📡]  │
│  [🔧]  │
│  [✨]  │
│        │
│  [↔]   │  ← Toggle expand/collapse
└────────┘

Expanded + Submenu open:
┌────────┬──────────────┐
│  [🏠]  │ ◆ Dashboard  │  ← Vertical submenu panel
│  [🎨]  │ ◆ Community  │     with child route buttons
│  [🧠]  │ ◆ Profile    │     auto-discovered
│  ...   │              │
│        ├──────────────┘
```

**Imports:** Button, Tooltip, TooltipTrigger, TooltipContent
**Lucide icons:** Home, Palette, Brain, Radio, Wrench, Sparkles, ChevronsLeftRight
**State:** Uses `global.sidebar_submenu` for submenu, `global.sidebar_mode` for collapse
**Nav items:** Hub definitions with id, icon component, label, href, hotkey
**Submenu:** Glass panel slides right, buttons from `getChildRoutes(hub.href)`

### StatusBar.svelte

```
┌───────────────────────────────────────────────┐
│ [● online]        Uptime: 12d 4h        v0.1.0 │
│  Badge                Badge              Badge  │
└───────────────────────────────────────────────┘
```

**Imports:** Badge
**State:** Receives status via props (or future event bus)
**Data attributes:** `data-status="online|offline|hybrid"` on container

---

## 8. REFERENCE FILES

### Token System
- `interfaces/desktop/src/lib/design/tokens/tokens.ts` — Tier 1 SSOT
- `interfaces/desktop/src/lib/design/tokens/semantic.ts` — Tier 2
- `interfaces/desktop/src/lib/design/tokens/components.ts` — Tier 3
- `interfaces/desktop/src/lib/design/tokens/tokens.css` — Generated
- `interfaces/desktop/src/lib/design/tokens/schema.ts` — Zod validators
- `interfaces/desktop/scripts/dev/design/ds-tokens-build.ts` — Build script

### CSS
- `interfaces/desktop/src/app.css` — Global entry
- `interfaces/desktop/src/lib/design/index.css` — Design system CSS entry
- `interfaces/desktop/src/lib/design/molecules/glass.css`
- `interfaces/desktop/src/lib/design/molecules/glow.css`
- `interfaces/desktop/src/lib/design/molecules/bevel.css`
- `interfaces/desktop/src/lib/layouts/app/styles/shell.css`
- `interfaces/desktop/src/lib/layouts/app/styles/surfaces.css`
- `interfaces/desktop/src/lib/layouts/app/styles/depth.css`

### Layouts
- `interfaces/desktop/src/lib/layouts/app/Frame.svelte`
- `interfaces/desktop/src/lib/layouts/app/TopBar.svelte`
- `interfaces/desktop/src/lib/layouts/app/Sidebar.svelte`
- `interfaces/desktop/src/lib/layouts/app/StatusBar.svelte`

### Primitives (needed by layouts)
- `interfaces/desktop/src/lib/design/primitives/avatar/`
- `interfaces/desktop/src/lib/design/primitives/badge/`
- `interfaces/desktop/src/lib/design/primitives/button/`
- `interfaces/desktop/src/lib/design/primitives/tooltip/`
- `interfaces/desktop/src/lib/design/primitives/command/`

### Reference Images
- `interfaces/desktop/src/lib/design/REFERENCES/CHAT-REFERENCE-01.png`
- `interfaces/desktop/src/lib/design/REFERENCES/CHAT-REFERENCE-02.png`
- `interfaces/desktop/src/lib/design/REFERENCES/DASHBOARD-REFERENCE-01.png`

### OLD_PROJECTS CSS
- `OLD_PROJECTS_CSS_TSX/pulseos-tokens.ds.css`
- `OLD_PROJECTS_CSS_TSX/pulseos-effect-glass.ds.css`
- `OLD_PROJECTS_CSS_TSX/pulseos-effect-hero.ds.css`
- `OLD_PROJECTS_CSS_TSX/scrollbar.ds.css`
- `OLD_PROJECTS_CSS_TSX/tooltip.ds.css`
- `OLD_PROJECTS_CSS_TSX/typography.ds.css`
