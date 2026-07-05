# Layouts Sprint - Resume Notes

## Context Snapshot (2026-01-24)

### The Problem
- Svelte components in `layouts/app/` reference **non-existent ColdLight tokens**
- CSS like `var(--color-void)`, `var(--surface-glass-void)` breaks the app
- ColdLight primitives are NOT built yet - being actively developed

### The Solution
- Write **local hardcoded CSS** in Svelte `<style>` blocks
- Use color values from `OLD_PROJECTS_CSS_TSX/` as reference
- Later these will be converted to ColdLight recipes

---

## Component Inventory

### 4 Core Layout Components (Frame children)
1. **TopBar** - 48px fixed height, glass surface
2. **Sidebar** - 64px fixed width, icon rail
3. **StatusBar** - 32px fixed height, bottom bar
4. **MainContent** - Fluid center area (slot)

### DevPulse Default (loaded into Frame)
- Default layout configuration
- Owns the slot content

### Interactive Icon Components
5. **Avatar** - User avatar with tooltip
6. **StatusIndicator** - Series of status icons

### Icon Interaction Contract
- Tooltips on ALL icons
- Color change on hover/active
- Motion: subtle swell on hover, gradual return to normal
- References exist in `OLD_PROJECTS_CSS_TSX/`

---

## Color Palette (from OLD_PROJECTS)

**CRITICAL: Never use true black. Always dark blues/teals/purples/slate/charcoal.**

```css
/* Dark backgrounds - NOT BLACK */
--background-color-void: rgba(15, 23, 42, 0.97);     /* Dark blue-slate */
--background-color-deep: rgba(30, 41, 59, 0.95);     /* Lighter slate */

/* HSL approach from pulseos-tokens */
--color-bg-base: 222 84% 5%;           /* ~#0a0a14 deep void */

/* Accent colors */
--accent-cyan: rgba(65, 240, 219, 1);  /* Primary teal */
--accent-pink: rgba(255, 10, 190, 1);  /* Secondary pink */
--accent-purple: rgba(147, 51, 234, 1); /* Tertiary purple */
--accent-lime: hsl(125 100% 59%);      /* Green/lime accent */
--accent-amber: hsl(38 95% 55%);       /* Gold/amber */
```

---

## CSS Patterns to Use

### Glass Panel (from pulseos-effect-glass.ds.css)
```css
.glass-panel {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(65, 240, 219, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Neumorphic Bevel (from references)
```css
.bevel-outset {
  box-shadow:
    inset 1px 1px 2px rgba(255, 255, 255, 0.1),
    inset -1px -1px 2px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### Icon Hover Swell
```css
.icon-interactive {
  transition: transform 0.3s ease, color 0.2s ease;
}
.icon-interactive:hover {
  transform: scale(1.1);
  color: rgba(65, 240, 219, 1);
}
```

### Scrollbar (from scrollbar.ds.css)
```css
::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg,
    rgba(65, 240, 219, 0.4) 0%,
    rgba(255, 10, 190, 0.3) 50%,
    rgba(65, 240, 219, 0.4) 100%
  );
  box-shadow:
    0 0 20px rgba(65, 240, 219, 0.3),
    0 0 40px rgba(255, 10, 190, 0.2);
}
```

---

## Architecture Principles

### Zero Drift Protocol
- Source of truth = `.ts` / `.rs` files, NOT `.md`
- Code changes without doc updates = build fails (Lefthook CI hooks)
- Documentation extracted from code AST

### Fractal Architecture (Co-location)
- Every module is self-contained universe
- Docs, tests, planning live WITH the code
- TheCowLevel = read-only aggregator (View layer)

### ADRs as First-Class Citizens
- Decisions are immutable
- Don't update old docs - write NEW ADR
- `adr-tools` + Docusaurus auto-index decisions

### AI Gap Filling
- Input: JSDoc/TSDoc comments (raw data)
- Input: Fractal structure (planning/*.md)
- AI synthesizes concept pages from typed interfaces
- High-level docs grounded in strictly typed code

---

## Files to Read Before Coding

### Required Reference Files
1. `OLD_PROJECTS_CSS_TSX/pulseos-tokens.ds.css` - HSL token system
2. `OLD_PROJECTS_CSS_TSX/pulseos-effect-glass.ds.css` - Glass morphism
3. `OLD_PROJECTS_CSS_TSX/scrollbar.ds.css` - Scrollbar styling
4. `OLD_PROJECTS_CSS_TSX/typography.ds.css` - Text effects
5. `OLD_PROJECTS_CSS_TSX/tooltip.ds.css` - Tooltip pattern

### Current Layout Files
1. `layouts/app/Frame.svelte` - Main shell (needs CSS rewrite)
2. `layouts/app/TopBar.svelte` - Top bar (needs CSS rewrite)
3. `layouts/app/Sidebar.svelte` - Sidebar (needs CSS rewrite)
4. `layouts/app/StatusBar.svelte` - Status bar (needs CSS rewrite)

### READMEs for Context
1. `layouts/app/Readme.md` - Component architecture
2. `layouts/chat/README.md` - Overlay system

---

## Work Order

1. **Delete broken `/styles/` folders** - They reference non-existent ColdLight tokens
2. **Rewrite Frame.svelte** - Local CSS with hardcoded glass values
3. **Rewrite TopBar.svelte** - Local CSS, icon interactions
4. **Rewrite Sidebar.svelte** - Local CSS, icon rail with tooltips
5. **Rewrite StatusBar.svelte** - Local CSS
6. **Create Background.svelte** - `layouts/common/components/backgrounds/`
7. **Wire up chat layouts** - Match reference images

---

## User's Explicit Demands

1. "Never assume - pause and ask for clarity"
2. "Work smarter not harder"
3. "CSS stored directly with Svelte files"
4. "Colors are NEVER black - dark blues, teals, purples, slate, charcoal"
5. "Learn from OLD_PROJECTS_CSS_TSX/"
6. "Documentation auto-generates from code AST"
