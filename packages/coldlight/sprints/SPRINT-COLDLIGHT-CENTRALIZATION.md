# SPRINT: ColdLight Centralization

> **Status**: PENDING APPROVAL
> **Priority**: CRITICAL
> **Goal**: Delete colocated CSS, centralize in ColdLight, inline Tailwind v4 in Svelte

## Problem Statement

Layout components have colocated CSS files that:
1. Use prefixed tokens that don't exist in SSOT
2. Duplicate styling that should come from ColdLight
3. Violate the "ColdLight is the only design system" principle

**Token prefix is NONE. LOCKED.**

## What Gets Deleted

```
layouts/app/styles/
├── surfaces.css    ❌ DELETE
├── depth.css       ❌ DELETE
├── shell.css       ❌ DELETE
├── layout.css      ❌ DELETE
└── index.css       ❌ DELETE

layouts/common/styles/
├── typography.css  ❌ DELETE
├── focus.css       ❌ DELETE
├── scrollbars.css  ❌ DELETE
├── keyframes.css   ❌ DELETE
└── index.css       ❌ DELETE

layouts/chat/styles/
├── shell.css       ❌ DELETE
├── depth.css       ❌ DELETE
├── interactions.css ❌ DELETE
└── index.css       ❌ DELETE
```

## What Gets Updated

Svelte layout files converted to inline Tailwind v4:

| File | Change |
|------|--------|
| `Frame.svelte` | Remove CSS import, use Tailwind classes |
| `TopBar.svelte` | Convert semantic classes to Tailwind |
| `Sidebar.svelte` | Convert semantic classes to Tailwind |
| `StatusBar.svelte` | Convert semantic classes to Tailwind |
| Chat layout files | Same pattern |

## Tailwind v4 + ColdLight Integration

ColdLight tokens exposed via Tailwind preset:
- `bg-glass-void` → `var(--glass-void)`
- `bg-teal-500` → `var(--color-teal-500)`
- `p-4` → `var(--space-4)`
- `rounded-md` → `var(--radius-md)`
- `shadow-z2` → `var(--shadow-z2)`
- `shadow-glow-teal` → `var(--glow-teal)`

## Fix MASTER-PLAN.md

Remove all stale prefixed references. Token Categories table is WRONG.
The SSOT (tokens.css) has unprefixed tokens. Documentation must match.

## Tasks

1. [ ] Delete all colocated CSS files (14 files)
2. [ ] Remove empty styles/ directories
3. [ ] Update Frame.svelte with Tailwind v4
4. [ ] Update TopBar.svelte with Tailwind v4
5. [ ] Update Sidebar.svelte with Tailwind v4
6. [ ] Update StatusBar.svelte with Tailwind v4
7. [ ] Update chat layout Svelte files
8. [ ] Fix MASTER-PLAN.md Token Categories table
9. [ ] Run svelte-check
10. [ ] Commit

## Verification

```bash
cd interfaces/desktop
pnpm svelte-check
grep -r "\-\-dp-" src/lib/layouts/  # Should return empty
grep -r "\.css" src/lib/layouts/**/*.svelte  # No CSS imports
```

## Status

- [x] CSS files deleted (app/common/chat styles)
- [x] Frame.svelte updated
- [x] StatusBar.svelte updated
- [ ] TopBar.svelte - IN PROGRESS
- [ ] Sidebar.svelte - PENDING
- [ ] Chat layouts - PENDING
- [ ] MASTER-PLAN.md - PENDING
- [ ] svelte-check - PENDING
