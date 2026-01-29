# ColdLight Adapter Architecture

## STATUS: NOTHING IS TESTED OR APPROVED YET

All 49+ primitives need to be faithfully implemented following this architecture.
Current Svelte components are NOT tested, NOT approved, NOT real yet.

---

## The Two-Layer System

### Layer 1: TAXONOMY (Declaration)

Location: `src/lib/design/taxonomy/`

**Adapter declarations:**
```
taxonomy/api/adapters/
├── meltui/
│   ├── types.ts        # Type declarations for MeltUI adapter
│   └── contract.ts     # Contract declaring MeltUI adapter capabilities
└── coldlight/
    ├── types.ts        # Type declarations for ColdLight adapter
    └── contract.ts     # Contract declaring ColdLight adapter capabilities
```

**Primitive declarations:**
```
taxonomy/kinds/primitives/
├── accordion/contract.ts
├── alert-dialog/contract.ts
├── avatar/contract.ts
├── button/contract.ts
├── calendar/contract.ts
├── checkbox/contract.ts
├── collapsible/contract.ts
├── combobox/contract.ts
├── context-menu/contract.ts
├── date-field/contract.ts
├── date-picker/contract.ts
├── date-range-field/contract.ts
├── date-range-picker/contract.ts
├── dialog/contract.ts
├── dropdown-menu/contract.ts
├── label/contract.ts
├── link-preview/contract.ts
├── menubar/contract.ts
├── pagination/contract.ts
├── pin-input/contract.ts
├── popover/contract.ts
├── progress/contract.ts
├── radio-group/contract.ts
├── range-calendar/contract.ts
├── scroll-area/contract.ts
├── select/contract.ts
├── separator/contract.ts
├── slider/contract.ts
├── switch/contract.ts
├── table-of-contents/contract.ts
├── tabs/contract.ts
├── tags-input/contract.ts
├── toggle/contract.ts
├── toggle-group/contract.ts
├── toolbar/contract.ts
├── tooltip/contract.ts
├── tree/contract.ts
└── ... (49+ total)
```

Each contract declares:
- `kind` - primitive name
- `slots` - all slots this primitive has
- `requiredSlots` - slots that MUST be rendered
- `states` - all possible states
- `aria` - role and required attributes
- `keyboard` - keyboard interactions

**NO PROVIDER IN CONTRACTS** - that's implementation detail

---

### Layer 2: API (Implementation)

Location: `src/lib/design/api/adapter/`

**MeltUI adapter implementations:**
```
api/adapter/meltui/
├── accordion/
│   ├── contract.ts
│   ├── types.ts
│   ├── accordion.ts
│   └── index.ts
├── alert-dialog/
├── avatar/
├── button/
├── calendar/
├── checkbox/
├── collapsible/
├── combobox/
├── context-menu/
├── date-field/
├── date-picker/
├── date-range-field/
├── date-range-picker/
├── dialog/
├── dropdown-menu/
├── label/
├── link-preview/
├── menubar/
├── pagination/
├── pin-input/
├── popover/
├── progress/
├── radio-group/
├── range-calendar/
├── scroll-area/
├── select/
├── separator/
├── slider/
├── switch/
├── table-of-contents/
├── tabs/
├── tags-input/
├── toggle/
├── toggle-group/
├── toolbar/
├── tooltip/
├── tree/
└── ... (matching taxonomy 1:1)
```

**ColdLight adapter implementations:**
```
api/adapter/coldlight/
├── accordion/
├── alert-dialog/
├── avatar/
├── button/
├── calendar/
├── checkbox/
├── collapsible/
├── combobox/
├── context-menu/
├── date-field/
├── date-picker/
├── date-range-field/
├── date-range-picker/
├── dialog/
├── dropdown-menu/
├── label/
├── link-preview/
├── menubar/
├── pagination/
├── pin-input/
├── popover/
├── progress/
├── radio-group/
├── range-calendar/
├── scroll-area/
├── select/
├── separator/
├── slider/
├── switch/
├── table-of-contents/
├── tabs/
├── tags-input/
├── toggle/
├── toggle-group/
├── toolbar/
├── tooltip/
├── tree/
└── ... (matching taxonomy 1:1)
```

---

### Layer 3: PRIMITIVES (Svelte Components)

Location: `src/lib/design/primitives/`

```
primitives/
├── accordion/
│   ├── Accordion.svelte
│   ├── Accordion.test.ts
│   └── README.md          # Auto-generated with diagrams
├── alert-dialog/
├── avatar/
├── button/
├── calendar/
├── checkbox/
├── collapsible/
├── combobox/
├── context-menu/
├── date-field/
├── date-picker/
├── date-range-field/
├── date-range-picker/
├── dialog/
├── dropdown-menu/
├── label/
├── link-preview/
├── menubar/
├── pagination/
├── pin-input/
├── popover/
├── progress/
├── radio-group/
├── range-calendar/
├── scroll-area/
├── select/
├── separator/
├── slider/
├── switch/
├── table-of-contents/
├── tabs/
├── tags-input/
├── toggle/
├── toggle-group/
├── toolbar/
├── tooltip/
├── tree/
└── ... (matching taxonomy 1:1)
```

Each primitive:
- Uses ColdLight adapter (agnostic public API)
- ARIA baked in
- Tests required
- Documentation auto-generated as we code

---

## WHY THIS ARCHITECTURE

1. **ColdLight = agnostic public API** - can add providers beyond meltui
2. **ColdLight = reusable** - use across ALL projects
3. **Taxonomy = WHAT** - declarations only, no implementation
4. **API = HOW** - implementations per provider
5. **Primitives = USE** - consume ColdLight, not meltui directly

---

## WORKFLOW

1. Add primitive contract to `taxonomy/kinds/primitives/{name}/contract.ts`
2. Add meltui implementation to `api/adapter/meltui/{name}/`
3. Add coldlight implementation to `api/adapter/coldlight/{name}/`
4. Create Svelte component in `primitives/{name}/`
5. Write tests
6. Documentation auto-generates

---

## CURRENT STATE

- [ ] Taxonomy adapter contracts: NOT DONE
- [ ] Primitive contracts: 3 done (button, dialog, tabs), 46+ pending
- [ ] MeltUI adapter implementations: dialog only, NOT TESTED
- [ ] ColdLight adapter implementations: dialog only, NOT TESTED
- [ ] Svelte primitives: NONE APPROVED
- [ ] Tests: NONE
- [ ] Documentation: NONE
