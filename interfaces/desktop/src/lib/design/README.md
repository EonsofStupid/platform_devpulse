✅ UPDATED README.md (drop-in replacement)
# COLD LIGHT Design System (ColdLight / Maestro)

> Enterprise-grade, token-governed, registry-first, VPB-composable design system for DevPulse.  
> Built for **SvelteKit 5 + TypeScript + Tailwind + Bits UI**, with strict enforcement and zero drift.

---

## 🛑 BEFORE WRITING ANY CODE

**Read [.agent/INSTRUCTIONS.md](./.agent/INSTRUCTIONS.md) first.**  
If you skip it, you will generate drift and violate the system.

---

## Core Concept (Do Not Misinterpret)

You are NOT “building components first.”

You are building a **registry-driven visual system**:



Tokens (SSOT) → Taxonomy (kinds/contracts) → Recipes (visuals) → VPB Blocks → Renderers (.svelte)


- **VPB stores structure** (BlockNodes)
- **Recipes produce visuals** (Tailwind classes + required actions)
- **Tokens provide values** (root-scoped semantic variables)
- **Renderers apply recipes** (no styling decisions inside renderers)

---

## ⚠️ HARD RULES (Non-Negotiable)

| Rule | Correct | Forbidden |
|------|---------|-----------|
| **One Theme Identity** | ColdLight is the brand | Per-component “themes” |
| **Theme Variants** | Swap token VALUES only | Changing token NAMES per variant |
| **BlockNode Storage** | `{kind, recipe, props, slots}` | Colors / CSS vars / Tailwind classnames |
| **Bits UI** | Import ONLY in `design/primitives/` | Import in renderers/domains/vpb |
| **Styling Ownership** | Styling decisions live ONLY in `design/recipes/` | “Self-styling” `.svelte` components |
| **Token SSOT** | `tokens.ts` is SSOT → generates CSS | Hand-editing `tokens.css` |
| **Tailwind** | Use preset + recipe outputs | Arbitrary values `[...]`, raw colors |
| **Shell Layout** | CSS Grid required | Flexbox scaffolding |
| **Toasts** | `svelte-sonner` via `domains/notify` | toastify/svelte-toast/native alerts |

---

## ✅ Registry-First Gate (NO `.svelte` until this passes)

Before creating any new **design renderers**:

### Stage 0 — Intent
- [ ] Kind name exists (`panel`, `widget`, `chatDock`, etc.)
- [ ] Slots defined (`root`, `header`, `body`, etc.)

### Stage 1 — Tokens
- [ ] Tokens exist in `design/tokens/tokens.ts` (SSOT)
- [ ] `pnpm ds:tokens:build` run and generated files are updated

### Stage 2 — Taxonomy
- [ ] Kind registered in `design/taxonomy/kinds.ts`
- [ ] Props schema exists in `design/taxonomy/contracts.ts`
- [ ] Slots + allowed children defined in `design/taxonomy/slots.ts`

### Stage 3 — Recipes
- [ ] Recipe exists in `design/recipes/*`
- [ ] Recipe ID registered in `design/recipes/index.ts`
- [ ] If JS visuals needed → recipe declares `requires: [...]`

### Stage 4 — VPB Blocks
- [ ] Block appears in VPB palette
- [ ] Default props + default recipe set
- [ ] Inspector shows enums only (no raw text color inputs)

### Stage 5 — Renderers Allowed
Only now:
- [ ] Add renderer `.svelte` file under `design/renderers/`
- [ ] Renderer applies recipe output to slots (no styling decisions)

If any checkbox fails: **STOP. Fix registries first.**

---

## Design Registries (SSOT)

### 1) Tokens (SSOT → generated)


src/lib/design/tokens/
├── tokens.ts # ✅ SSOT
├── tokens.css # ✅ GENERATED (never edit manually)
├── types.ts # ✅ GENERATED types
├── schema.ts # runtime validators
├── tailwind.preset.ts # ✅ GENERATED mapping (optional but recommended)
└── generate.ts # generator entry


Commands:
```bash
pnpm ds:tokens:build
pnpm ds:tokens:watch


Rule: tokens.css is generated output only.

2) Taxonomy (what exists + contracts)
src/lib/design/taxonomy/
├── kinds.ts
├── contracts.ts
└── slots.ts


Taxonomy defines:

what kinds exist

allowed slots + allowed children

prop schemas (enumerable union literals)

3) Recipes (how it looks)
src/lib/design/recipes/
├── index.ts
├── surface.recipe.ts
├── panel.recipe.ts
├── shell.recipe.ts
├── chat.recipe.ts
└── actions/
    ├── index.ts
    ├── glowTrack.ts
    └── ripple.ts


Recipes are the ONLY place allowed to decide styling output.

Each recipe MUST include:

id

classes(props) -> slotClassMap

optional requires[] for actions

4) VPB (composition + inspector)
src/lib/sys/debug/vpb/
├── components/builder/
├── components/inspector/
├── state/
└── types/


VPB stores:

BlockNodes (typed props only)

recipe selection

slots/children composition

VPB never stores:

Tailwind classnames

CSS

raw colors

theme values

File Structure (Current Target)
src/lib/design/
├── tokens/
├── taxonomy/
├── recipes/
├── primitives/     # Bits UI wrappers only
├── renderers/      # DS render shells (apply recipes)
└── plugins/        # optional extensions

src/lib/sys/debug/vpb/     # VPB dev-tool
src/lib/domains/notify/    # svelte-sonner wrapper
src/scripts/dev/design/    # enforcement scripts

Key Commands
Dev
pnpm dev
pnpm ds:tokens:watch

Token Pipeline
pnpm ds:tokens:build
pnpm ds:tokens:watch

Enforcement (Kill Switch)
pnpm tsx src/scripts/dev/design/scan-violations.ts
pnpm tsx src/scripts/dev/design/verify-kinds.ts
pnpm tsx src/scripts/dev/design/verify-recipes.ts
pnpm tsx src/scripts/dev/design/verify-tokens-sync.ts

Post-Code Verification Checklist

After making changes:

 No raw colors (#, oklch(, rgb(, hsl()

 No Tailwind arbitrary values ([...])

 No component theme vars (--dp-* in .svelte)

 No Bits UI imports outside primitives/

 All new kinds registered in taxonomy

 All new recipes registered in recipe registry

 VPB palette + defaults updated for new kinds

 Enforcement scripts run clean