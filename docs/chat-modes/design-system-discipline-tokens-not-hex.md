# Design system discipline — semantic tokens, no raw values

> Tier 2 semantic tokens. SD5 built-in transforms. No hex in components.

**Verified triggers (corpus document-frequency):** `ColdLight` (97 hits), `oklch` (27), `SD5` (18), `fluid clamp` (14), `renderForge` (11).

> Trigger phrase `no raw values` had **zero hits** and has been removed.

**Promote to:** skill.
**Existing memory:** [feedback_token_tier_naming.md](../../memory/feedback_token_tier_naming.md), [feedback_design_system_direction.md](../../memory/feedback_design_system_direction.md), [project_fluid_clamp.md](../../memory/project_fluid_clamp.md).

## The recurring ask, in one sentence

The user holds the line on Tier 2 semantic tokens (`primary` / `danger` / `accent`), SD5 built-in transforms (oklch, fluid clamp via `fluidDimensionToClamp`), no raw hex/rgb in components, no preset-lookup tables, no per-surface palette names like `variant="wizard"`.

## The real underlying need

A coherent visual system the user can re-skin from one Tier-2 binding without touching components. Drift from this contract (`variant="blue"`, preset registries, hand-written hex) breaks the visual editor story.

## Automatic actions

- Components read `var(--accent-primary-*)` / `var(--surface-*)` — never hex or palette names.
- When a brand color is needed, add it to the SD5 source JSON and let the built-in transform produce the oklch ramp.
- Use fluid clamp tokens for typography and spacing on first-run / setup surfaces.
- Variant names are intent (`primary`, `danger`, `muted`) — never palette (`blue`) or surface (`wizard`).
- Components are base-+-style: base owns ARIA, variants only add styling.
- Run `pnpm ds:tokens:build` after token edits and read the build notes.

## Anti-patterns

- `color: #17deef` in a component file.
- `variant="wizard"` or `variant="blue"` props.
- Custom oklch transforms when SD5 has a built-in.
- `renderForge` preset-key indirection between component and tokens.
- Variants re-implementing ARIA instead of inheriting from base.
- Per-surface CSS files that bake a scope into the token vocabulary.
