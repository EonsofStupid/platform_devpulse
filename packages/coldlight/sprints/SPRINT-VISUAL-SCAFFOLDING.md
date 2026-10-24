# SPRINT: Visual Scaffolding — ColdLight Delivers

**Date**: 2026-02-07
**Status**: READY FOR EXECUTION
**Research**: [SPRINT-VISUAL-SCAFFOLDING.research.md](./SPRINT-VISUAL-SCAFFOLDING.research.md)
**Priority**: CRITICAL — First sprint producing visible ColdLight output

---

## Objective

When `pnpm dev` runs, the app shows:
1. **Main window** — Deep void-blue frame with thick glass bevel, ColdLight-styled TopBar/Sidebar/StatusBar, Lucide icons, Orbitron headings
2. **Chat window** — Separate Tauri OS window with glass-styled chat shell skeleton

Every visual element uses ColdLight primitives, tokens, and molecules. No emoji. No black. No raw HTML where a primitive exists.

---

## Prerequisites (VERIFIED)

- [x] Token system complete (Tier 1/2/3 + tokens.css + @theme)
- [x] 96+ primitives on disk with data-kind/data-slot/data-state contracts
- [x] Recipe registry scaffolded (panel, dialog, tabs, combobox)
- [x] Molecule CSS exists (glass.css, glow.css, bevel.css)
- [x] Layout CSS migrated to tokens (shell.css, surfaces.css, depth.css)
- [x] Lucide-svelte@0.563.0 installed
- [x] Inter + JetBrains Mono fonts loaded via @fontsource
- [x] Tauri config has both `main` and `chat` windows defined
- [x] Alpha has working window management Rust commands

---

## Phase A: ColdLight CSS Foundation

### A1: Fix `--color-void-base` token

`molecules/glass.css` references `var(--color-void-base)` which doesn't exist in tokens.css.

- [ ] Add `--color-void-base` alias to tokens.ts → maps to `color.void[950]`
- [ ] Rebuild tokens: `pnpm ds:tokens:build`
- [ ] Verify glass.css `glass-void` utility resolves correctly

**Files:**
- `design/tokens/tokens.ts` — add `voidBase` to color export
- `scripts/dev/design/ds-tokens-build.ts` — ensure it emits `--color-void-base`

### A2: Complete molecule CSS

- [ ] Add `glass-smoke` utility to `molecules/glass.css`
- [ ] Add `bevel-subtle` utility to `molecules/bevel.css`
- [ ] Add `glow-purple` and `glow-magenta` utilities to `molecules/glow.css`

**glass-smoke spec:**
```css
@utility glass-smoke {
  background: var(--glass-smoke);
  backdrop-filter: blur(var(--blur-md)) saturate(1.1);
  border: 1px solid color-mix(in oklch, white, transparent 95%);
}
```

### A3: Frame thick glass bevel

Add the signature 4px bevel border to the app frame.

- [ ] Add `[data-layout="app"]` bevel rules to `shell.css`

**Spec (uses existing depth.css variables):**
```css
[data-layout="app"] {
  border: 4px solid oklch(0.40 0.13 180 / 0.25);
  border-radius: var(--radius-lg);
  box-shadow:
    inset 2px 2px 4px oklch(0.80 0.06 195 / 0.15),
    inset -2px -2px 4px oklch(0.05 0.02 280 / 0.4),
    0 0 40px oklch(0.55 0.15 195 / 0.1),
    0 8px 32px oklch(0.02 0.01 280 / 0.5);
}
```

### A4: Load Orbitron font

- [ ] Install: `pnpm add @fontsource/orbitron`
- [ ] Add imports to `app.css`: `@import "@fontsource/orbitron/400.css"` etc.
- [ ] Add `--font-display` to tokens.ts and tokens.css
- [ ] Update body CSS to use `--font-sans` for Inter, headings use `--font-display`

**Token additions:**
```typescript
export const fontFamily = {
  display: "'Orbitron', system-ui, sans-serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;
```

### A5: Verify Phase A compiles

- [ ] `pnpm ds:tokens:build` succeeds
- [ ] `pnpm svelte-check` — zero errors
- [ ] `pnpm dev` — app renders, frame has visible bevel border

---

## Phase B: App Shell with ColdLight Primitives

### B1: Create global domain state

- [ ] Create `$lib/sys/runes/global.svelte.ts`

**Spec:**
```typescript
class GlobalState {
  current_domain = $state<string>("devpulse");
  sidebar_mode = $state<"collapsed" | "expanded">("collapsed");
  sidebar_submenu = $state<string | null>(null);

  setDomain(domain: string): void { this.current_domain = domain; }
  toggleSidebar(): void {
    this.sidebar_mode = this.sidebar_mode === "collapsed" ? "expanded" : "collapsed";
  }
  openSubmenu(hub: string): void {
    this.sidebar_submenu = this.sidebar_submenu === hub ? null : hub;
  }
  closeSubmenu(): void { this.sidebar_submenu = null; }
}

export const globalState = new GlobalState();
```

### B2: Create child route discovery utility

- [ ] Create `$lib/sys/routing/child-routes.ts`

**Spec:**
```typescript
const allPages = import.meta.glob('/src/routes/(app)/**/+page.svelte', { eager: false });

export function getChildRoutes(parentPath: string): { path: string; label: string }[] {
  return Object.keys(allPages)
    .map(key => key.replace('/src/routes/(app)', '').replace('/+page.svelte', ''))
    .filter(path => path.startsWith(parentPath + '/') && path !== parentPath)
    .filter(path => {
      const relative = path.slice(parentPath.length + 1);
      return !relative.includes('/');
    })
    .map(path => ({
      path,
      label: path.split('/').pop()!.replace(/-/g, ' '),
    }));
}
```

### B3: Rewrite TopBar.svelte

Replace raw HTML with ColdLight primitives.

- [ ] Keep `<Parasite />` logo (left)
- [ ] Replace 🔍 emoji with Lucide `Search` icon
- [ ] Add Lucide `Bell` icon button
- [ ] Add `Avatar` + `AvatarFallback` (top-right)
- [ ] All buttons wrapped in `Tooltip` / `TooltipTrigger` / `TooltipContent`
- [ ] All buttons use `Button` / `ButtonIcon` primitives with `data-kind="button"`
- [ ] Apply `font-family: var(--font-display)` to Parasite area
- [ ] Remove inline `track()` (handled by CSS `glow-track` molecule or surfaces.css)

**Imports needed:**
```
Button, ButtonIcon from primitives/button
Tooltip, TooltipTrigger, TooltipContent from primitives/tooltip
Avatar, AvatarFallback from primitives/avatar
Search, Bell from lucide-svelte
Parasite from design/plugins/parasite
```

### B4: Rewrite Sidebar.svelte

Replace raw HTML with ColdLight primitives + child route submenu.

- [ ] Replace emoji icons with Lucide components:
  - devpulse → `Home`
  - ui-demo → `Palette`
  - overmind → `Brain`
  - wiredfront → `Radio`
  - devforge → `Wrench`
  - clyffy → `Sparkles`
  - expand/collapse → `PanelLeftOpen` / `PanelLeftClose`
- [ ] Each nav item: `Tooltip` > `TooltipTrigger` > `Button` + `ButtonIcon`
- [ ] Active state via `aria-current="page"` (surfaces.css already styles this)
- [ ] Import `globalState` for `sidebar_submenu` tracking
- [ ] Import `getChildRoutes` for dynamic submenu buttons
- [ ] Child route submenu: glass panel that slides right when `globalState.sidebar_submenu === hub.id`
- [ ] Submenu panel: `data-slot="submenu"` with glass-deep background
- [ ] Submenu buttons: ColdLight `Button` primitives generated from `getChildRoutes(hub.href)`
- [ ] Click outside submenu or navigate → `globalState.closeSubmenu()`
- [ ] Remove `track()` function (surfaces.css handles hover)
- [ ] Remove `animations` array and `triggerAnim` (not needed with ColdLight transitions)

### B5: Rewrite StatusBar.svelte

Replace hand-rolled badges with ColdLight Badge primitive.

- [ ] Connection indicator: `Badge` with `data-status` attribute
- [ ] Uptime display: `Badge`
- [ ] Version display: `Badge`
- [ ] Dot indicator: CSS `::before` pseudo with glow, colored by `data-status`
- [ ] StatusBar container: `data-slot="statusbar"` (already set by Frame)

### B6: Update Frame.svelte

- [ ] Import `globalState` for sidebar mode binding
- [ ] Wire `data-sidebar` to `globalState.sidebar_mode`
- [ ] Wire `data-route` to `globalState.current_domain`
- [ ] Sidebar expand/collapse driven by `globalState` instead of local state
- [ ] Content area uses `text-[var(--text-primary)]` for base text color

### B7: Add submenu CSS to surfaces.css

- [ ] Add `[data-slot="submenu"]` rules:
  - Position: absolute, left of sidebar width, top 0, height 100%
  - Background: `var(--glass-deep)`
  - Backdrop-filter: `blur(var(--blur-lg))`
  - Border: `1px solid var(--border-subtle))`
  - Shadow: `var(--depth-elevated-multi)`
  - Transform: `translateX(-100%)` → `translateX(0)` on open
  - Transition: `transform var(--duration-normal) var(--ease-spring)`

### B8: Verify Phase B compiles

- [ ] `pnpm svelte-check` — zero errors
- [ ] `pnpm dev` — all layout components render with ColdLight styling
- [ ] No emoji visible anywhere in the shell
- [ ] Sidebar submenu appears when clicking hub with child routes
- [ ] Avatar renders in TopBar top-right

---

## Phase C: Dual-Window Chat Setup

### C1: Port window commands to current desktop

- [ ] Create `src-tauri/src/commands/window/mod.rs`
- [ ] Port from alpha: `open_chat_window`, `close_window`, `focus_window`
- [ ] Adapt to use SvelteKit route `/chat` instead of `chat.html`
- [ ] Add `decorations(false)` + `transparent(true)` + `always_on_top(true)` to chat window builder
- [ ] Register `window` module in `commands/mod.rs`
- [ ] Register commands in `lib.rs` invoke_handler

**Spec (from alpha, adapted):**
```rust
pub mod window;

// In lib.rs invoke_handler:
commands::window::open_chat_window,
commands::window::close_window,
commands::window::focus_window,
```

### C2: Create chat SvelteKit route

- [ ] Create `routes/(chat)/+layout.svelte` — imports chat Frame
- [ ] Create `routes/(chat)/chat/+page.svelte` — minimal chat skeleton

The `(chat)` group layout uses the chat Frame instead of the app Frame. This route only renders in the chat child window.

### C3: Wire chat Frame skeleton with ColdLight

- [ ] Implement `layouts/chat/components/shell/Frame.svelte`:
  - `data-layout="chat"` attribute
  - CSS Grid: topbar / content / footer
  - Glass-void background with thick bevel (same pattern as app frame)
  - Import chat layout styles
- [ ] Populate `layouts/chat/index.ts` barrel exports

### C4: Add chat trigger to TopBar

- [ ] Add Lucide `MessageCircle` icon button in TopBar
- [ ] On click: invoke Tauri `open_chat_window` command
- [ ] Tooltip: "Open Chat"

**SvelteKit-side Tauri invoke:**
```typescript
import { invoke } from "@tauri-apps/api/core";
await invoke("open_chat_window");
```

### C5: Update tauri.conf.json

- [ ] Change chat window URL from `chat.html` to `/chat`
- [ ] Verify `visible: false` (chat opens on demand, not at startup)

### C6: Verify Phase C compiles

- [ ] `pnpm svelte-check` — zero errors
- [ ] `cargo check` in src-tauri — zero errors
- [ ] Rust clippy clean: `cargo clippy -- -D warnings`

---

## Phase D: Verify + Polish

### D1: Visual audit

- [ ] `pnpm dev` — main window has glass bevel frame, no black backgrounds
- [ ] TopBar: Parasite logo left, icon buttons + avatar right
- [ ] Sidebar: Lucide icons, teal glow on active, submenu slides for devpulse
- [ ] StatusBar: Badges with connection dot, uptime, version
- [ ] Orbitron font visible on headings/display text
- [ ] Content area uses void-blue backgrounds, not black

### D2: Scrollbar styling

- [ ] Add token-based scrollbar CSS to shell.css (enhance existing rules)
- [ ] Teal thumb with glow on hover (reference: OLD_PROJECTS scrollbar.ds.css)

### D3: Final type check

- [ ] `pnpm svelte-check` — zero errors
- [ ] `cargo check` — zero errors (if Tauri changes made)

---

## Files Modified (Summary)

### New Files
| File | Purpose |
|------|---------|
| `$lib/sys/runes/global.svelte.ts` | Global domain state singleton |
| `$lib/sys/routing/child-routes.ts` | Dynamic child route discovery |
| `src-tauri/src/commands/window/mod.rs` | Tauri window management commands |
| `routes/(chat)/+layout.svelte` | Chat window layout |
| `routes/(chat)/chat/+page.svelte` | Chat window entry page |

### Modified Files
| File | Changes |
|------|---------|
| `design/tokens/tokens.ts` | Add `voidBase`, `fontFamily` |
| `design/molecules/glass.css` | Add `glass-smoke` |
| `design/molecules/bevel.css` | Add `bevel-subtle` |
| `design/molecules/glow.css` | Add `glow-purple`, `glow-magenta` |
| `layouts/app/styles/shell.css` | Add frame bevel border |
| `layouts/app/styles/surfaces.css` | Add submenu styles |
| `layouts/app/Frame.svelte` | Wire globalState, update content area |
| `layouts/app/TopBar.svelte` | Full rewrite: ColdLight primitives + Lucide |
| `layouts/app/Sidebar.svelte` | Full rewrite: ColdLight primitives + submenu |
| `layouts/app/StatusBar.svelte` | Full rewrite: ColdLight Badge |
| `layouts/chat/components/shell/Frame.svelte` | Chat window glass frame |
| `layouts/chat/index.ts` | Barrel exports |
| `app.css` | Orbitron imports, font variables |
| `src-tauri/src/commands/mod.rs` | Add `window` module |
| `src-tauri/src/lib.rs` | Register window commands |
| `src-tauri/tauri.conf.json` | Fix chat window URL |

### Generated Files (via build)
| File | Trigger |
|------|---------|
| `design/tokens/tokens.css` | `pnpm ds:tokens:build` |

---

## Execution Order

```
A1 → A2 → A3 → A4 → A5(verify)
  ↓
B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8(verify)
  ↓
C1 → C2 → C3 → C4 → C5 → C6(verify)
  ↓
D1 → D2 → D3
```

Each phase has a compile-check gate. No phase starts until the previous gate passes.

---

## Compact Checkpoints

After each phase, pause and confirm with user:
- **After A5**: "Frame bevel visible, tokens fixed — proceed to shell rewrites?"
- **After B8**: "Shell components rewritten with ColdLight — proceed to chat window?"
- **After C6**: "Chat window wired — proceed to polish?"

---

## Rules (Non-Negotiable)

1. **No black** — `var(--color-void-950)` minimum, never `#000` or `black`
2. **No emoji** — Lucide SVG icons only
3. **No raw HTML** — Use ColdLight primitives where they exist
4. **No legacy stores** — `$state`, `$derived`, `$effect` only
5. **No hardcoded colors** — Every color traces to tokens.ts
6. **No hardcoded routes** — Child routes discovered via `import.meta.glob`
7. **data-kind/data-slot/data-state** — On every primitive
8. **Compile before done** — `svelte-check` passes after every file
