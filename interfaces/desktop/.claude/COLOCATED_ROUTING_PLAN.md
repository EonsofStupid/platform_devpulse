# Colocated Routing Restructure Plan

> **Status**: IN PROGRESS
> **Decision**: Colocated routes (domain code lives IN routes/, not lib/domains/)

---

## Goal

Move from thin wrapper pattern to colocated pattern:
- **BEFORE**: Routes import from `$lib/domains/app/<domain>/`
- **AFTER**: Domain code lives directly in `routes/(app)/<domain>/`

---

## Final Target Structure

```
src/
├── routes/
│   ├── +layout.svelte              <- root layout
│   ├── +page.svelte                <- root page (redirect to /devpulse)
│   └── (app)/                      <- route group (shared app shell)
│       ├── +layout.svelte          <- imports Frame from $lib/layouts/app/
│       ├── devpulse/               <- COLOCATED: all devpulse code here
│       │   ├── +page.svelte        <- imports ./features/dashboard/...
│       │   ├── features/
│       │   │   ├── dashboard/
│       │   │   ├── community/
│       │   │   ├── profile/
│       │   │   └── settings/
│       │   ├── runes/
│       │   ├── services/
│       │   ├── stores/
│       │   └── types/
│       ├── ui-demo/                <- COLOCATED
│       │   ├── +page.svelte
│       │   ├── components/
│       │   └── pages/
│       ├── overmind/               <- COLOCATED
│       ├── devforge/               <- COLOCATED
│       ├── wiredfront/             <- COLOCATED
│       └── clyffy/                <- COLOCATED
├── lib/
│   ├── layouts/                    <- STAYS (shared app shell)
│   │   ├── app/
│   │   │   ├── Frame.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── TopBar.svelte
│   │   │   └── StatusBar.svelte
│   │   ├── chat/
│   │   └── common/
│   ├── design/                     <- STAYS (ColdLight design system)
│   ├── sys/                        <- STAYS (contracts, registries)
│   │   ├── contracts/
│   │   │   ├── routing/
│   │   │   │   └── domain.contract.ts  <- metadata only, no pageModule
│   │   │   └── domains/app/        <- domain metadata contracts
│   │   └── registries/
│   └── test/                       <- STAYS
└── app.html
```

---

## Execution Steps

### Phase 1: Move Domain Code [DONE]
- [x] Copy lib/domains/app/devpulse/* → routes/(app)/devpulse/
- [x] Copy lib/domains/app/devforge/* → routes/(app)/devforge/
- [x] Copy lib/domains/app/overmind/* → routes/(app)/overmind/
- [x] Copy lib/domains/app/ui-demo/* → routes/(app)/ui-demo/
- [x] Copy lib/domains/app/wiredfront/* → routes/(app)/wiredfront/
- [x] Copy lib/domains/app/clyffy/* → routes/(app)/clyffy/

### Phase 2: Update +page.svelte Imports [DONE]
- [x] devpulse/+page.svelte: `'./features/dashboard/pages/DevPulseDashboard.svelte'`
- [x] ui-demo/+page.svelte: `'./pages/UIDemoPage.svelte'`
- [ ] Others are placeholders (no imports to update)

### Phase 3: Delete Old Source [DONE]
- [x] Delete lib/domains/app/

### Phase 4: Update Domain Contracts [IN PROGRESS]
Remove obsolete `pageModule` from DomainMetadata (URL-driven routing doesn't need it):

- [x] Update domain.contract.ts: remove pageModule, add optional route
- [x] Update devpulse.contract.ts: remove pageModule
- [ ] Update devforge.contract.ts: remove pageModule
- [ ] Update clyffy.contract.ts: remove pageModule
- [ ] Update overmind.contract.ts: remove pageModule
- [ ] Update ui-demo.contract.ts: remove pageModule
- [ ] Update wiredfront.contract.ts: remove pageModule

### Phase 5: Verify [PENDING]
- [ ] Run `pnpm dev` - no errors
- [ ] Navigate to each domain URL
- [ ] Run `pnpm check` - TypeScript passes

---

## What STAYS in lib/

| Directory | Purpose | Reason |
|-----------|---------|--------|
| `lib/layouts/` | App shell (Frame, Sidebar) | Shared by all routes via (app)/+layout.svelte |
| `lib/design/` | ColdLight design system | Shared primitives, tokens, components |
| `lib/sys/` | Contracts, registries | Platform infrastructure |
| `lib/test/` | Test utilities | Shared test helpers |

---

## What Gets DELETED

| Directory | Reason |
|-----------|--------|
| `lib/domains/app/` | Moved to routes/(app)/ |

---

## Contract Changes

**domain.contract.ts BEFORE:**
```typescript
export interface DomainMetadata {
  id: string;
  label: string;
  icon: string;
  status: DomainStatus;
  pageModule: string;        // REMOVED - obsolete with URL routing
  defaultFeature?: string;
  order: number;
}
```

**domain.contract.ts AFTER:**
```typescript
export interface DomainMetadata {
  id: string;                // matches route path
  label: string;
  icon: string;
  status: DomainStatus;
  route?: string;            // optional, defaults to /{id}
  defaultFeature?: string;
  order: number;
}
```

---

## Remaining lib/domains/

After app/ deletion, lib/domains/ still contains:
- `chat/` - empty (README only)
- `common/` - empty
- `clyffy/` - empty (README only)
- `notify/` - empty

These are scaffolding for future domains. Leave as-is or delete if not needed.
