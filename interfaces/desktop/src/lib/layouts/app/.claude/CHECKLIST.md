# layouts/app — Quality Checklist

> **Purpose**: Ensure clean, ColdLight-convertible CSS with proper separation of concerns.
> **Last Updated**: 2026-01-24

---

## Pre-Flight Verification

### [ ] Structure Audit
- [ ] Only these Svelte files exist at root: `Frame.svelte`, `TopBar.svelte`, `Sidebar.svelte`, `StatusBar.svelte`
- [ ] Duplicate `components/shell/` folder identified for removal (consolidate to root)
- [ ] `AppLayout.svelte` identified for removal (duplicate)
- [ ] `index.ts` exists as barrel export

### [ ] Business Logic Boundaries
The ONLY business logic allowed in layouts/app:
- [ ] **Avatar**: User avatar state, menu toggle
- [ ] **Icons**: Navigation state, hover/animation state
- [ ] **Structure**: Grid layout, slot rendering

Everything else is DUMB SHELL — no domain logic, no data fetching, no business rules.

---

## CSS Quality Gates

### [ ] No Token References
Current broken tokens that MUST be replaced with hardcoded values:

| Broken Token | Replace With |
|--------------|--------------|
| `var(--color-void)` | `rgba(15, 23, 42, 0.97)` |
| `var(--surface-glass-void)` | `rgba(30, 41, 59, 0.8)` |
| `var(--surface-glass-deep)` | `rgba(15, 23, 42, 0.9)` |
| `var(--surface-glass-smoke)` | `rgba(51, 65, 85, 0.6)` |
| `var(--surface-glass-frost)` | `rgba(71, 85, 105, 0.7)` |
| `var(--blur-xl)` | `24px` |
| `var(--blur-lg)` | `16px` |
| `var(--border-subtle)` | `1px solid rgba(65, 240, 219, 0.1)` |
| `var(--border-soft)` | `1px solid rgba(65, 240, 219, 0.2)` |
| `var(--border-medium)` | `1px solid rgba(65, 240, 219, 0.3)` |
| `var(--bevel-outset-subtle)` | `inset 1px 1px 1px rgba(255,255,255,0.05), inset -1px -1px 1px rgba(0,0,0,0.2)` |
| `var(--bevel-outset-soft)` | `inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(0,0,0,0.25)` |
| `var(--bevel-outset-medium)` | `inset 2px 2px 3px rgba(255,255,255,0.1), inset -2px -2px 3px rgba(0,0,0,0.3)` |
| `var(--bevel-inset-soft)` | `inset -1px -1px 2px rgba(255,255,255,0.05), inset 1px 1px 2px rgba(0,0,0,0.3)` |
| `var(--shadow-z3)` | `0 8px 32px rgba(0, 0, 0, 0.3)` |
| `var(--shadow-z4)` | `0 16px 48px rgba(0, 0, 0, 0.4)` |
| `var(--shadow-glow-teal)` | `0 0 20px rgba(65, 240, 219, 0.3)` |
| `var(--text-white)` | `rgba(255, 255, 255, 0.95)` |
| `var(--text-secondary)` | `rgba(255, 255, 255, 0.7)` |
| `var(--text-muted)` | `rgba(255, 255, 255, 0.5)` |
| `var(--signal-teal)` | `rgba(65, 240, 219, 1)` |
| `var(--signal-success)` | `rgba(34, 197, 94, 1)` |
| `var(--signal-error)` | `rgba(239, 68, 68, 1)` |
| `var(--space-1)` | `4px` |
| `var(--space-2)` | `8px` |
| `var(--space-3)` | `12px` |
| `var(--space-4)` | `16px` |
| `var(--radius-md)` | `8px` |
| `var(--radius-lg)` | `12px` |
| `var(--radius-full)` | `9999px` |
| `var(--duration-fast)` | `150ms` |
| `var(--duration-normal)` | `250ms` |
| `var(--ease-out)` | `cubic-bezier(0.33, 1, 0.68, 1)` |
| `var(--ease-in-out)` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `var(--ease-bounce)` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `var(--font-sans)` | `"Inter", system-ui, sans-serif` |
| `var(--font-mono)` | `"JetBrains Mono", monospace` |
| `var(--text-xs)` | `0.75rem` |
| `var(--text-sm)` | `0.875rem` |

### [ ] Color Compliance
- [ ] NO true black (`#000`, `rgb(0,0,0)`) anywhere
- [ ] All dark backgrounds use dark blue-slate: `rgba(15, 23, 42, ...)` or similar
- [ ] Accents use established palette: cyan `rgba(65, 240, 219)`, pink `rgba(255, 10, 190)`, purple `rgba(147, 51, 234)`

### [ ] Glass Morphism Depth
Each glass surface MUST have:
- [ ] Background with alpha: `rgba(R, G, B, 0.6-0.9)`
- [ ] Backdrop blur: `backdrop-filter: blur(16-24px) saturate(180%)`
- [ ] Border with glow hint: `border: 1px solid rgba(65, 240, 219, 0.1-0.3)`
- [ ] Inset highlight + shadow (neumorphism): `box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)`

### [ ] Icon Interaction Contract
All icons MUST have:
- [ ] Tooltip on hover (positioned correctly, glass styled)
- [ ] Color change on hover: transition to `rgba(65, 240, 219, 1)`
- [ ] Swell motion: `transform: scale(1.1)` with `transition: transform 0.3s ease`
- [ ] Gradual return: easing on mouse leave (not abrupt)

---

## Svelte 5 Runes Compliance

### [ ] Props
- [ ] Use `$props()` for all component inputs
- [ ] Type with `interface Props { ... }`
- [ ] Use `Snippet` type for children slots

### [ ] State
- [ ] Use `$state()` for local reactive state
- [ ] ONLY these components may have local state: TopBar, Sidebar, StatusBar, Avatar, Logo, Status
- [ ] Frame.svelte should use `$props()` only (no local state)

### [ ] Derived
- [ ] Use `$derived()` for computed values when needed
- [ ] Prefer `$derived` over `$:` reactive statements

---

## Data Attributes Contract

### [ ] Frame.svelte
```html
<div data-layout="app" data-route="{current_domain}">
```

### [ ] TopBar.svelte
```html
<header data-slot="topbar">
```

### [ ] Sidebar.svelte
```html
<aside data-slot="sidebar" data-expanded="{boolean}">
```

### [ ] StatusBar.svelte
```html
<footer data-slot="statusbar">
```

### [ ] Content Area
```html
<main data-slot="content">
```

---

## Component Deliverables

### Frame.svelte
- [ ] CSS Grid layout matches spec: `48px 1fr 32px` rows, `64px 1fr` cols
- [ ] Grid areas: topbar, sidebar, content, status
- [ ] No horizontal scroll (`overflow: hidden`)
- [ ] Custom scrollbar on content area (glass cyber style from OLD_PROJECTS)
- [ ] Background: deep void blue-slate (NOT black)

### TopBar.svelte
- [ ] 48px height, 100% width
- [ ] Glass surface with neumorphic bevel
- [ ] Parasite logo left
- [ ] Icon group right with swell hover
- [ ] Search overlay (glass panel, appears below)

### Sidebar.svelte
- [ ] 64px width, icon-only mode
- [ ] Tooltips appear on right side of icons
- [ ] 4 animation variants: bounce, spin, pulse, shake
- [ ] Active state with teal glow
- [ ] Glass background with vertical rhythm

### StatusBar.svelte
- [ ] 32px height, 100% width
- [ ] Glass surface with subtle bevel
- [ ] Status dot with glow when online
- [ ] Mono font for system text
- [ ] Left: connection | Center: uptime | Right: version

---

## Verification Steps

After each component rewrite:
1. [ ] Run `pnpm check` — no TypeScript errors
2. [ ] Run `pnpm dev` — visual inspection
3. [ ] Verify glass depth matches references
4. [ ] Verify icon interactions work (hover swell, tooltips)
5. [ ] Verify no horizontal scroll appears
6. [ ] Verify scrollbars have cyber glass style

---

## Sign-off

| Gate | Status |
|------|--------|
| All tokens replaced with hardcoded values | [ ] YES / [ ] NO |
| No true black in any component | [ ] YES / [ ] NO |
| Glass morphism has proper depth | [ ] YES / [ ] NO |
| Icon interactions complete | [ ] YES / [ ] NO |
| Runes used correctly ($state, $props, $derived) | [ ] YES / [ ] NO |
| Data attributes match contract | [ ] YES / [ ] NO |
| Visual matches references | [ ] USER APPROVAL REQUIRED |
