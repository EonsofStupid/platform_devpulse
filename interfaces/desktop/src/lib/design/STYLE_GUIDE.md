COLD LIGHT Design System — Style Guide (SSOT)

Single Source of Truth for code standards, file headers, and architectural boundaries.
All AI agents and developers MUST follow these patterns.

0) Core Principles (Non-Violable)

Registry-First, Always

Tokens → Taxonomy → Recipes → VPB Blocks → Renderers (.svelte)

If it isn’t registered, it doesn’t exist.

One Theme Identity

ColdLight / Maestro is the brand identity.

Variants swap values only, never structure.

Variants change VALUES only

Token names are immutable across variants.

No “variant-specific token names.”

BlockNodes NEVER store theme values

No raw colors, no CSS vars, no Tailwind classes in BlockNode props.

BlockNodes store only typed, schema-validated enums.

Recipes own visuals

Visual decisions live only in recipes/*.

Renderers apply recipe output. They do not style themselves.

CSS Grid is mandatory for shells + dashboards

Shell kinds must be grid-first.

Flex only for small inline rows (icons, button groups).

svelte-sonner only

No toast library sprawl.

All app notifications go through domains/notify.

1) Architectural Layers (Updated + Strict)

@layer must match folder + responsibility, not “what the dev feels like.”

Layer	Purpose	Location	VPB Editable
tokens	SSOT token keys + values	design/tokens/	✅ values
taxonomy	block kinds + contracts + slots	design/taxonomy/	✅ schema/constraints
recipes	Tailwind outputs + requires[] metadata	design/recipes/	✅ by recipe selection
actions	Svelte actions for recipes	design/recipes/actions/	⚠️ only via recipes
primitives	Bits UI wrappers (behavior)	design/primitives/	✅ props
renderers	DS render shells (apply recipes)	design/renderers/	✅ via VPB
vpb	VPB dev-tool inspector/builder	sys/debug/vpb/	✅ editor UI
domains	app behavior/state modules	domains/*	⚠️ limited
plugins	optional extensions	design/plugins/	custom

Rule: Any file in the wrong layer is a violation.

2) File Header Standards (Mandatory)

Every file MUST include a structured header comment.
This is required for:

AI comprehension

dependency graph analysis

VPB edit scope definition

impact analysis

TypeScript / JavaScript (.ts, .js)
/**
 * @fileoverview [One-line description]
 * @module @devpulse/[path/from/lib]
 * @layer [tokens|taxonomy|recipes|actions|primitives|renderers|vpb|domains|plugins]
 *
 * @description
 * [2-3 sentence description of responsibility, boundaries, and non-goals]
 *
 * @registry
 * - [tokens|taxonomy|recipes|vpb] (if applicable)
 *
 * @dependencies
 * - [./relative/path] ([what it provides])
 *
 * @consumers
 * - [who/imports/this/*]
 *
 * @vpb-editable [prop1, prop2] (if applicable)
 * @since [version]
 */


✅ Example

/**
 * @fileoverview Recipe registry for ColdLight surfaces
 * @module @devpulse/design/recipes
 * @layer recipes
 *
 * @description
 * Central registry for all recipe definitions (classes + requires metadata).
 * Recipes are the only place allowed to define Tailwind styling outputs.
 *
 * @registry
 * - recipes
 *
 * @dependencies
 * - ./surface.recipe.ts (base surface styling)
 *
 * @consumers
 * - design/renderers/* (renderers apply recipes)
 * - sys/debug/vpb/* (VPB enumerates recipes)
 *
 * @since 1.0.0
 */

CSS Files (.css)
/**
 * @file [path/from/design/file.css]
 * @layer [tokens|effects]
 * @description [One-line description]
 *
 * Contents:
 * - [Category 1]
 * - [Category 2]
 *
 * @generated [true|false]
 * @vpb-editable [token-names or "all"]
 * @since [version]
 */


✅ Example

/**
 * @file design/tokens/tokens.css
 * @layer tokens
 * @description ColdLight token output (generated). Root-scoped only.
 *
 * Contents:
 * - Colors (semantic)
 * - Radius
 * - Spacing
 * - Depth + Bevel
 * - Motion durations
 *
 * @generated true
 * @vpb-editable all
 * @since 1.0.0
 */


Rule: tokens.css is generated only. Never hand-edited.

Svelte Components (.svelte)
<!--
  @file [path/from/lib/Component.svelte]
  @layer [primitives|renderers|vpb|domains|plugins]
  @aria [aria-pattern] (if applicable)

  [2-3 sentence responsibility statement]
  [Non-goals: what it must never do]

  Props:
  - [propName]: [type] - [description]

  @vpb-editable [prop1, prop2]
  @consumers [who/uses/this/*]
  @since [version]
-->
<script lang="ts">


✅ Renderer Example

<!--
  @file design/renderers/Panel.svelte
  @layer renderers

  Recipe-driven surface renderer.
  Applies registered recipe classes to slots. Never defines styling rules.

  Props:
  - node: BlockNode<"panel"> - Schema-validated VPB block node

  @vpb-editable recipe, props
  @consumers layouts/*, sys/debug/vpb/*
  @since 1.0.0
-->
<script lang="ts">

3) Prop Constraint Patterns (VPB-Compatible)

All props MUST be enumerable.

✅ Correct

type Size = "sm" | "md" | "lg";
type Variant = "glass" | "solid" | "ghost";


❌ Wrong

type Variant = string;


Rule: If VPB can’t enumerate it, it doesn’t belong in props.

4) Token Usage Rules (No Drift)
✅ Correct token usage

Tokens exist as semantic keys (SSOT in tokens.ts) and are consumed via:

Tailwind preset mapping (preferred)

recipe class maps

❌ Forbidden

raw hex / oklch strings in components

arbitrary Tailwind values bg-[#...], text-[...], shadow-[...]

“component-level theme vars”

5) Token Maps (UPDATED — Registry First)

Your old style guide implied this:

“Return var(--dp-space-2) and inject CSS variables.”

That contradicts your registry-first architecture and your “recipes own visuals” rule.

✅ New rule: token maps return Tailwind class strings OR recipe selections

Token maps exist inside recipes, not component logic.

✅ Correct

const bevelMap: Record<DsBevelLevel, string> = {
  sm: "shadow-ds-bevel-sm",
  md: "shadow-ds-bevel-md",
  xl: "shadow-ds-bevel-xl",
};


❌ Wrong

const bevelMap = { xl: "12px 12px 24px rgba(...)" }; // raw values

6) CSS Variable Injection (STRICT + LIMITED)

You said “no component scoped CSS vars.” Good.
So here is the only allowed reality:

✅ Allowed: ROOT tokens only

--dp-* / --ds-* exist only in tokens.css at root scope.

✅ Allowed: ephemeral computed vars ONLY when necessary (rare)

If a renderer must pass a dynamic numeric value, you may use local ephemeral vars:

✅ Allowed prefix:

--_cl-* (private coldlight runtime)

✅ Example (rare + allowlisted)

<div style:--_cl_glow_intensity={glowIntensity} />

❌ Forbidden

injecting theme tokens per component

using --dp-* inside .svelte

injecting colors via inline style

injecting spacing via px/rem values

Bottom line:
99% of visuals should be Tailwind classes from recipes.
Ephemeral vars are for edge cases only.

7) Recipe System Rules (Mandatory)

Every recipe MUST provide:

id

classes(props) -> slotClassMap

optional requires[]

interface RecipeDefinition<Props> {
  id: RecipeId;
  classes: (props: Props) => Record<string, string>;
  requires?: ActionId[];
}

Custom-JS Rule (Hard)

JS effects are never manually attached.
If a recipe needs effects:

recipe declares requires: ["glowTrack"]

renderer auto-attaches action(s)

No exceptions.

8) CSS Grid Enforcement (Shell + Dashboard)
Mandatory grid rule

Shell kinds must have taxonomy constraint:

layoutMode: "grid"


Allowed flex usage:

icon + label rows

button groups

tiny inline alignment

Forbidden flex usage:

shell scaffolding layout

dashboard layout

dock layout sizing

9) Notifications (svelte-sonner only)
Notify domain wrapper (mandatory)

All app notifications go through:

src/lib/domains/notify/


Rules:

Svelte UI toasts: svelte-sonner

If running in Tauri: OS toast integration may trigger when minimized

No direct toast() calls scattered around the app

Root layout must include:

<Toaster />

10) Zero Tolerance Rules (Updated)

No hardcoded colors — only tokens via recipes/preset

No hardcoded spacing — only preset spacing / recipe maps

No magic numbers — no raw px/rem/oklch strings in components

No duplicate primitives — one SSOT per primitive

No string props — union literals only

No raw theme vars in components — --dp-* must never appear in .svelte

No Tailwind arbitrary values — ban any [...] class usage

No renderer styling logic — renderers only apply recipe outputs

No visual JS without recipe.requires — tracking effects must be declared

11) Verification Checklist (Pre-Commit)

Before committing design system code:

File-Level

 Header exists + correct @layer

 No raw colors (#, oklch(, rgb(, hsl()

 No Tailwind arbitrary [...]

 No .svelte contains --dp- / --ds-

 Props are union literals

 Renderer has no styling decisions

Registry-Level

 Token changes happen in tokens.ts only

 tokens.css is generated (not edited)

 taxonomy entry exists for any new kind

 recipe exists + registered for any new recipeId

 VPB palette + defaults updated

Tooling-Level

 pnpm ds:tokens:build passes

 pnpm ds:tokens:watch works

 violation scanner clean

12) AI Agent Instructions (Correct + Enforceable)

When generating/modifying design system files:

Registry-first

No .svelte until tokens/taxonomy/recipes/vpb entries exist.

Always include header

Must include @layer, @since, and correct module path.

Never hardcode visuals

No raw colors, spacing, or shadows.

No arbitrary Tailwind values

No bracket classes. If needed, create a preset utility.

Union literals only

VPB must be able to enumerate.

Recipes own the look

All class decisions live in recipes/*.

Actions only via requires[]

Mouse glow/parallax/ripple must be declared in recipe metadata.

CSS Grid for shell/dashboard

No flex scaffolding.

Notifications

Only through domains/notify (svelte-sonner).

Run enforcement scripts

Treat scanner output as a kill-switch.