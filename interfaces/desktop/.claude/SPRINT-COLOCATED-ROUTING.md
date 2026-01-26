# SPRINT: Colocated Routing Migration

> **Status**: PLANNING
> **Branch**: TBD
> **Commit Strategy**: Atomic commits per phase

---

## Objective

Migrate from thin-wrapper routing to colocated routing pattern where domain code lives directly in `routes/(app)/<domain>/`.

---

## Pre-Requisites

- [x] SvelteKit project structure correct (configs at desktop/, source in src/)
- [x] Domain contracts exist in `lib/sys/contracts/domains/app/`
- [x] Routes exist in `routes/(app)/`

---

## Parking Lot (Needs Clarification)

### P1: Domain Feature Definitions

Each domain needs a feature type. User to define:

**devpulse** (active, order: 0)
```typescript
export type DevPulseFeature =
  | 'dashboard'
  | 'community'
  | 'profile'
  | 'settings';
```
Status: DEFINED

**overmind** (coming-soon, order: 2)
```typescript
export type OvermindFeature = ???
```
Status: NEEDS DEFINITION

**wiredfront** (coming-soon, order: 3)
```typescript
export type WiredFrontFeature =
  | 'dashboard'
  | 'gallery'
  | 'connectorhub'
  | 'viziwizi';
```
Status: DEFINED

**devforge** (hidden, order: 10)
```typescript
export type DevForgeFeature = ???
```
Status: NEEDS DEFINITION

**maestro** (hidden, order: 11)
```typescript
export type MaestroFeature = ???
```
Status: NEEDS DEFINITION

### P2: ui-demo Deletion

- ui-demo will be deleted
- Need to confirm: delete route AND contract?
- Any components to preserve elsewhere?

---

## Phase 1: Delete ui-demo

- [ ] 1.1 Delete `routes/(app)/ui-demo/` directory
- [ ] 1.2 Delete `lib/sys/contracts/domains/app/ui-demo/` directory
- [ ] 1.3 Remove ui-demo from domain registry (if registered)
- [ ] 1.4 Verify: `pnpm svelte-check` passes
- [ ] 1.5 COMMIT: `chore: remove ui-demo domain`

---

## Phase 2: Complete Domain Contracts

After parking lot items resolved:

- [ ] 2.1 Add OvermindFeature type to overmind.contract.ts
- [ ] 2.2 Add defaultFeature to OVERMIND_DOMAIN
- [ ] 2.3 Add DevForgeFeature type to devforge.contract.ts
- [ ] 2.4 Add defaultFeature to DEVFORGE_DOMAIN
- [ ] 2.5 Add MaestroFeature type to maestro.contract.ts
- [ ] 2.6 Add defaultFeature to MAESTRO_DOMAIN
- [ ] 2.7 Verify: `pnpm svelte-check` passes
- [ ] 2.8 COMMIT: `feat(contracts): add feature types to all domain contracts`

---

## Phase 3: Verify Colocated Structure

- [ ] 3.1 Verify devpulse/ has: features/, runes/, services/, stores/, types/
- [ ] 3.2 Verify overmind/ structure matches devpulse pattern
- [ ] 3.3 Verify wiredfront/ structure matches devpulse pattern
- [ ] 3.4 Verify devforge/ structure matches devpulse pattern
- [ ] 3.5 Verify maestro/ structure matches devpulse pattern
- [ ] 3.6 Run `pnpm dev` - no errors
- [ ] 3.7 Navigate to each domain URL manually
- [ ] 3.8 COMMIT: `chore: verify colocated routing structure`

---

## Phase 4: Cleanup

- [ ] 4.1 Delete old COLOCATED_ROUTING_PLAN.md (replaced by this sprint)
- [ ] 4.2 Update MASTER_SPRINT_PLAN.md to reflect completion
- [ ] 4.3 COMMIT: `docs: update sprint tracking`

---

## Blocked Until

- [ ] User defines OvermindFeature
- [ ] User defines DevForgeFeature
- [ ] User defines MaestroFeature
- [ ] User confirms ui-demo deletion scope

---

## Notes

- Domain code now lives IN routes/, not lib/domains/
- lib/layouts/ stays (shared Frame, Sidebar, TopBar, StatusBar)
- lib/design/ stays (ColdLight design system)
- lib/sys/ stays (contracts, registries)
