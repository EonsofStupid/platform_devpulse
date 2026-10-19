# PARKING-LOT.md — deferred decisions, with explicit triggers

> **Authority:** this file. Each entry has a status, a trigger to unpark,
> the provisional behavior shipping today (if any), and the open
> questions blocking a lock. See TRUTH.md for ground truth.

The point of this file: **a parked decision must be parked deliberately,
not by default.** Each entry below explains what's deferred, why, what
provisional behavior is in place today, and what would unpark it.

When you (or a future contributor, or an LLM) is tempted to make a
decision that touches a parked entry, look here first. Don't lock under
uncertainty. Don't drift via implementation either — implement the
provisional, document the parking.

---

## PL-001 — Two-dimensional intent model (Capability C)

**Status:** PARKED — researching 2026 AI-context-aware UI / A2UI patterns.

**The question.** Is intent a flat lookup (`primary` → `glass-deep` is a
hand-authored constant), or is it dimensional — `family` chosen by
provider/context + `role` chosen by intent — with the resolver picking
the (family, variant) pair?

**Provisional behavior shipping today.**
`visual/intent-map.ts` ships a flat `Record<SemanticIntent, PresetId>`
with 14 hand-authored entries. The resolver does direct lookup. This is
documented in TRUTH.md §6 as *provisional*, not locked.

**What unparks this.**
- A2UI catalog format stabilizes enough to know how `family` would be
  declared by an agent vs. by a human author.
- 5+ ColdLight components shipped to `coldlight.lovable.app` with
  observable usage data.
- StyleOS dogfooding reveals whether laymen think in family-first or
  role-first.

**Open questions.**
- Does `Provider` set the active family, or is family a per-component prop?
- If family is on the provider, do components override per-instance?
- Does role auto-pick variant via a per-family role-to-variant table, or
  does the layman pick the variant explicitly?
- How does this interact with the chat family's golden-pattern variants
  (which don't follow the standard 6-variant set)?
- For an A2UI agent driving the UI, does the agent specify family + role,
  or just role with family inferred from context?

**Reasoning for parking.**
Locking C now without this data risks committing to a model that doesn't
fit emerging A2UI conventions. The flat map ships fine for now; rewriting
the resolver later is a contained change.

---

## PL-002 — Ghost package exports (`./style-macro`, `./primitives/*`)

**Status:** PARKED — needs a deliberate cleanup decision.

**The question.** `package.json` exposes two exports that point at
non-existent directories:

```json
"./style-macro":  { "import": "./style-macro/index.ts" },
"./primitives/*": { "svelte": "./primitives/*/index.ts" }
```

`style-macro/` does not exist; the resolver lives at `renderforge/`.
`primitives/` does not exist; the WAI-ARIA APG hooks live at `behaviors/`.

**Provisional behavior shipping today.**
The exports are dead. Anything trying to import them fails. Nothing in
the live codebase appears to use these export paths (verifiable with
`pnpm check`).

**What unparks this.**
- A decision on whether `renderforge/` should be renamed to `style-macro/`
  (matching the package export name) or whether the export should be
  renamed to `./renderforge` (matching the directory).
- A decision on whether `behaviors/` should be renamed to `primitives/`
  (matching the export and the original ADR-001 vocabulary) or whether
  the export should be renamed to `./behaviors`.

**Recommendation when this unparks.** Match directory names to exports —
they're more visible to consumers. Rename `renderforge/` → `style-macro/`
and `behaviors/` → `primitives/`. But this is a 65-component import-path
update; not free. Park until there's a reason to do it (e.g. publishing
the package externally, or shipping the React port which will surface
the names to React consumers).

---

## PL-003 — Overlay family universality (B7 architectural call)

**Status:** PARKED — small but real architectural call.

**The question.** Glass-family kinds (e.g. `glass`, `glass-deep`,
`chat-frame`) need backdrop blur. The resolver emits `--backdrop-filter`
for them. But `KIND_FAMILIES` for these kinds doesn't include `overlay`,
so the `[data-cl-overlay]` rule (which actually applies the blur) never
activates. The blur silently doesn't work.

**Three possible fixes.**

| Option | Description | Tradeoff |
|---|---|---|
| A | Add `overlay` to the family lists for all glass-family kinds in `kind-families.ts`. | Each glass kind now carries a 4th data-cl-* marker. Fixes the bug. Couples kind-families to glue-CSS structure. |
| B | Move `backdrop-filter` to `[data-kind]` (universal) so every styled element gets it for free. | Cheap. But every non-glass element now has a `backdrop-filter: var(--backdrop-filter, none)` declaration. Default is `none`, so paint-cost is zero, but DOM size grows slightly. |
| C | Add a *new* selector `[data-cl-surface][data-kind]` (or some refinement) that picks up backdrop-filter when the surface family is active and a backdrop-filter var resolves to non-none. | More precise. Most complex. Requires a CSS function that's not standard. |

**Provisional behavior shipping today.** Backdrop blur on glass kinds
silently doesn't work. (Bug B7 in RENDERFORGE.md.)

**What unparks this.** The first user-visible report of a glass component
not blurring properly. Until then, B is the cheapest fix; A is the
purest. Park until someone hits it in a real screen.

---

## PL-004 — No-code compositional save-as-preset compiler (Capability D)

**Status:** PARKED — large product surface, decoupled from current pipeline.

**The question.** Should StyleOS allow a layman to pick atomic axis
values, name the composition, and save it as a new `PresetDefinition`
that everyone can reuse?

**Why it's parked.** This is a major product surface, not a small
extension. It involves: a layman UI for picking values per axis, naming
conventions for user-created presets, conflict resolution between
presets named the same by different users, governance ("who can save
to the shared library?"), persistence (file system? database?
sync?), and serialization back to the `PresetDefinition` schema in a
way that round-trips correctly through SD5.

**Provisional behavior shipping today.** Presets are file-authored only.
StyleOS shows the existing presets but does not let users save new ones.

**What unparks this.**
- Phase 4 (React/RAC port) is shipping and stable.
- StyleOS interactive editor reaches a maturity bar — at minimum, the
  per-axis editing tools (color picker, shadow editor, etc.) are in place.
- A real user (internal or external) asks for save-as-preset.

**Reasoning for parking.** The schema is already the right shape (per
TRUTH.md §5 / `visual/preset-definition.ts`), so this is not a "we don't
know how to design D" parking — it's a "we're not building D this
quarter" parking. The architectural foundation is in place to make D
non-traumatic when its turn arrives.

---

## PL-005 — ChatFrame's Tier 3 attributes vs. promotion to Tier 2

**Status:** PARKED — wait-and-see.

**The question.** ChatFrame.svelte uses `data-layout="chat"`,
`data-engaged={engaged}`, `data-context-collapsed={contextCollapsed}`.
Per TRUTH.md §3 these are Tier 3 (component-specific). But if other
components adopt similar patterns (e.g. a `data-layout` for non-chat
shells), promotion to Tier 2 might be warranted.

**Provisional behavior.** They're Tier 3. Each is local to its
component. No CSS rule outside ChatFrame should target them.

**What unparks.** A second component reaching for `data-layout` or
`data-engaged` semantics. If two reach independently, promote.

---

## PL-006 — React/RAC port package layout

**Status:** PARKED — depends on PL-001 outcome and Lovable publishing strategy.

**The question.** When ColdLight ships a React/RAC version, where does it live?

| Option | Description |
|---|---|
| A | Sibling package: `@devpulse/coldlight-react` next to `@devpulse/coldlight` (Svelte). Resolver duplicated as a shared internal `coldlight-core`. |
| B | Monorepo workspace: `packages/coldlight-core` (resolver+types, framework-agnostic), `packages/coldlight-svelte` (consumes core), `packages/coldlight-react` (consumes core). |
| C | Single package with subpath exports: `@devpulse/coldlight/svelte`, `@devpulse/coldlight/react`, `@devpulse/coldlight/core`. |

**Provisional behavior.** The Svelte version exists. The React version
does not. Lovable's `coldlight.lovable.app` deployment will eventually
need a React entry point; how it imports is the open question.

**What unparks.**
- Lovable's npm publishing constraints become known (do they support
  workspaces? subpath exports? scoped packages?).
- A decision on whether the public package is published externally
  to npm or remains private monorepo-only.

**Recommendation when this unparks.** Option B. The pure-function
constraint on `renderForge` (RENDERFORGE.md P1) was specifically locked
to enable framework-independent core. Option B realizes that. A
duplicates the code path. C creates a subpath-export tax on every
import statement.

---

## PL-007 — Hover/focus preset overrides not flowing through cascade

**Status:** PARKED — design gap that may be intentional.

**The question.** A `PresetDefinition.states.hover.backgroundColor`
authored value gets compiled (presumably) into something like
`--preset-glass-deep-hover-background-color`. But `render-base.css` has
no rule like:

```css
[data-cl-surface]:hover {
  background-color: var(--background-color-hover);
}
```

— it only `filter`-shifts via `[data-cl-interactive]:hover`. So the
hover-state preset overrides aren't fully wired.

**Two interpretations.**

1. **Bug.** The rule should exist. The hover preset values are intended
   to apply.
2. **Intentional.** The brightness filter approach (`brightness(1.1)`
   on hover) is the *only* hover treatment, and authoring per-axis
   hover values in the preset is for future cascade work.

**Provisional behavior.** Per-axis hover values authored in
`PresetDefinition.states.hover` ship into the build but aren't visible
on the page. Hover effects come from the brightness filter only.

**What unparks.** Confirmation from the original author of the preset
schema (Jesse, presumably) on which interpretation is intended.

---

## PL-008 — `--gradient` vs `--background-image` collision

**Status:** PARKED — forward-compatibility issue.

**The question.** Both `--gradient` and `--background-image` ultimately
map to the CSS property `background-image:`. Today, only `--gradient`
is consumed in `render-base.css`:

```css
[data-cl-surface] {
  background-image: var(--gradient, none);
}
```

If a future preset wants to layer a gradient over an image (a real
need for chrome and glass families with background textures), the
consumer rule needs to merge them:

```css
[data-cl-surface] {
  background-image:
    var(--gradient, none),         /* on top */
    var(--background-image, none); /* underneath */
}
```

This works in CSS via comma-separated background layers, but the
fallback values need careful handling so `none, none` doesn't break
the cascade.

**Provisional behavior.** Today, only `--gradient` is consumed.
`--background-image` is emitted by the resolver but unused.

**What unparks.** A preset authored that needs both layers
simultaneously. Add the comma-separated rule then.

---

## How to add a parking-lot entry

When you hit a decision point that you're not ready to lock:

1. **Add a PL-NNN entry** to this file with the next sequential number.
2. **State the question** in one sentence.
3. **Document the provisional behavior** that ships today, even if it's
   "no behavior, this codepath isn't reachable."
4. **State the unpark trigger** as a verifiable condition. "When we have
   data" is not a trigger. "When 5+ components ship to coldlight.lovable.app"
   is.
5. **List open questions** as bullets, written so a future contributor
   can answer them without reconstructing the original context.
6. **State the reasoning for parking** — why it's the right call to defer.

A decision is parked deliberately, not by accident. If you find yourself
locking something tangentially related, check this file first.

---

## How to unpark an entry

1. Verify the trigger condition has actually fired.
2. Answer the open questions, citing source files and concrete data.
3. Update TRUTH.md / RENDERFORGE.md / MACRO-LAW.md as needed to reflect
   the new lock.
4. Mark the PL-NNN entry as **UNPARKED** with the date and a one-line
   summary of the lock.
5. Do NOT delete the entry — keep it for historical context. A locked
   decision's history of being parked is valuable when revisiting later.
