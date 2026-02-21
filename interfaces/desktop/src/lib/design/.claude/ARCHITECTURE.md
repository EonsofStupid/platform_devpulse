# ColdLight Architecture

> See MASTER-PLAN.md for the authoritative reference. This file is a quick reference for AI agents.

---

## The Spine: Taxonomy Declares. Implementations Satisfy.

```
taxonomy/kinds/{name}/
  primitive/contract.ts    ← what the primitive IS (slots, ARIA surface, keyboard, states)
  component/contract.ts    ← what the component EXPOSES (props, variants, ARIA mapping, token usage)
  index.ts

taxonomy/schema/
  primitive.ts             ← PrimitiveContractSchema (Zod)
  component.ts             ← ComponentContractSchema (Zod)

taxonomy/scanner.ts        ← BUILD TIME: validates, flags dupes, generates manifest
taxonomy/registry.ts       ← RUNTIME: reads manifest, O(1) lookups
taxonomy/.generated/
  manifest.json            ← VPB source of truth
  imports.gen.ts           ← import cloak for adapter abstraction
```

Nothing exists in ColdLight unless declared in `taxonomy/kinds/{name}/`.
Scanner fails the build if a declared kind has no implementation.
Scanner fails the build if two kinds share a name.

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

ui/{name}/                 ← PROJECT-SPECIFIC STYLED (this project only)
  {Name}.svelte            ← wraps component, applies recipe classes
  types.ts
  index.ts
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
