# ColdLight ARIA Schema Design

> **Status**: DRAFT - Pending Review
> **Reference**: W3C WAI-ARIA APG 1.2 (https://www.w3.org/WAI/ARIA/apg/)
> **Goal**: Schema-enforced, gold-standard ARIA contracts for AI-ready components

---

## 1. Why This Matters

AI agents using accessibility data complete tasks **85%** of the time vs **50%** for visual-only.
OpenAI Atlas explicitly uses ARIA tags. This is foundational for AI-driven UI evolution.

---

## 2. Current Gaps vs W3C APG Gold Standard

| Aspect | Current State | APG Gold Standard | Gap |
|--------|---------------|-------------------|-----|
| **Keyboard** | Flat array of keys | Context-dependent (orientation, focus location) | Missing context mapping |
| **Focus Management** | Single string (`"roving"`) | Specific rules (where to move on open/close/escape) | Missing specifics |
| **Slot Relationships** | Implicit (`aria-controls`) | Explicit declaration of which slot references which | Missing relationship graph |
| **Selection Model** | Not captured | Auto-activate vs manual, single vs multi | Missing entirely |
| **Orientation Impact** | Single `orientation` field | Orientation changes which keys do what | Missing key→orientation mapping |

---

## 3. Proposed Schema Extensions

### 3.1 Typed Enums (No Loose Strings)

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// ARIA ROLE CATEGORIES — Organized by WAI-ARIA spec
// ═══════════════════════════════════════════════════════════════════════════

export const ARIA_ROLE_CATEGORIES = {
  widget: [
    "button", "checkbox", "combobox", "grid", "gridcell", "link", "listbox",
    "menu", "menubar", "menuitem", "menuitemcheckbox", "menuitemradio",
    "option", "progressbar", "radio", "radiogroup", "scrollbar", "searchbox",
    "separator", "slider", "spinbutton", "switch", "tab", "tablist", "tabpanel",
    "textbox", "toolbar", "tooltip", "tree", "treegrid", "treeitem",
  ],
  document: [
    "dialog", "alertdialog", "alert", "group", "img", "log", "navigation",
    "note", "region", "status", "timer",
  ],
  landmark: [
    "banner", "complementary", "contentinfo", "form", "main", "navigation",
    "region", "search",
  ],
  presentation: ["none", "presentation"],
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ARIA ATTRIBUTE CATEGORIES — Organized by function
// ═══════════════════════════════════════════════════════════════════════════

export const ARIA_ATTR_CATEGORIES = {
  relationship: [
    "aria-activedescendant", "aria-controls", "aria-describedby", "aria-details",
    "aria-flowto", "aria-labelledby", "aria-owns",
  ],
  state: [
    "aria-checked", "aria-disabled", "aria-expanded", "aria-hidden",
    "aria-invalid", "aria-pressed", "aria-selected",
  ],
  property: [
    "aria-autocomplete", "aria-errormessage", "aria-haspopup", "aria-label",
    "aria-level", "aria-modal", "aria-multiline", "aria-multiselectable",
    "aria-orientation", "aria-placeholder", "aria-readonly", "aria-required",
    "aria-sort", "aria-valuemax", "aria-valuemin", "aria-valuenow", "aria-valuetext",
  ],
  liveRegion: ["aria-atomic", "aria-busy", "aria-live", "aria-relevant"],
  position: [
    "aria-colcount", "aria-colindex", "aria-colspan", "aria-posinset",
    "aria-rowcount", "aria-rowindex", "aria-rowspan", "aria-setsize",
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// FOCUS STRATEGY — Specific behaviors, not just names
// ═══════════════════════════════════════════════════════════════════════════

export const FOCUS_STRATEGIES = {
  trap: {
    description: "Focus locked inside container",
    onOpen: "first-focusable", // or specific slot
    onEscape: "return-to-trigger",
    tabBehavior: "cycle-within",
  },
  roving: {
    description: "Roving tabindex among siblings",
    tabBehavior: "single-stop", // only active element in tab sequence
    arrowBehavior: "navigate-siblings",
    wrapAround: true,
  },
  activedescendant: {
    description: "DOM focus stays on container, aria-activedescendant changes",
    domFocusElement: "input" | "container",
    arrowBehavior: "update-activedescendant",
  },
  redirect: {
    description: "Focus moves to specific target",
    target: "content" | "first-focusable",
  },
  none: {
    description: "No special focus management",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD CONTEXT — Keys mapped to orientation and focus location
// ═══════════════════════════════════════════════════════════════════════════

export interface KeyboardContext {
  /** Which orientation this mapping applies to */
  orientation: "horizontal" | "vertical" | "both";
  /** Where focus is when this key is pressed */
  focusLocation: string; // slot name
  /** The key */
  key: KeyboardKey;
  /** What happens */
  action: KeyboardAction;
  /** Whether this key mapping is required or optional per APG */
  required: boolean;
}

export const KEYBOARD_ACTIONS = [
  "next-item",        // Move to next sibling
  "prev-item",        // Move to previous sibling
  "first-item",       // Move to first sibling
  "last-item",        // Move to last sibling
  "activate",         // Activate/select current
  "toggle",           // Toggle state
  "open",             // Open popup/content
  "close",            // Close popup/content
  "exit-to-trigger",  // Return focus to trigger
  "delete",           // Delete current item
  "type-ahead",       // Character navigation
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// SLOT RELATIONSHIPS — Explicit graph
// ═══════════════════════════════════════════════════════════════════════════

export interface SlotRelationship {
  /** The slot that HAS the aria attribute */
  sourceSlot: string;
  /** The aria attribute */
  attribute: "aria-controls" | "aria-labelledby" | "aria-describedby" | "aria-owns";
  /** The slot that is REFERENCED */
  targetSlot: string;
  /** Whether this relationship is required or optional */
  required: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECTION MODEL — APG-specified behaviors
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectionModel {
  /** Single or multi-select */
  type: "single" | "multiple";
  /** Does moving focus automatically select? (APG: "selection follows focus") */
  selectionFollowsFocus: boolean;
  /** For multi-select: which interaction model? */
  multiSelectModel?: "recommended" | "alternative";
}
```

### 3.2 Enhanced PrimitiveContract

```typescript
export interface PrimitiveContractV2<
  TKind extends string = string,
  TSlot extends string = string,
  TState extends StateToken = StateToken,
> {
  readonly kind: TKind;
  readonly ariaStateProvider: AriaStateProvider;

  // ── Structure (unchanged) ──────────────────────────────────────────────────
  readonly slots: {
    readonly required: readonly TSlot[];
    readonly optional: readonly TSlot[];
    readonly forbidden: readonly string[];
  };
  readonly slotSpec: Record<TSlot, SlotSpec>;

  // ── State (unchanged) ──────────────────────────────────────────────────────
  readonly states: {
    readonly shared: readonly TState[];
    readonly specific: readonly TState[];
  };
  readonly slotStates: SlotStateMap<TSlot, TState>;
  readonly slotActions: Record<TSlot, readonly SlotAction[]>;

  // ── ARIA (enhanced) ────────────────────────────────────────────────────────
  readonly aria: {
    /** Primary role for the primitive */
    readonly role: AriaRole;
    /** Primitive-level required attributes */
    readonly requiredAttrs: readonly AriaAttribute[];
    /** Primitive-level optional attributes */
    readonly optionalAttrs: readonly AriaAttribute[];
  };

  // ══ NEW: Slot Relationships ══════════════════════════════════════════════
  /**
   * Explicit relationship graph between slots.
   * Declares which slots reference which via aria-controls, aria-labelledby, etc.
   * Scanner validates these relationships exist in rendered output.
   */
  readonly slotRelationships: readonly SlotRelationship[];

  // ── Keyboard (enhanced) ────────────────────────────────────────────────────
  /**
   * Context-aware keyboard mappings.
   * Keys mapped to orientation and focus location per APG spec.
   */
  readonly keyboardMap: readonly KeyboardContext[];

  // ── Focus (enhanced) ───────────────────────────────────────────────────────
  /**
   * Detailed focus management specification.
   */
  readonly focus: {
    /** Primary strategy */
    readonly strategy: FocusStrategy;
    /** Where focus goes when primitive opens (for disclosure patterns) */
    readonly onOpen?: TSlot | "first-focusable";
    /** Where focus goes when Escape is pressed */
    readonly onEscape?: "return-to-trigger" | "close-only" | TSlot;
    /** Whether Tab cycles within or exits */
    readonly tabBehavior?: "cycle-within" | "exit-on-boundary";
    /** Whether arrow navigation wraps around */
    readonly wrapAround?: boolean;
  };

  // ══ NEW: Selection Model ═════════════════════════════════════════════════
  /**
   * For selectable primitives (tabs, listbox, combobox, etc.)
   */
  readonly selection?: SelectionModel;

  // ── Behavior (unchanged) ───────────────────────────────────────────────────
  readonly compound: boolean;
  readonly orientation?: Orientation;
  readonly dismissBehavior?: DismissBehavior;
}
```

---

## 4. Example: Tabs Contract (Gold Standard)

```typescript
export const contract: PrimitiveContractV2<"tabs", TabsSlot, TabsState> = {
  kind: "tabs",
  ariaStateProvider: "meltui",

  slots: {
    required: ["root", "list", "trigger", "content"],
    optional: [],
    forbidden: [],
  },

  slotSpec: {
    root: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
    list: {
      element: "div",
      children: "snippet",
      aria: {
        role: "tablist",
        required: ["aria-orientation"],
        optional: ["aria-label", "aria-labelledby"],
      },
    },
    trigger: {
      element: "button",
      children: "snippet",
      aria: {
        role: "tab",
        required: ["aria-selected", "aria-controls"],
        optional: ["aria-disabled", "aria-haspopup"],
      },
    },
    content: {
      element: "div",
      children: "snippet",
      aria: {
        role: "tabpanel",
        required: ["aria-labelledby"],
        optional: ["aria-hidden"],
      },
    },
  },

  // ══ SLOT RELATIONSHIPS ═══════════════════════════════════════════════════
  slotRelationships: [
    { sourceSlot: "trigger", attribute: "aria-controls", targetSlot: "content", required: true },
    { sourceSlot: "content", attribute: "aria-labelledby", targetSlot: "trigger", required: true },
  ],

  states: {
    shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
    specific: ["hidden", "visible", "selected"],
  },
  slotStates: tabsSlotStates,
  slotActions: {
    root: [],
    list: [],
    trigger: ["select"],
    content: [],
  },

  aria: {
    role: "tablist",
    requiredAttrs: ["aria-orientation"],
    optionalAttrs: [
      "aria-label", "aria-labelledby", "aria-disabled",
      "aria-describedby", "aria-selected", "aria-controls",
    ],
  },

  // ══ KEYBOARD MAP (APG-Compliant) ════════════════════════════════════════
  keyboardMap: [
    // Horizontal orientation
    { orientation: "horizontal", focusLocation: "trigger", key: "ArrowRight", action: "next-item", required: true },
    { orientation: "horizontal", focusLocation: "trigger", key: "ArrowLeft", action: "prev-item", required: true },
    // Vertical orientation (optional per APG)
    { orientation: "vertical", focusLocation: "trigger", key: "ArrowDown", action: "next-item", required: true },
    { orientation: "vertical", focusLocation: "trigger", key: "ArrowUp", action: "prev-item", required: true },
    // Both orientations
    { orientation: "both", focusLocation: "trigger", key: "Home", action: "first-item", required: false },
    { orientation: "both", focusLocation: "trigger", key: "End", action: "last-item", required: false },
    { orientation: "both", focusLocation: "trigger", key: "Enter", action: "activate", required: false },
    { orientation: "both", focusLocation: "trigger", key: "Space", action: "activate", required: false },
    { orientation: "both", focusLocation: "trigger", key: "Delete", action: "delete", required: false },
  ],

  // ══ FOCUS SPECIFICATION ═════════════════════════════════════════════════
  focus: {
    strategy: "roving",
    tabBehavior: "exit-on-boundary", // Tab exits tablist, doesn't cycle
    wrapAround: true, // Arrow keys wrap from last to first
  },

  // ══ SELECTION MODEL ═════════════════════════════════════════════════════
  selection: {
    type: "single",
    selectionFollowsFocus: true, // APG: automatic activation
  },

  compound: true,
  orientation: "horizontal",
};
```

---

## 5. Sprint Plan

### Sprint 1: Core Schema + Vocabulary Enums
- [ ] Add `ARIA_ROLE_CATEGORIES` and `ARIA_ATTR_CATEGORIES` to vocabularies.cfg.ts
- [ ] Add `KEYBOARD_ACTIONS` enum
- [ ] Add `SlotRelationship` type
- [ ] Add `SelectionModel` type
- [ ] Add `KeyboardContext` type
- [ ] Update `PrimitiveContract` to `PrimitiveContractV2`
- [ ] Update taxonomy/types.ts with new exports
- **Verify**: TypeScript compiles, no breaking changes to existing contracts

### Sprint 2: Contract Migration
- [ ] Update dialog contract to V2 schema
- [ ] Update tabs contract to V2 schema
- [ ] Update combobox contract to V2 schema
- [ ] Update accordion contract to V2 schema
- [ ] Audit each against W3C APG for completeness
- **Verify**: All contracts compile, match APG spec

### Sprint 3: Scanner + Validator
- [ ] Update scanner to validate slotRelationships
- [ ] Update scanner to validate keyboardMap completeness
- [ ] Update scanner to validate selection model
- [ ] Fix manifest generation (currently outputs empty `kinds: []`)
- **Verify**: Scanner catches invalid contracts, manifest populates

### Sprint 4: Remaining Primitives
- [ ] Migrate all remaining primitive contracts to V2
- [ ] Fill in APG-compliant keyboardMap for each
- [ ] Fill in slotRelationships for each
- **Verify**: Full parity across all primitives

---

## 6. Validation Checklist (Per Contract)

- [ ] `role` matches W3C APG pattern
- [ ] `requiredAttrs` contains ALL APG-required attributes
- [ ] `slotRelationships` declares ALL inter-slot references
- [ ] `keyboardMap` covers ALL APG keyboard interactions
- [ ] `focus.strategy` matches APG focus management model
- [ ] `selection` (if applicable) matches APG selection model
- [ ] `orientation` correctly influences keyboard behavior

---

## 7. References

- [W3C WAI-ARIA APG Patterns](https://www.w3.org/WAI/ARIA/apg/patterns/)
- [CI4A: Semantic Component Interfaces for Agents](https://arxiv.org/html/2601.14790v1)
- [Chrome DevTools Accessibility Tree](https://developer.chrome.com/blog/full-accessibility-tree)
- [Radix Primitives Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
