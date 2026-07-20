# domains/app/devpulse — CHECKLIST

> **Quality Gates for DevPulse Hub**
> **Version:** `0.1.0`
> **Last Updated:** `2026-01-22`

---

## Scaffold Completion

### Hub Level

| Item | Status | Notes |
|------|--------|-------|
| `README.md` | ✅ | |
| `CHECKLIST.md` | ✅ | This file |
| `index.ts` | ⬜ | Barrel exports needed |
| `runes/devpulse.runes.svelte.ts` | ⬜ | Hub state |
| `services/devpulse.service.ts` | ⬜ | Hub service |
| `types/devpulse.types.ts` | ⬜ | Hub types |

### Features Scaffold

Each feature needs: `components/`, `pages/`, `services/`, `types/`, `utils/`

| Feature | Scaffold | Components | Pages | Services | Types |
|---------|----------|------------|-------|----------|-------|
| `dashboard/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| `stats/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| `community/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| `profile/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| `settings/` | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Component Requirements

### Hub Components

| Component | Types | JSDoc | Tests | Status |
|-----------|-------|-------|-------|--------|
| `Carousel.svelte` | ⬜ | ⬜ | ⬜ | PARTIAL |
| `StatusBar.svelte` | ⬜ | ⬜ | ⬜ | PARTIAL |
| `TopBar.svelte` | ⬜ | ⬜ | ⬜ | PARTIAL |
| `Viewport.svelte` | ⬜ | ⬜ | ⬜ | PARTIAL |

### Dashboard Feature Components

| Component | Types | JSDoc | Tests | Status |
|-----------|-------|-------|-------|--------|
| `DashboardPage.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `WidgetGrid.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `QuickActions.svelte` | ⬜ | ⬜ | ⬜ | TODO |

### Stats Feature Components

| Component | Types | JSDoc | Tests | Status |
|-----------|-------|-------|-------|--------|
| `StatsPage.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `CommitGraph.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `ProjectMetrics.svelte` | ⬜ | ⬜ | ⬜ | TODO |

### Widgets

| Widget | Types | JSDoc | Tests | Status |
|--------|-------|-------|-------|--------|
| `ProjectCard.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `StatsCard.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `ActivityFeed.svelte` | ⬜ | ⬜ | ⬜ | TODO |
| `CommunityCard.svelte` | ⬜ | ⬜ | ⬜ | TODO |

---

## Runes Requirements

### Hub Runes Pattern

```typescript
// ✅ CORRECT: Class with $state singleton
class DevPulseState {
    activeWidget = $state<string | null>(null);
    dashboardLayout = $state<'grid' | 'list'>('grid');
    isActive = $derived(global.current_domain === 'devpulse');
}
export const devpulse = new DevPulseState();

// ❌ WRONG: Exported $state directly
export const activeWidget = $state<string | null>(null);
```

### Runes Checklist

| Rune | Location | Consumes | Status |
|------|----------|----------|--------|
| `devpulse` | `runes/devpulse.runes.svelte.ts` | `global` | ⬜ |
| `dashboard` | `features/dashboard/runes/` | `devpulse` | ⬜ |
| `stats` | `features/stats/runes/` | `devpulse` | ⬜ |

---

## Service Requirements

### Hub Service

| Method | Types | JSDoc | Tests | Status |
|--------|-------|-------|-------|--------|
| `getStats()` | ⬜ | ⬜ | ⬜ | TODO |
| `updateProfile()` | ⬜ | ⬜ | ⬜ | TODO |
| `getFriends()` | ⬜ | ⬜ | ⬜ | TODO |

### Feature Services

| Service | Location | Hub Integration | Status |
|---------|----------|-----------------|--------|
| `stats.service.ts` | `features/stats/services/` | ⬜ | TODO |
| `community.service.ts` | `features/community/services/` | ⬜ | TODO |
| `profile.service.ts` | `features/profile/services/` | ⬜ | TODO |
| `settings.service.ts` | `features/settings/services/` | ⬜ | TODO |

---

## JSDoc Standards

### Component Header

```html
<!--
  @file domains/app/devpulse/components/{Component}.svelte
  @layer domains
  @kind component
  @hub devpulse

  @description
  {Clear description}

  @props
  - propName: type - description

  @runes
  - localState: $state<type> - purpose

  @consumes
  - devpulse.activeWidget

  @since 0.1.0
-->
```

### Service Header

```typescript
/**
 * @module domains/app/devpulse/services/devpulse.service
 * @description Hub-level service for DevPulse
 * @version 0.1.0
 *
 * @fires devpulse:stats-request
 * @listens engine:stats-response
 *
 * @example
 * import { devpulseService } from './devpulse.service';
 * const stats = await devpulseService.getStats();
 */
```

---

## Type Requirements

### Hub Types

```typescript
// types/devpulse.types.ts

export interface UserStats {
    projects: number;
    commits: number;
    streak: number;
    lastActive: Date;
}

export interface DashboardLayout {
    type: 'grid' | 'list';
    columns: number;
    widgets: WidgetConfig[];
}

export interface WidgetConfig {
    id: string;
    type: 'project' | 'stats' | 'activity' | 'community';
    position: { x: number; y: number };
    size: { w: number; h: number };
}
```

| Type | Defined | Exported | Used | Status |
|------|---------|----------|------|--------|
| `UserStats` | ⬜ | ⬜ | ⬜ | TODO |
| `DashboardLayout` | ⬜ | ⬜ | ⬜ | TODO |
| `WidgetConfig` | ⬜ | ⬜ | ⬜ | TODO |

---

## Accessibility Checklist

| Element | Requirement | Status |
|---------|-------------|--------|
| Dashboard widgets | Keyboard navigable | ⬜ |
| Carousel | Arrow key navigation | ⬜ |
| Stats cards | Screen reader labels | ⬜ |
| Quick actions | Focus indicators | ⬜ |
| All buttons | `aria-label` present | ⬜ |

---

## State Isolation Rules

### DevPulse CAN:

- [x] Read from `global` state
- [x] Write to `devpulse/runes/` state
- [x] Emit events via hub service
- [x] Import from `$lib/design/*`
- [x] Import from sibling features

### DevPulse CANNOT:

- [ ] Write to `global` directly (use services)
- [ ] Call Tauri commands directly
- [ ] Import from other hubs (`devforge/`, `overmind/`, `wiredfront/`)
- [ ] Import from `$lib/domains/chat` or `$lib/domains/maestro`

---

## Test Requirements

### Unit Tests

| Area | Min Coverage | Status |
|------|--------------|--------|
| Hub components | 80% | ⬜ |
| Hub runes | 100% | ⬜ |
| Hub service | 80% | ⬜ |
| Feature components | 80% | ⬜ |
| Feature services | 80% | ⬜ |

### Integration Tests

| Test | Description | Status |
|------|-------------|--------|
| Dashboard load | Widgets render on mount | ⬜ |
| Stats fetch | Data populates correctly | ⬜ |
| Layout switch | Grid/list toggle works | ⬜ |
| Widget drag | Drag-drop repositioning | ⬜ |

---

## Cleanup Checklist

| Item | Issue | Action | Status |
|------|-------|--------|--------|
| `pages/DevpulseFrame.svelte/` | Directory not file | Delete | ⬜ |
| `features/*` empty | Missing scaffold | Create subfolders | ⬜ |
| `runes/` empty | Missing state | Create runes file | ⬜ |
| `services/` empty | Missing service | Create service file | ⬜ |
| `types/` empty | Missing types | Create types file | ⬜ |

---

## Index.ts Exports

```typescript
// domains/app/devpulse/index.ts

// Components
export { default as Carousel } from './components/Carousel.svelte';
export { default as StatusBar } from './components/StatusBar.svelte';
export { default as TopBar } from './components/TopBar.svelte';
export { default as Viewport } from './components/Viewport.svelte';

// Pages
export { default as DevpulseDashboard } from './pages/DevpulseDashboard.svelte';
export { default as HomeDashboard } from './pages/HomeDashboard.svelte';

// Runes
export { devpulse } from './runes/devpulse.runes.svelte';

// Services
export { devpulseService } from './services/devpulse.service';

// Types
export type { UserStats, DashboardLayout, WidgetConfig } from './types/devpulse.types';

// Features (re-export)
export * from './features/dashboard';
export * from './features/stats';
export * from './features/community';
export * from './features/profile';
export * from './features/settings';
```

---

## Sprint Completion Criteria

### Sprint 1: Scaffold

- [ ] All features have internal folders
- [ ] Hub runes file created
- [ ] Hub service file created
- [ ] Hub types file created
- [ ] Cleanup items resolved

### Sprint 2: Dashboard

- [ ] DashboardPage renders
- [ ] WidgetGrid works
- [ ] Basic widgets display
- [ ] Layout toggle works

### Sprint 3: Features

- [ ] Stats feature functional
- [ ] Profile feature functional
- [ ] Settings feature functional

### Sprint 4: Polish

- [ ] All JSDoc complete
- [ ] All tests passing
- [ ] Accessibility audit passed

---

## ADR Compliance

| ADR | Requirement | Status |
|-----|-------------|--------|
| ADR-013 | Widget system design | ⬜ |
| ADR-014 | Stats aggregation | ⬜ |

---

## Pre-Launch Checklist

- [ ] All scaffold items created
- [ ] Cleanup items resolved
- [ ] Hub runes working
- [ ] Hub service working
- [ ] Types exported
- [ ] JSDoc complete
- [ ] Tests passing (80%+)
- [ ] Accessibility verified
- [ ] README current
- [ ] Index.ts populated

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-22 | Initial checklist |
