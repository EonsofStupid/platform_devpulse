# COLDLIGHT MASTER INVENTORY

> **Created:** 2026-01-30
> **Purpose:** Track every file, flag issues, fix one by one
> **Rule:** Nothing gets deleted until captured and reviewed

---

## STATUS LEGEND

| Status | Meaning |
|--------|---------|
| ✅ | Complete - matches architecture |
| ⚠️ | Exists but needs fixes |
| ❌ | Missing - needs creation |
| 🗑️ | Flagged for deletion after review |
| 📦 | Archive - valuable code to extract |

---

## 1. CONTRACTS (taxonomy/kinds/primitives/)

| Kind | Contract Exists | Issues | Status |
|------|-----------------|--------|--------|
| button | ✅ `taxonomy/kinds/primitives/button/contract.ts` | None identified | ✅ |
| dialog | ✅ `taxonomy/kinds/primitives/dialog/contract.ts` | None identified | ✅ |
| tabs | ✅ `taxonomy/kinds/primitives/tabs/contract.ts` | None identified | ✅ |
| accordion | ❌ | Needs creation | ❌ |
| alert-dialog | ❌ | Has archive code | 📦 |
| checkbox | ❌ | Needs creation | ❌ |
| collapsible | ❌ | Needs creation | ❌ |
| combobox | ❌ | Needs creation | ❌ |
| context-menu | ❌ | Needs creation | ❌ |
| dropdown-menu | ❌ | Needs creation | ❌ |
| label | ❌ | Needs creation | ❌ |
| link-preview | ❌ | Needs creation | ❌ |
| menubar | ❌ | Needs creation | ❌ |
| pagination | ❌ | Needs creation | ❌ |
| pin-input | ❌ | Needs creation | ❌ |
| popover | ❌ | Has archive code | 📦 |
| progress | ❌ | Needs creation | ❌ |
| radio-group | ❌ | Needs creation | ❌ |
| select | ❌ | Has archive code | 📦 |
| separator | ❌ | Needs creation | ❌ |
| slider | ❌ | Needs creation | ❌ |
| switch | ❌ | Needs creation | ❌ |
| sheet | ❌ | Has archive code | 📦 |
| tags-input | ❌ | Needs creation | ❌ |
| toggle | ❌ | Needs creation | ❌ |
| toggle-group | ❌ | Needs creation | ❌ |
| toolbar | ❌ | Needs creation | ❌ |
| tooltip | ❌ | Has archive code | 📦 |
| tree | ❌ | Needs creation | ❌ |

---

## 2. ADAPTER IMPLEMENTATIONS (api/adapters/meltui/_internal/)

| Kind | Factory Exists | Issues | Status |
|------|----------------|--------|--------|
| tabs | ✅ `factory.ts`, `tabs.ts`, `types.ts`, `index.ts` | None identified | ✅ |
| dialog | ✅ `factory.ts`, `dialog.ts`, `types.ts`, `index.ts` | None identified | ✅ |
| button | N/A (ariaStateProvider: coldlight) | No adapter needed | ✅ |
| All others | ❌ | Need creation when primitives built | ❌ |

---

## 3. PRIMITIVES (primitives/{kind}/)

### Active Primitives
| Kind | Svelte Components | Issues | Status |
|------|-------------------|--------|--------|
| tanstack | ✅ table utilities | Not a primitive - utility | ⚠️ |

### Archived Primitives (primitives/_archive/)

| Kind | Files | Valuable Content | Status |
|------|-------|------------------|--------|
| alert-dialog | 14 files | Root, Trigger, Content, Overlay, Portal, Title, Description, Action, Cancel, types, index, tests, a11y.md | 📦 |
| button | 6 files | Button.svelte, types, index, tests, a11y.md | 📦 |
| dialog | 13 files | Root, Trigger, Content, Overlay, Portal, Title, Description, Close, types, index, tests, a11y.md | 📦 |
| popover | 12 files | Root, Trigger, Content, Overlay, Portal, Arrow, Close, types, index, tests, a11y.md | 📦 |
| select | 19 files | Root, Trigger, Content, Portal, Item, ItemGroup, GroupLabel, ItemText, Arrow, Separator, ScrollUp, ScrollDown, Viewport, types, index, tests, a11y.md, AUDIT.md | 📦 |
| sheet | 13 files | Root, Trigger, Content, Overlay, Portal, Title, Description, Close, types, index, tests, a11y.md | 📦 |
| tabs | 9 files | Root, List, Trigger, Content, types, index, tests, a11y.md | 📦 |
| tooltip | 11 files | Root, Trigger, Content, Portal, Arrow, Provider, types, index, tests, a11y.md | 📦 |

**ARCHIVE ISSUES:**
- All import MeltUI directly (should use adapter factory)
- Some reference "Bits UI" in a11y.md (outdated - now MeltUI)
- types.ts may have drift from contract

---

## 4. DOCUMENTATION FILES (97 total)

### CANONICAL (docs/)
| File | Purpose | Status |
|------|---------|--------|
| docs/DESIGN_BOOK.md | Master specification | ⚠️ Needs review |
| docs/LAWS.md | Frozen rules | ⚠️ Needs review |
| docs/TERMINOLOGY.md | Vocabulary | ⚠️ Needs review |
| docs/BLUEPRINTS.md | Prebuilt assemblies | ⚠️ Needs review |
| docs/GENERATOR.md | Auto-doc pipeline | ⚠️ Needs review |
| docs/GIT_DISCIPLINE.md | Git rules | ⚠️ Needs review |
| docs/primitives.md | Primitives reference | ⚠️ Needs review |
| docs/recipes.md | Recipes reference | ⚠️ Needs review |
| docs/taxonomy.md | Taxonomy reference | ⚠️ Needs review |
| docs/tokens.md | Tokens reference | ⚠️ Needs review |
| docs/notes.md | Misc notes | 🗑️ Review then delete |
| docs/techrefs/bits-ui-cold-light-spec.md | Tech reference | ⚠️ Outdated name |
| docs/techrefs/bits-ui-v2.15.4-complete.md | Tech reference | ⚠️ Outdated name |

### ROOT LEVEL
| File | Purpose | Status |
|------|---------|--------|
| AUTHORING.md | How to author | ⚠️ Review |
| CHANGELOG.md | Change log | ✅ Keep |
| CLASS_COMPOSITION.md | Class system | ⚠️ Review |
| CLAUDE.md | Claude instructions | ⚠️ Review/consolidate |
| COLDLIGHT.md | System overview | ⚠️ Duplicate of DESIGN_BOOK? |
| CONTRACT_SYSTEM.md | Contract docs | ⚠️ Review |
| DesignArchitecture.md | Architecture | ⚠️ Duplicate? |
| MASTER-PLAN.md | Master plan | ⚠️ Review |
| PRESET_SYSTEM.md | Presets | ⚠️ Review |
| PROP_TAXONOMY_CAPTURE.md | Props capture | ⚠️ Review |
| README.md | Root readme | ⚠️ Review |
| SPRINT-PRIMITIVES.md | Sprint | ⚠️ Review |
| STYLE_GUIDE.md | Style guide | ⚠️ Review |
| TAXONOMY.md | Taxonomy | ⚠️ Duplicate of taxonomy/README? |
| TOKEN_PIPELINE.md | Token pipeline | ⚠️ Review |
| VITE_PLUGIN_SPEC.md | Vite plugin | ⚠️ Review |

### .claude/ FOLDER (AI INSTRUCTIONS)
| File | Purpose | Status |
|------|---------|--------|
| .claude/ADAPTER_ARCHITECTURE.md | Adapter arch | ⚠️ Review |
| .claude/ARCHITECTURE.md | General arch | ⚠️ Review |
| .claude/CLAUDE.md | Instructions | ⚠️ Consolidate with root |
| .claude/COLDLIGHT_CATALOG.md | Catalog | ⚠️ Review |
| .claude/MASTER_SPRINT_PLAN.md | Sprint | 🗑️ Stale? |
| .claude/PROVIDER_ADAPTER_PLAN.md | Provider plan | 🗑️ Stale? |
| .claude/RECOVERY_LOG.md | Recovery | 🗑️ Delete |
| .claude/SPRINT-4-FOLDER-PARITY-v2.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-4-FOLDER-PARITY.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-ADAPTER-FOUNDATION.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-COLDLIGHT-ENFORCEMENT.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-CONTRACTS-FOUNDATION.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-IMPORT-STANDARDIZATION.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-PRIMITIVE-PARITY-POLICY.md | Sprint | 🗑️ Stale? |
| .claude/SPRINT-TAXONOMY-ADAPTER-REGISTRY.md | Sprint | 🗑️ Stale? |

### .cowlevel/ (GENERATED DOCS)
| Files | Purpose | Status |
|-------|---------|--------|
| .cowlevel/typedoc/media/*.md | TypeDoc copies | 🗑️ Auto-generated |

### FOLDER-SPECIFIC READMEs
| File | Purpose | Status |
|------|---------|--------|
| api/adapters/meltui/.claude/*.md | Adapter instructions | ⚠️ Review |
| blocks/README.md | Blocks overview | ⚠️ Review |
| blocks/{category}/README.md | Category readmes | ⚠️ Review all |
| patterns/README.md | Patterns | ⚠️ Review |
| patterns/{type}/README.md | Pattern types | ⚠️ Review |
| primitives/README.md | Primitives | ⚠️ Review |
| primitives/.claude/*.md | Instructions | ⚠️ Consolidate |
| primitives/sprints/SPRINT-01.md | Sprint | 🗑️ Stale? |
| primitives/_archive/{kind}/a11y.md | A11y specs | 📦 VALUABLE - merge to contracts |
| recipes/readme.md | Recipes | ⚠️ Review |
| semantics/README.md | Semantics | ⚠️ Review |
| semantics/{type}/README.md | Semantic types | ⚠️ Review |
| taxonomy/README.md | Taxonomy | ⚠️ Review |
| tokens/README.md | Tokens | ⚠️ Review |
| tokens/rewrite-probablytrash.md | Notes | 🗑️ Delete |

---

## 5. STANDALONE ARCHIVE FILES (primitives/_archive/)

| File | Purpose | Status |
|------|---------|--------|
| Alert.svelte | Alert component | 📦 Not a primitive - semantic? |
| Badge.svelte | Badge component | 📦 Not a primitive - semantic? |
| Breadcrumb.svelte | Breadcrumb | 📦 Not a primitive - semantic? |
| ButtonGroup.svelte | Button group | 📦 Composite? |
| Card.svelte | Card | 📦 Semantic? |
| Carousel.svelte | Carousel | 📦 Composite? |
| Chart.svelte | Chart | 📦 Utility? |
| DataTable.svelte | Data table | 📦 Composite? |
| Empty.svelte | Empty state | 📦 Semantic? |
| Field.svelte | Form field | 📦 Pattern? |
| FocusTrap.svelte | Focus trap | 📦 Utility |
| Form.svelte | Form | 📦 Pattern? |
| InputEmail.svelte | Email input | 📦 Semantic? |
| InputGroup.svelte | Input group | 📦 Composite? |
| InputNumber.svelte | Number input | 📦 Semantic? |
| InputOTP.svelte | OTP input | 📦 Semantic? |
| InputPassword.svelte | Password input | 📦 Semantic? |
| InputText.svelte | Text input | 📦 Semantic? |
| Kbd.svelte | Keyboard display | 📦 Semantic? |
| LiveStatus.svelte | Live region | 📦 Utility? |
| NativeSelect.svelte | Native select | 📦 Semantic? |
| NavMenu.svelte | Nav menu | 📦 Composite? |
| Portal.svelte | Portal | 📦 Utility |
| Presence.svelte | Presence | 📦 Utility |
| Sidebar.svelte | Sidebar | 📦 Block? |
| Skeleton.svelte | Skeleton | 📦 Semantic? |
| Spinner.svelte | Spinner | 📦 Semantic? |
| Table.svelte | Table | 📦 Composite? |
| Textarea.svelte | Textarea | 📦 Semantic? |
| Toast.svelte | Toast | 📦 Composite? |
| Typography.svelte | Typography | 📦 Utility? |
| VisuallyHidden.svelte | SR only | 📦 Utility |

---

## 6. IMMEDIATE ISSUES TO ADDRESS

### HIGH PRIORITY
1. **Archive primitives import MeltUI directly** - must refactor to use adapter factory
2. **a11y.md files have valuable ARIA specs** - merge into contracts
3. **No primitives exist in active location** - all in _archive
4. **97 markdown files** - many duplicates, stale sprints

### MEDIUM PRIORITY
1. **Standalone archive components** - need classification (semantic/composite/utility/block)
2. **bits-ui references** - outdated, now meltui
3. **.claude folders everywhere** - consolidate to one

### LOW PRIORITY
1. **TypeDoc generated copies** - can regenerate
2. **Old sprint files** - review then delete

---

## 7. WORK ORDER

### Phase 1: Document Consolidation
- [ ] Review each doc in docs/
- [ ] Flag duplicates
- [ ] Update outdated content
- [ ] Delete stale sprints

### Phase 2: Archive Migration (per kind)
- [ ] button: Extract from archive, validate against contract, fix imports
- [ ] tabs: Extract from archive, validate against contract, fix imports
- [ ] dialog: Extract from archive, validate against contract, fix imports
- [ ] (continue for each archived kind)

### Phase 3: Archive Capture (standalone components)
- [ ] Classify each standalone component
- [ ] Move to appropriate layer (semantic/composite/utility/block)
- [ ] Create contracts where needed

### Phase 4: New Primitives
- [ ] Create contracts for remaining 24 MeltUI-backed primitives
- [ ] Build out implementations

---

**This is the source of truth for tracking progress.**
