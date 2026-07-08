# layouts/app — Quality Checklist

> **Purpose:** Automated quality gates and manual verification steps
> **Last Updated:** `2026-01-22`
> **Scope:** `commitlint`, `svelte-check`, `vitest`, `lefthook`

---

## Pre-Commit Gates (Automated via Lefthook)

These checks run automatically on every commit:

### TypeScript / Svelte Check

```bash
# lefthook.yml triggers this
pnpm svelte-check --fail-on-warnings
```

- [ ] No TypeScript errors in `*.svelte` or `*.ts` files
- [ ] No implicit `any` types
- [ ] All props typed via interface

### Commitlint

```bash
# Scopes for this domain
type(layouts): message
type(layouts/app): message
```

Valid types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

---

## Component Quality Gates

### Frame.svelte

| Check | Status | Automation |
|-------|--------|------------|
| Uses `$props()` for children | [ ] | svelte-check |
| No local `$state()` | [ ] | Manual review |
| Data attributes present | [ ] | Test |
| Grid areas match spec | [ ] | Visual test |
| Tokens only (no hardcoded values) | [ ] | Lint rule (TODO) |

### TopBar.svelte

| Check | Status | Automation |
|-------|--------|------------|
| TSDoc header complete | [ ] | Script (TODO) |
| `$state()` limited to search only | [ ] | Manual review |
| Parasite import from design | [ ] | Import check |
| Icon group implemented | [ ] | Visual test |
| `data-slot="topbar"` present | [ ] | Test |

### Sidebar.svelte

| Check | Status | Automation |
|-------|--------|------------|
| TSDoc header complete | [ ] | Script (TODO) |
| Uses `global.setDomain()` | [ ] | Manual review |
| 4 hub navigation items | [ ] | Test |
| Tooltips accessible | [ ] | A11y test |
| `data-slot="sidebar"` present | [ ] | Test |
| `data-expanded` attribute | [ ] | Test |

### StatusBar.svelte

| Check | Status | Automation |
|-------|--------|------------|
| TSDoc header complete | [ ] | Script (TODO) |
| Receives status via props/events | [ ] | Manual review |
| No hardcoded strings | [ ] | Lint (TODO) |
| `data-slot="statusbar"` present | [ ] | Test |
| Connection indicator accessible | [ ] | A11y test |

---

## TSDoc Header Compliance

Every component MUST have:

```html
<!--
  @file src/lib/layouts/app/{Component}.svelte
  @layer layouts
  @kind shell

  @description
  {Clear description of component purpose}

  @props
  - propName: type - description

  @dataattr
  - data-slot="{slot}"
  - data-state (if stateful)

  @since 0.1.0
-->
```

### Verification Script (TODO)

```bash
# scripts/audit-tsdoc.ts
pnpm tsx scripts/audit-tsdoc.ts --path src/lib/layouts/app
```

---

## Token Usage Rules

### ALLOWED

```css
/* Design system tokens */
var(--space-*)
var(--surface-glass-*)
var(--border-*)
var(--text-*)
var(--shadow-*)
var(--bevel-*)
var(--signal-*)
var(--duration-*)
var(--ease-*)
var(--radius-*)
var(--blur-*)
var(--font-*)
```

### FORBIDDEN

```css
/* Hardcoded values - NEVER use in layouts */
#ff0000
rgb(255, 0, 0)
12px  /* use --space-* or --text-* */
1rem  /* use token equivalents */
```

### Lint Rule (TODO)

```json
// .stylelintrc
{
  "rules": {
    "declaration-property-value-disallowed-list": {
      "/.*/": ["/^#[0-9a-f]/i", "/^rgb/", "/^hsl/"]
    }
  }
}
```

---

## State Isolation Rules

### layouts/app CAN:

- [ ] Read from `GlobalState` (`global.current_domain`, `global.theme`)
- [ ] Have minimal UI state for interactions (hover, toggle, animation)
- [ ] Listen to engine events (via event bus)
- [ ] Import from `$lib/design/*`

### layouts/app CANNOT:

- [ ] Write to `GlobalState` (domains do this)
- [ ] Call Tauri commands directly
- [ ] Import from `$lib/domains/*`
- [ ] Contain business logic
- [ ] Fetch data

---

## Accessibility Checklist

| Element | Requirement | Status |
|---------|-------------|--------|
| Sidebar buttons | `aria-label` present | [ ] |
| Search input | `aria-expanded` for overlay | [ ] |
| Status indicator | Screen reader text | [ ] |
| Tooltips | `role="tooltip"` or equivalent | [ ] |
| Focus management | Visible focus ring | [ ] |
| Color contrast | 4.5:1 minimum | [ ] |

---

## Test Requirements

### Unit Tests (Vitest)

```typescript
// layouts/app/__tests__/Frame.test.ts
describe('Frame', () => {
    it('renders children in content slot');
    it('applies data-layout attribute');
    it('uses correct grid areas');
});
```

### Component Tests

```typescript
// layouts/app/__tests__/Sidebar.test.ts
describe('Sidebar', () => {
    it('renders 4 hub navigation items');
    it('calls global.setDomain on click');
    it('shows tooltip on hover');
    it('applies active state to current hub');
});
```

### Visual Tests (Playwright)

```typescript
// e2e/layouts/app.spec.ts
test('app shell renders correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-layout="app"]')).toBeVisible();
    await expect(page.locator('[data-slot="topbar"]')).toHaveCSS('height', '48px');
});
```

---

## File Cleanup Tasks

Before Sprint 1 completion:

- [ ] Delete `components/shell/Frame.svelte` (duplicate)
- [ ] Delete `components/shell/Sidebar.svelte` (duplicate)
- [ ] Delete `components/shell/TopBar.svelte` (duplicate)
- [ ] Delete `AppLayout.svelte` (unused alternate)
- [ ] Create `utils/truclamp.ts`
- [ ] Populate `index.ts` with exports

---

## Index.ts Exports

```typescript
// layouts/app/index.ts
export { default as Frame } from './Frame.svelte';
export { default as TopBar } from './TopBar.svelte';
export { default as Sidebar } from './Sidebar.svelte';
export { default as StatusBar } from './StatusBar.svelte';

// Types
export type { /* ShellProps if needed */ } from './types';

// Utilities
export { truclamp } from './utils/truclamp';
```

---

## Sprint Completion Criteria

### Sprint 1: Shell Polish

- [ ] All TSDoc headers complete
- [ ] `svelte-check` passes
- [ ] No duplicate files
- [ ] `index.ts` populated
- [ ] Data attributes on all elements
- [ ] Token-only styling

### Sprint 2: Hub Navigation

- [ ] 4 hubs in Sidebar
- [ ] Active state working
- [ ] `global.setDomain()` integrated
- [ ] Icons (not emoji)

### Sprint 3: Status Integration

- [ ] Engine event listener
- [ ] Real connection status
- [ ] Real uptime
- [ ] No hardcoded values

### Sprint 4: Mode & Chat

- [ ] MODE indicator in TopBar
- [ ] Z-index layer reserved
- [ ] Mode availability rules implemented

---

## Automation Roadmap

| Tool | Purpose | Status |
|------|---------|--------|
| Lefthook | Pre-commit hooks | INSTALLED |
| Commitlint | Commit message format | INSTALLED |
| svelte-check | TypeScript validation | INSTALLED |
| Vitest | Unit tests | TODO |
| Playwright | E2E tests | TODO |
| Stylelint | CSS token enforcement | TODO |
| TSDoc audit | Header compliance | TODO |
