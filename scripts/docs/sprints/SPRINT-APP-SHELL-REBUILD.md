# SPRINT: App Shell Rebuild with ColdLight Primitives

> **Status**: READY (blocked by SPRINT-TOKEN-BRIDGE)
> **Priority**: HIGH
> **Goal**: Rewrite all app shell layout components to use ColdLight primitives, delete dead CSS, migrate common styles into design/
> **Research**: [SPRINT-VISUAL-SCAFFOLDING.research.md](./SPRINT-VISUAL-SCAFFOLDING.research.md)
> **Master Plan Phases**: Phase 5 (Delete Ad-Hoc CSS) + Phase 8 (Layout Rebuild)
> **Date**: 2026-02-07

---

## Problem Statement

Layout components were built with hardcoded HTML, emoji icons, and CSS classes from `layout.css` (712 lines of dead weight with raw oklch values). ColdLight now has 42 primitives on disk — zero are used by layouts.

### Current Violations

| Component | Violation |
|-----------|-----------|
| **TopBar** | Raw `<button>` instead of Button primitive, raw `<input>` instead of Command primitive, emoji `🔍` instead of SVG icon, no Avatar, no notification bell, duplicated `track()` pointer function |
| **Sidebar** | Raw `<a>` links instead of Button/nav, CSS `.tooltipWrap` hack instead of Tooltip primitive, emoji icons (`🏠`, `🎨`, `🧠`, etc.), duplicated `track()` from TopBar |
| **StatusBar** | Hand-rolled badge markup instead of Badge primitive, raw `bg-teal-400`/`bg-ember-500` bypassing tokens |
| **Frame** | Structurally OK (CSS Grid), but class names (`bg-glass-void`, `shadow-z1`) don't resolve (fixed by Token Bridge) |
| **AppLayout.svelte** | Empty file, dead weight |

---

## Prerequisites

- [x] 42 ColdLight primitives exist on disk
- [x] Research audit maps every element to its primitive
- [ ] **SPRINT-TOKEN-BRIDGE complete** — @theme emits correct utilities, recipe classes resolve
- [ ] SVG icon system decision made (Lucide, Phosphor, or custom)

### Icon System Decision (NEEDED BEFORE EXECUTION)

Both TopBar and Sidebar use emoji icons. Need to decide:

| Option | Pros | Cons |
|--------|------|------|
| **Lucide** | 1500+ icons, tree-shakable, MIT, Svelte package exists | Another dependency |
| **Phosphor** | 7000+ icons, MIT, multiple weights | Larger set than needed |
| **Custom SVG** | Zero deps, exact match to vision | Maintenance burden |

**Recommendation**: Lucide — well-maintained, tree-shakable, good Svelte support, sufficient icon set.

---

## Tasks

### Phase A: Delete Dead CSS + Cleanup

- [ ] **A1.** DELETE `layouts/app/styles/layout.css` (712 lines — confirmed dead, all raw oklch)
- [ ] **A2.** DELETE `layouts/app/AppLayout.svelte` (empty duplicate)
- [ ] **A3.** Evaluate `layouts/app/styles/shell.css` (111 lines) — if Frame.svelte already uses inline Tailwind, DELETE
- [ ] **A4.** Evaluate `layouts/app/styles/surfaces.css` (149 lines) — if values are in tokens, DELETE
- [ ] **A5.** Migrate `layouts/app/styles/depth.css` (228 lines) → `design/molecules/depth.css` (keep useful multi-layer shadow presets)
- [ ] **A6.** Migrate `layouts/common/styles/typography.css` (207 lines) → `design/typography/typography.css`
- [ ] **A7.** Migrate `layouts/common/styles/keyframes.css` (331 lines) → `design/keyframes/keyframes.css`
- [ ] **A8.** Migrate `layouts/common/styles/focus.css` (122 lines) → `design/focus/focus.css`
- [ ] **A9.** Migrate `layouts/common/styles/scrollbars.css` (125 lines) → `design/scrollbars/scrollbars.css`
- [ ] **A10.** Update `design/index.css` to import migrated files
- [ ] **A11.** Delete empty `layouts/app/styles/` and `layouts/common/styles/` directories
- [ ] **A12.** Delete `layouts/app/styles/index.css` barrel (no longer needed)
- [ ] **A13.** Run `pnpm svelte-check` — zero errors

### Phase B: Install Icon System

- [ ] **B1.** Install icon library: `pnpm add lucide-svelte` (or chosen library)
- [ ] **B2.** Create `design/icons/index.ts` barrel for app-used icons (re-export only what's needed)
- [ ] **B3.** Define icon size tokens: `icon-sm` (16px), `icon-md` (20px), `icon-lg` (24px)

### Phase C: Rewrite TopBar.svelte

Current: 90 lines, raw `<button>`, raw `<input>`, emoji, inline `track()`.

Target: ColdLight primitives, SVG icons, recipe-driven styling.

- [ ] **C1.** Replace search button with **Button** primitive + **Tooltip**:
  ```svelte
  <Tooltip text="Search">
    <Button variant="ghost" size="icon" onclick={toggleSearch}>
      <SearchIcon class="h-4 w-4" />
    </Button>
  </Tooltip>
  ```

- [ ] **C2.** Replace search overlay with **Command** primitive (Cmd+K pattern):
  - Keyboard: Cmd+K opens, Escape closes
  - Accessible: proper role="combobox", aria-expanded
  - Visual: glass surface, token borders, recipe styling

- [ ] **C3.** Add **Avatar** primitive (user avatar, top-right):
  ```svelte
  <Avatar src={user.avatar} fallback={user.initials} size="sm" />
  ```

- [ ] **C4.** Add notification button: **Button** + **DropdownMenu** or **Popover**

- [ ] **C5.** Add web/links button: **Button** + **Tooltip**

- [ ] **C6.** Remove inline `track()` function — will be replaced by `glowTrack` recipe action (future sprint)

- [ ] **C7.** Remove emoji `🔍` — replace with Lucide `Search` icon

- [ ] **C8.** Add `data-slot="topbar"` per data attributes contract

- [ ] **C9.** Run `pnpm svelte-check` — zero errors

### Phase D: Rewrite Sidebar.svelte

Current: 130 lines, raw `<a>`, CSS tooltipWrap hack, emoji icons, duplicated `track()`.

Target: ColdLight primitives, SVG icons, proper tooltips.

- [ ] **D1.** Replace nav links with **Button** primitive (as navigation):
  ```svelte
  <Tooltip text={item.label} side="right">
    <Button
      variant="ghost"
      size="icon"
      href={item.href}
      data-active={isActive(item.href)}
      aria-current={isActive(item.href) ? "page" : undefined}
    >
      <svelte:component this={item.icon} class="h-5 w-5" />
    </Button>
  </Tooltip>
  ```

- [ ] **D2.** Replace CSS `.tooltipWrap` with **Tooltip** primitive:
  - Position: right (sidebar is on the left)
  - Delay: standard hover delay
  - Accessible: role="tooltip", associated via aria-describedby

- [ ] **D3.** Replace emoji icons with SVG icons:
  | Current | Replacement (Lucide) |
  |---------|---------------------|
  | `🏠` Home | `Home` |
  | `🎨` UI Components | `Palette` |
  | `🧠` OverMind | `Brain` |
  | `📡` WiredFront | `Radio` |
  | `🔧` DevForge | `Wrench` |
  | `🎭` Maestro | `Drama` or `Sparkles` |
  | `➡️` Expand | `ChevronRight` |
  | `⬅️` Collapse | `ChevronLeft` |

- [ ] **D4.** Replace toggle button with **Toggle** or **Button** primitive

- [ ] **D5.** Remove inline `track()` function (duplicate from TopBar)

- [ ] **D6.** Remove inline `triggerAnim()` with setTimeout — move to recipe action

- [ ] **D7.** Add `data-slot="sidebar"` and `data-expanded` per data attributes contract

- [ ] **D8.** Keep `navItems` array structure but change `icon` from string to component reference

- [ ] **D9.** Run `pnpm svelte-check` — zero errors

### Phase E: Rewrite StatusBar.svelte

Current: 39 lines, hand-rolled badge markup, raw color classes.

Target: Badge primitives, token-backed colors.

- [ ] **E1.** Replace connection status pill with **Badge** primitive:
  ```svelte
  <Badge variant={statusVariant} dot>
    {status.connection}
  </Badge>
  ```

- [ ] **E2.** Replace uptime display with **Badge** (muted variant):
  ```svelte
  <Badge variant="muted">Uptime: {status.uptime}</Badge>
  ```

- [ ] **E3.** Replace version display with **Badge** (muted variant):
  ```svelte
  <Badge variant="muted">v{status.version}</Badge>
  ```

- [ ] **E4.** Map status → variant: `online` → `success`, `offline` → `destructive`, `warning` → `warning`, `processing` → `default`

- [ ] **E5.** Add `data-slot="statusbar"` per data attributes contract

- [ ] **E6.** Run `pnpm svelte-check` — zero errors

### Phase F: Update Frame.svelte

Frame is structurally correct (CSS Grid). After Token Bridge, class names resolve.

- [ ] **F1.** Verify glass backgrounds render: `bg-glass-void`, `bg-glass-deep`, `bg-matte-dark`
- [ ] **F2.** Verify shadows render: `shadow-z1`, `shadow-z2`
- [ ] **F3.** Replace `border-teal-700/30` with semantic token: `border-subtle` (from Tier 2)
- [ ] **F4.** Add `data-layout="app"` to root div
- [ ] **F5.** Add `data-route` binding (currently hardcoded to "devpulse")
- [ ] **F6.** Run `pnpm svelte-check` — zero errors

### Phase G: Update Layout READMEs

- [ ] **G1.** Add ColdLight mandate to `layouts/app/README.md`:
  > **ColdLight Mandate:** Every interactive or visual element in this layout that has a ColdLight primitive MUST use it. No raw `<button>`, `<input>`, `<dialog>`, or hand-rolled tooltip/popover/dropdown markup. If a primitive doesn't exist for a layout need, file it as a new primitive request before building a one-off.

- [ ] **G2.** Update component inventory table with new primitive usage

- [ ] **G3.** Update file structure to remove deleted files and directories

- [ ] **G4.** Run `pnpm svelte-check` — zero errors (final)

---

## Verification

```bash
cd interfaces/desktop

# No dead CSS remaining
ls src/lib/layouts/app/styles/layout.css  # Should not exist
ls src/lib/layouts/app/AppLayout.svelte   # Should not exist

# No emoji in layouts
grep -r "🔍\|🏠\|🎨\|🧠\|📡\|🔧\|🎭\|➡️\|⬅️" src/lib/layouts/app/  # Should return empty

# No raw <button> or <input> (except in script blocks)
grep -r "<button" src/lib/layouts/app/*.svelte  # Should only show Button primitive usage
grep -r "<input" src/lib/layouts/app/*.svelte   # Should only show Input primitive usage

# ColdLight primitives imported
grep -r "import.*Button\|import.*Tooltip\|import.*Command\|import.*Badge\|import.*Avatar" src/lib/layouts/app/

# Type check
pnpm svelte-check

# Visual verification
pnpm dev  # Glass surfaces visible, icons render, tooltips work
```

---

## Primitive Usage Map (Post-Sprint)

| Layout Component | ColdLight Primitives Used |
|-----------------|--------------------------|
| **TopBar** | Button, Tooltip, Command, Avatar, DropdownMenu (notifications) |
| **Sidebar** | Button, Tooltip, Toggle |
| **StatusBar** | Badge |
| **Frame** | (structural — no primitives, uses CSS Grid + token classes) |

---

## Files Modified

| File | Action |
|------|--------|
| `layouts/app/TopBar.svelte` | REWRITE — use Button, Tooltip, Command, Avatar |
| `layouts/app/Sidebar.svelte` | REWRITE — use Button, Tooltip, SVG icons |
| `layouts/app/StatusBar.svelte` | REWRITE — use Badge |
| `layouts/app/Frame.svelte` | UPDATE — semantic borders, data attributes |
| `layouts/app/AppLayout.svelte` | DELETE |
| `layouts/app/styles/layout.css` | DELETE |
| `layouts/app/styles/shell.css` | DELETE (if unused) |
| `layouts/app/styles/surfaces.css` | DELETE (if unused) |
| `layouts/app/styles/depth.css` | MIGRATE → `design/molecules/depth.css` |
| `layouts/app/styles/index.css` | DELETE |
| `layouts/common/styles/typography.css` | MIGRATE → `design/typography/typography.css` |
| `layouts/common/styles/keyframes.css` | MIGRATE → `design/keyframes/keyframes.css` |
| `layouts/common/styles/focus.css` | MIGRATE → `design/focus/focus.css` |
| `layouts/common/styles/scrollbars.css` | MIGRATE → `design/scrollbars/scrollbars.css` |
| `layouts/app/README.md` | UPDATE — ColdLight mandate, new inventory |
| `design/index.css` | UPDATE — import migrated files |
| `design/icons/index.ts` | NEW — icon barrel |

---

## Depends On

- **SPRINT-TOKEN-BRIDGE** — @theme must emit correct utilities first

## Blocks

- SPRINT-CHAT-OVERLAY — chat stubs need same pattern established here
