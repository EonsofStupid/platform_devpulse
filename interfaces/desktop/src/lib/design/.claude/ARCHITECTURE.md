# ColdLight Architecture

> See MASTER-PLAN.md for the authoritative reference. This file is a quick reference for AI agents.

---

## The Spine: Taxonomy Declares. Implementations Satisfy.

```
Nothing exists without transparency.  Confirming its source of truth.  
Taxonomy must be properly declared.  every entity must declare itself so it can be properly identified for its registry whether that is component library registry, block registry, visual library and preset registry.  Once declared it can be implemented.  A component can only be implemented if its primitive exists.  A primitive can only be created if its taxonomy is declared.  A block can only be created if its component exists.  A component can only be created if its primitive exists.  A visual can only be created if its component exists.  A preset can only be created if its component exists.  A recipe can only be created if its component exists.  A recipe can only be created if its component exists.  A component can only be created if its primitive exists.  A primitive can only be created if its taxonomy is declared.  This is the order of implementation.  This is the order of declaration.  This is the order of existence.  
---

## Three Implementation Layers

```
primitives/{name}/         ← STRUCTURELESS
  {Name}.svelte            ← HTML element + data-kind + data-slot + prop spread. ZERO ARIA. ZERO style.
  types.ts                 ← extends HTML element interface (includes aria-* passthrough)
  index.ts

components/{name}/         ← ARIA + STATE (no visual style)
  {Name}.svelte            ← wraps primitive, computes ARIA from state, sets data-state
  types.ts                 ← extends primitive props + visual props (intent, size)
  index.ts
a11y.ts

```

---

## Token Pipeline (SD5 — WORKING)

```
tokens.ts / semantic.ts / components.ts  ← TypeScript SSOT (3 tiers)
  ↓ (SD5 preprocessor via jiti)
tokens.json                              ← DTCG 1.0
  ↓ (Style Dictionary v5)
tokens.css          ← :root { --token-name: value; }
tailwind.css        ← @theme { --color-*: oklch(...); }
tailwind.preset.ts  ← Tailwind v3 preset
types.ts            ← TypeScript constants
```

Command: `pnpm ds:tokens:build`
Script: `scripts/dev/design/sd/build.ts`

---

## Adapter Rule

`ariaStateProvider: "coldlight"` — default. Component layer applies ARIA directly.
`ariaStateProvider: "meltui"` — exception only, justified in contract comment. Adapter handles ARIA.

---

## What Does NOT Belong

- No `.svelte` files in `taxonomy/`
- No `catalog/` folder — deleted
- No `taxonomy/kinds/primitives/{name}/` — wrong split (schema lives in `taxonomy/schema/`)
- No `taxonomy/kinds/component/{name}/` — wrong split (same)
- No inline styles anywhere
- No hardcoded color/spacing values — use tokens

---

## ARIA Ownership

Primitive: ZERO ARIA applied. Types include aria-* so they pass through.
Component: computes ARIA from state props, applies to primitive spread.
Example: `pressed: boolean` → `aria-pressed={pressed}` in component layer.

---

## VPB No-Code Compiler

The manifest (`taxonomy/.generated/manifest.json`) is the VPB data source.
It contains every component's full prop surface, token usage, and visual variants.
VPB renders this as a node editor. AI context = manifest + current composition.
