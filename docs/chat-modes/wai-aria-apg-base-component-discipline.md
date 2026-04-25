# WAI-ARIA APG base components — variants inherit, never duplicate

> Base owns ARIA. Variants only paint.

**Verified triggers (corpus document-frequency):** `APG` (14 hits), `base component` (7), `WAI-ARIA` (5), `react-aria` (1).

**Promote to:** skill.
**Existing memory:** [feedback_design_system_direction.md](../../memory/feedback_design_system_direction.md).

## The recurring ask, in one sentence

The user wants a single base-component family tree (`display` / `inputs` / `interaction` / `navigation` / `overlays`) with strict WAI-ARIA APG compliance held in the base — variants are styling-only descendants that never re-author ARIA, keyboard handling, or focus management.

## The real underlying need

Accessibility-by-construction without duplication. Every variant inherits correct ARIA from one tested base; the design system stays small and auditable.

## Automatic actions

- When asked for a variant, write it as a styling-only wrapper around the existing base.
- Confirm or extend the base's ARIA wiring before authoring a variant — never duplicate ARIA.
- Use the established `families/{display,inputs,interaction,navigation,overlays}` folder shape with one master barrel.
- Co-locate types per family (`types.ts`) and re-export through the family `index.ts`.
- Reuse `react-aria-components` primitives where they already cover the role.
- Cite the APG pattern being implemented in the base component's docstring.

## Anti-patterns

- Variant component re-implementing keyboard handlers the base already has.
- Two competing tooltip / dialog implementations in different folders.
- Master `index.ts` containing everything inline instead of barrel-of-barrels.
- Skipping APG roles because "it works visually".
- New component that bypasses the base and goes straight to raw HTML for styling reasons.
