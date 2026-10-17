# Sprint: Schema Foundation

| Field | Value |
|-------|-------|
| Name | `SCHEMA-FOUNDATION` |
| Created | `2026-02-23` |
| Status | `IN PROGRESS` |
| Layer | `catalog / primitives` |

---

## Goal

Create PrimitiveContract declarations for ALL ColdLight kinds. Button exists as gold standard. Everything else is missing. Schemas are the SSOT — nothing builds without them.

## Architecture Decision

- **Contracts go in `catalog/kinds/primitives/{kind}/`** (following button gold standard)
- Scanner currently scans `taxonomy/kinds/primitives/` — needs `catalogRoot` fix
- Each kind gets: `types.ts`, `contract.ts`, `index.ts`
- `ariaStateProvider: "meltui"` for kinds backed by melt v0.44 builders
- `ariaStateProvider: "coldlight"` for ColdLight-owned kinds (button, separator, label)

---

## Phase 0: Fix Scanner Root

- [ ] 0.1 Add `catalogRoot` to `config/coldlight/roots.cfg.ts`
- [ ] 0.2 Add `catalogRoot` to `config/coldlight/types.ts` ColdLightConfig
- [ ] 0.3 Update `catalog/scanner.ts` clPrimitives path to use catalogRoot

---

## Phase 1: Contracts with Existing Adapters

### 1.1 dialog (meltui)
- [ ] `catalog/kinds/primitives/dialog/types.ts`
- [ ] `catalog/kinds/primitives/dialog/contract.ts`
- [ ] `catalog/kinds/primitives/dialog/index.ts`

### 1.2 tabs (meltui)
- [ ] `catalog/kinds/primitives/tabs/types.ts`
- [ ] `catalog/kinds/primitives/tabs/contract.ts`
- [ ] `catalog/kinds/primitives/tabs/index.ts`

### 1.3 combobox (meltui)
- [ ] `catalog/kinds/primitives/combobox/types.ts`
- [ ] `catalog/kinds/primitives/combobox/contract.ts`
- [ ] `catalog/kinds/primitives/combobox/index.ts`

**Verify:** `pnpm svelte-check` from `interfaces/desktop`

---

## Phase 2: Disclosure/Overlay Patterns

### 2.1 accordion (meltui)
### 2.2 collapsible (meltui)
### 2.3 popover (meltui)
### 2.4 tooltip (meltui)

Each: types.ts, contract.ts, index.ts

**Verify:** `pnpm svelte-check`

---

## Phase 3: Selection/Value Patterns

### 3.1 select (meltui)
### 3.2 radio-group (meltui)
### 3.3 toggle (meltui)
### 3.4 slider (meltui)
### 3.5 progress (meltui)

Each: types.ts, contract.ts, index.ts

**Verify:** `pnpm svelte-check`

---

## Phase 4: Misc Melt-Backed

### 4.1 avatar (meltui)
### 4.2 pin-input (meltui)
### 4.3 file-upload (meltui)
### 4.4 toaster (meltui)
### 4.5 tree (meltui)

Each: types.ts, contract.ts, index.ts

**Verify:** `pnpm svelte-check`

---

## Phase 5: ColdLight-Owned

### 5.1 separator (coldlight)
### 5.2 label (coldlight)

Each: types.ts, contract.ts, index.ts

**Verify:** `pnpm svelte-check`

---

## Phase 6: Rune-Based Registry

- [ ] 6.1 Create `catalog/registry.svelte.ts` — Svelte 5 rune-based reactive registry
- [ ] 6.2 Loads all contracts, validates via Zod, tracks status
- [ ] 6.3 Exposes reactive state: loaded kinds, missing kinds, validation errors
- [ ] 6.4 Extends from coldlight.config.ts
- [ ] 6.5 VPB-observable interface

**Verify:** `pnpm svelte-check`

---

## Phase 7: Config Integration

- [ ] 7.1 Wire registry into coldlight.config.ts
- [ ] 7.2 Full `pnpm svelte-check` pass
- [ ] 7.3 Full `pnpm build` pass

---

## Kind Inventory (22 total)

| # | Kind | Engine | APG Pattern | Status |
|---|------|--------|-------------|--------|
| 1 | button | coldlight | Button | EXISTS |
| 2 | dialog | meltui | Dialog (Modal) | Phase 1 |
| 3 | tabs | meltui | Tabs | Phase 1 |
| 4 | combobox | meltui | Combobox | Phase 1 |
| 5 | accordion | meltui | Accordion | Phase 2 |
| 6 | collapsible | meltui | Disclosure | Phase 2 |
| 7 | popover | meltui | Dialog variant | Phase 2 |
| 8 | tooltip | meltui | Tooltip | Phase 2 |
| 9 | select | meltui | Listbox | Phase 3 |
| 10 | radio-group | meltui | Radio Group | Phase 3 |
| 11 | toggle | meltui | Switch/Toggle | Phase 3 |
| 12 | slider | meltui | Slider | Phase 3 |
| 13 | progress | meltui | Meter/Progress | Phase 3 |
| 14 | avatar | meltui | (custom) | Phase 4 |
| 15 | pin-input | meltui | (custom) | Phase 4 |
| 16 | file-upload | meltui | (custom) | Phase 4 |
| 17 | toaster | meltui | Alert (live) | Phase 4 |
| 18 | tree | meltui | Tree View | Phase 4 |
| 19 | separator | coldlight | Separator | Phase 5 |
| 20 | label | coldlight | Label | Phase 5 |
