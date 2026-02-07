# Contract System

> **One contract per kind. Taxonomy is truth.**

---

## Core Principle

Every kind has exactly ONE contract. It lives in taxonomy.

`
taxonomy/kinds/primitives/{kind}/contract.ts   <- THE contract
primitives/{kind}/contract.ts                  <- Re-exports for platform binding
`

---

## Contract Structure

`	ypescript
// taxonomy/kinds/primitives/tabs/contract.ts

import type { PrimitiveContract, SlotStateMap } from "/design/taxonomy/types";

export const tabsSlots = ["root", "list", "trigger", "content"] as const;
export type TabsSlot = (typeof tabsSlots)[number];

export const tabsStateTokens = [
  "hidden", "visible", "selected", "focused", "hover", "active", "disabled"
] as const;
export type TabsState = (typeof tabsStateTokens)[number];

export const tabsSlotStates: SlotStateMap<TabsSlot, TabsState> = {
  root: ["focus-within"],
  list: [],
  trigger: ["selected", "focused", "hover", "active", "disabled"],
  content: ["hidden", "visible", "selected"],
};

export const contract: PrimitiveContract<"tabs", TabsSlot, TabsState> = {
  kind: "tabs",
  ariaStateProvider: "meltui",
  
  slots: {
    required: ["root", "list", "trigger", "content"],
    optional: [],
    forbidden: [],
  },
  
  states: {
    shared: ["focused", "hover", "active", "disabled"],
    specific: ["hidden", "visible", "selected"],
  },
  
  slotStates: tabsSlotStates,
  
  slotActions: {
    root: [],
    list: [],
    trigger: [],
    content: [],
  },
  
  collections: {
    get(key) {
      return {
        aria: {
          role: "tablist",
          requiredAttrs: ["aria-orientation"],
          optionalAttrs: ["aria-label"],
        },
        keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],
      }[key];
    },
  },
};

export default contract;
`

---

## Contract Fields

| Field | Purpose |
|-------|---------|
| kind | Primitive identity |
| ariaStateProvider | Which dsAdapter fulfills behavior (meltui or coldlight) |
| slots.required | Slots that MUST exist |
| slots.optional | Slots that MAY exist |
| slots.forbidden | Slots that MUST NOT exist |
| states.shared | States common across primitives |
| states.specific | States unique to this kind |
| slotStates | Which states apply to which slots |
| slotActions | Actions per slot (future) |
| collections | ARIA requirements, keyboard bindings |

---

## Contract Binding

The contract binds to implementation via folder naming:

`
taxonomy/kinds/primitives/tabs/contract.ts
    kind: "tabs"
    ariaStateProvider: "meltui"
           |
     +-----+-----+
     |           |
     v           v
primitives/     api/adapters/meltui/
tabs/           _internal/tabs/
`

No explicit wiring. Folder name = kind name = binding.

---

## ariaStateProvider

| Value | Meaning | Parity |
|-------|---------|--------|
| meltui | MeltUI provides behavior + ARIA | 3-folder |
| coldlight | ColdLight handles ARIA natively | 2-folder |

3-folder parity: taxonomy/kinds + primitives + api/adapters
2-folder parity: taxonomy/kinds + primitives

---

## Platform Binding

Each primitive re-exports the taxonomy contract:

`	ypescript
// primitives/tabs/contract.ts
export { contract } from '/design/taxonomy/kinds/primitives/tabs/contract';
`

This ensures the primitive is contractually bound to taxonomy SSOT.

---

## Scanner Validation

Scanner reads contracts and validates:

1. Contract exists in taxonomy
2. Primitive folder exists
3. If ariaStateProvider = meltui:
   - Adapter implementation folder exists
   - Factory.ts exists
4. All required slots have corresponding components

---

## Collections

The collections field provides metadata via get():

`	ypescript
collections: {
  get(key) {
    return {
      aria: {
        role: "tablist",
        requiredAttrs: ["aria-orientation"],
        optionalAttrs: ["aria-label"],
      },
      keyboard: ["ArrowLeft", "ArrowRight", "Home", "End"],
    }[key];
  },
},
`

This is READ by dsAdapter at block render time to apply ARIA.

---

**One contract. In taxonomy. Everything chains to it.**