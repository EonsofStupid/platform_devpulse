# ColdLight Architecture - MASTER SSOT

> **THIS IS THE AGGRESSIVE ENFORCEMENT DOCUMENT**
> Every folder, every file, every pattern is defined here.
> NO DEVIATION. NO HALF-ASS IMPLEMENTATIONS.

## Industry-Correct Terminology

| Term | Definition |
|------|------------|
| **Taxonomy** | Formal classification system for design artifacts |
| **Kind** | Stable identity string for an artifact (discriminant) |
| **Registry** | Canonical list of artifacts and their IDs |
| **Contract** | Type/schema guaranteeing correctness |
| **Primitive** | Smallest behavior-backed building block |
| **Composite** | Assembled components from primitives |
| **Recipe** | Styling rulesets (visual output) |
| **Pattern** | Usage guidance (docs-only) |
| **Block** | Serializable builder unit (VPB payload) |
| **Token** | Base values and semantic mapping |
| **Adapter Layer** | Provider mapping boundary (Melt/Ark/Skeleton) |

## Artifact Model - PLATFORM SSOT

```typescript
// EVERY artifact in the system conforms to this
export const artifactKinds = [
  "token",
  "primitive",
  "recipe",
  "composite",
  "block",
  "pattern",
] as const;

export type ArtifactKind = (typeof artifactKinds)[number];

export type HubId = "common" | "wiredfront" | "devpulse";

export type ArtifactId = `${HubId}:${ArtifactKind}:${string}`;

export type ArtifactEntry = Readonly<{
  id: ArtifactId;
  hub: HubId;
  kind: ArtifactKind;
  name: string;
  description?: string;
  since?: string;
  tags?: readonly string[];
}>;
```

---

## FOLDER STRUCTURE - ENFORCED

### 1. Design System Core (`src/lib/design/`)

```
src/lib/design/
├── .claude/
│   ├── ARCHITECTURE.md      # THIS FILE - MASTER SSOT
│   ├── CHECKLIST.md         # Top-level design checklist
│   └── settings.json
│
├── tokens/                   # DTCG JSON SSOT (TRUTH)
│   ├── .claude/CHECKLIST.md
│   ├── base/                 # Raw scales (colors, space, radius, etc.)
│   │   ├── colors.json
│   │   ├── space.json
│   │   ├── radius.json
│   │   ├── typography.json
│   │   └── index.ts
│   ├── semantic/             # Intent tokens (danger, warn, success, surfaces)
│   │   ├── intent.json
│   │   ├── surfaces.json
│   │   └── index.ts
│   ├── compound/             # Composed tokens (glassPanelStrong, coldLightShell)
│   │   ├── bundles.json
│   │   └── index.ts
│   ├── index.tokens.json     # Master token file (imports others)
│   ├── schema.ts             # Token validation schemas
│   ├── types.ts              # Token type definitions
│   └── index.ts              # Barrel exports
│
├── primitives/               # Svelte components (behavior boundary)
│   ├── .claude/CHECKLIST.md
│   ├── button/
│   │   ├── index.ts
│   │   ├── Root.svelte
│   │   └── types.ts
│   ├── dialog/
│   ├── tabs/
│   ├── tooltip/
│   └── [49 primitive folders...]
│
├── compound/                 # Composed Svelte components
│   ├── .claude/CHECKLIST.md
│   ├── app-shell/
│   ├── nav-menu/
│   ├── data-table/
│   └── index.ts
│
├── recipes/                  # Recipe definitions (names -> css files)
│   ├── .claude/CHECKLIST.md
│   ├── surfaces/
│   │   ├── glass.recipe.ts
│   │   ├── matte.recipe.ts
│   │   └── index.ts
│   ├── actions/
│   │   ├── index.ts
│   │   └── types.ts
│   └── index.ts
│
├── blocks/                   # VPB runtime payload types + renderers
│   ├── .claude/CHECKLIST.md
│   ├── types/
│   │   ├── block.ts
│   │   ├── layout.ts
│   │   └── index.ts
│   ├── renderers/
│   │   ├── BlockRenderer.svelte
│   │   └── index.ts
│   ├── widgets/
│   │   ├── common/
│   │   ├── wiredfront/
│   │   └── devpulse/
│   └── index.ts
│
├── patterns/                 # Docs (markdown, examples) - NO RUNTIME CODE
│   ├── .claude/CHECKLIST.md
│   ├── forms/
│   │   └── README.md
│   ├── navigation/
│   │   └── README.md
│   └── index.ts
│
├── taxonomy/                 # Classification system
│   ├── .claude/CHECKLIST.md
│   ├── provider/             # ARIA provider adapters
│   │   ├── index.ts          # Barrel exports only
│   │   ├── types.ts          # Shared provider contract types
│   │   ├── meltui/
│   │   │   ├── index.ts
│   │   │   ├── melt.ts
│   │   │   └── types.ts
│   │   ├── reactaria/
│   │   │   └── index.ts      # Placeholder
│   │   ├── arkui/
│   │   │   └── index.ts      # Placeholder
│   │   └── skeleton/
│   │       └── index.ts      # Placeholder
│   ├── kind/
│   │   ├── primitives/
│   │   │   ├── primitiveKind.ts
│   │   │   └── primitiveRegistry.ts
│   │   └── blocks/
│   │       ├── blockKind.ts
│   │       └── blockRegistry.ts
│   └── index.ts
│
├── sys/                      # System internals
│   ├── api/
│   │   └── _internal/
│   │       └── melt/
│   │           ├── types.ts
│   │           ├── state.ts
│   │           ├── schemas.ts
│   │           └── assertions.ts
│   └── cfg/
│
└── index.ts                  # Master barrel export
```

### 2. Contracts Layer (`src/lib/sys/contracts/`)

```
src/lib/sys/contracts/
├── .claude/CHECKLIST.md
├── index.ts                  # Barrel + resolveBlocks(hub) helper
│
├── common/                   # SHARED ACROSS ALL HUBS
│   ├── .claude/CHECKLIST.md
│   ├── artifact.ts           # ArtifactKind + ArtifactEntry + ArtifactId
│   ├── kinds.ts              # as const arrays (primitiveKinds, blockKinds, etc.)
│   ├── slots.ts              # Slot inventories per primitive
│   ├── states.ts             # State inventories per primitive
│   ├── registry.ts           # ArtifactRegistry type
│   ├── validate.ts           # Dev-time validation (unique IDs, correct hub)
│   └── index.ts
│
├── wiredfront/               # HUB OVERLAY
│   ├── .claude/CHECKLIST.md
│   ├── registry.ts           # wiredfront-specific blocks/widgets
│   ├── kinds.ts              # wiredfront-specific kinds if any
│   └── index.ts
│
├── devpulse/                 # HUB OVERLAY
│   ├── .claude/CHECKLIST.md
│   ├── registry.ts           # devpulse-specific blocks/widgets
│   ├── kinds.ts              # devpulse-specific kinds if any
│   └── index.ts
│
├── routing/
│   ├── domain.contract.ts
│   └── routes.contract.ts
│
├── state/
│   └── state.contract.ts
│
└── streams/
    └── streams.contract.ts
```

### 3. Styles Layer (`src/styles/`)

```
src/styles/
├── .claude/CHECKLIST.md
├── 00-config/                # CSS configuration (custom media, env vars)
│   └── config.css
├── 10-base/                  # Reset, typography base, root styles
│   ├── reset.css
│   ├── typography.css
│   └── base.css
├── 12-zones/                 # Layout zones (sidebar, main, topbar)
│   └── zones.css
├── 15-motion/                # Keyframes, transitions
│   ├── keyframes.css
│   └── transitions.css
├── 20-utilities/             # Layout utilities
│   └── layout.css
├── 24-effects/               # Glass, glow, shadows
│   ├── glass.css
│   └── glow.css
├── 30-presets/               # Component presets
│   └── presets.css
├── plugins/                  # CSS plugins
│   └── README.md
├── .generated/               # MACHINE-BUILT (never edit)
│   ├── tokens.css            # :root { --... } from DTCG
│   ├── semantic.css
│   └── compound.css
└── index.css                 # IMPORT-ONLY ENTRY (cascade layers)
```

**index.css format (ENFORCED):**
```css
/* src/styles/index.css - IMPORT ONLY */
@layer reset, tokens, base, zones, motion, effects, presets, utilities;

@import "./.generated/tokens.css" layer(tokens);
@import "./10-base/base.css" layer(base);
@import "./12-zones/zones.css" layer(zones);
@import "./15-motion/keyframes.css" layer(motion);
@import "./24-effects/glass.css" layer(effects);
@import "./30-presets/presets.css" layer(presets);
@import "./20-utilities/layout.css" layer(utilities);
```

---

## TYPING ENFORCEMENT RULES

### 1. as const arrays → derive unions

```typescript
// CORRECT
export const primitiveKinds = ["button", "tabs", "dialog"] as const;
export type PrimitiveKind = (typeof primitiveKinds)[number];

// WRONG - never do this
export type PrimitiveKind = "button" | "tabs" | "dialog";
```

### 2. satisfies for registry validation

```typescript
// CORRECT
export const primitiveSlots = {
  button: ["root", "label", "icon"] as const,
  tabs: ["root", "list", "trigger", "content"] as const,
} as const satisfies Record<PrimitiveKind, readonly string[]>;

// WRONG - no compile-time exhaustiveness check
export const primitiveSlots: Record<PrimitiveKind, string[]> = { ... };
```

### 3. ArtifactId format enforcement

```typescript
// Format: `${HubId}:${ArtifactKind}:${name}`
// Examples:
"common:primitive:button"
"common:block:widget.shell"
"devpulse:block:widget.engineHealth"
"wiredfront:composite:chatPanel"
```

---

## FOLDER .claude/CHECKLIST.md TEMPLATE

Every folder MUST have a `.claude/CHECKLIST.md` with this format:

```markdown
# [Folder Name] Checklist

## Purpose
[One sentence describing what this folder contains]

## Files Required
- [ ] index.ts (barrel exports only)
- [ ] types.ts (type definitions)
- [ ] [specific files for this folder]

## Enforcement Rules
- [ ] All exports are typed
- [ ] as const arrays with derived unions
- [ ] satisfies for compile-time validation
- [ ] No runtime logic in type files

## Dependencies
- Imports from: [list allowed imports]
- Exports to: [list who can import from here]

## Status
- [ ] Structure created
- [ ] Types defined
- [ ] Validated
- [ ] Documented
```

---

## GENERATION RULES

1. **Tokens SSOT = DTCG JSON** - CSS variables are GENERATED, never authored
2. **vite-plugin.ts** generates CSS from tokens
3. **Recipes** define class compositions, generator creates CSS files
4. **NO manual CSS in design/** - all CSS goes in `src/styles/`
5. **index.ts files are barrels** - import/export only, no logic

---

## HUB OVERLAY SYSTEM

```typescript
// src/lib/sys/contracts/index.ts
import { commonBlocks } from "./common/blocks.registry";
import { devpulseBlocks } from "./devpulse/registry";
import { wiredfrontBlocks } from "./wiredfront/registry";
import type { HubId, ArtifactEntry } from "./common/artifact";

export function resolveBlocks(hub: HubId): readonly ArtifactEntry[] {
  if (hub === "devpulse") return [...commonBlocks, ...devpulseBlocks] as const;
  if (hub === "wiredfront") return [...commonBlocks, ...wiredfrontBlocks] as const;
  return commonBlocks;
}
```

Dashboards get:
- **common widgets** always available
- **plus hub-specific widgets**
- No forks. No duplicates. No chaos.

---

## PROHIBITED

- Manual CSS in design/ folder
- Loose `string` types where union exists
- `any` types
- Duplicate definitions
- Non-barrel index.ts files with logic
- Orphan files without folder structure
- Missing .claude/CHECKLIST.md in any folder
