# Composition contract

Owner: Jesse. Updated 2026-10-27 against plan 0001 B4.3 and plan 0006 §0s.
This is the authoring contract; it does not claim that every existing component
has completed the migration. Preserve existing capabilities while converting
their owning implementation and callers together.

## Two stages

ColdLight owns reusable behavior, accessibility, typed components and generated
visuals. Feature UI adapters compose those components. Feature orchestrators
connect application state and callbacks and own the page layout.

```text
packages/coldlight/
  behaviors/<kind>/                 # owned interaction and accessibility
  components/<kind>/
    Kind.svelte                    # markup + behavior + selectors
    kind.types.ts                  # authored public props
    kind.tokens.json               # authored visual variants/parts/states
    kind.generated.ts              # generated vocabulary/defaults
    index.ts                       # public API
interfaces/desktop/src/lib/domains/<domain>/
  data-access/                     # domain state, commands and events
  feature/                         # orchestration and page layout
  ui/<name>/
    Name.svelte                    # presentational composition
    name.types.ts                  # local props/callback contract
    name.tokens.json               # when a feature-specific look is needed
    name.generated.css             # generated, never edited
    name.generated.ts              # generated, never edited
    index.ts
  util/                            # pure helpers
  index.ts                         # cross-domain public API
```

Import ColdLight through `@devpulse/coldlight` package exports in the app;
`#coldlight` is internal to the package. ColdLight never imports the app.
Shared application infrastructure belongs in `sys`; domain state belongs in
its domain's `data-access`, not in a new global state registry.

The component inventory is the existing `components/` tree and generated
manifest. Inspect that inventory, and `blocks/`, before inventing a new kind.
Use a matching block before recreating its composition. The historical inventory
and restoration rationale are recorded in plan 0006 and `recovered/STATUS.md`;
missing styling is a reason to repair an implementation, never to delete it.

## Visual ownership

Style Dictionary generates CSS and TypeScript from DTCG inputs. Base components
select generated rules with `data-kind`, variant, size, tone and state attributes.
Surface roles inherit a generated family through `data-surface`; a nested family
overrides that scope. Do not invent parallel runtime preset registries.

A feature's optional token file lives at `ui/<name>/<name>.tokens.json`.
Its sole token group is its domain path plus adapter name, joined with hyphens
(for example `chat-session-row`). The generator validates this namespace and
emits `data-ui` selectors, so it cannot replace the base component's `data-kind`.
Its CSS is imported by the generated app feature-style barrel. Feature tokens
must not contribute or override a shared top-level token group.

Layout utilities are allowed for grid, flex, spacing, sizing, alignment and
positioning. Visual values (fill, shadow, border treatment, typography and
state appearance) belong in the owning component or feature tokens. Reuse
Text/Heading and existing visual components. Avoid authored visual utilities,
inline visual declaration strings and a second CSS system in the feature.
Existing inline RenderForge consumers still need direct migration; they are
not the pattern for new work. Data-dependent geometry is a separate concern
and must not be confused with a theme or preset override.

Use shared SVG definitions for reusable geometry where appropriate. Mount
filters at the documented root, avoid duplicate IDs, and verify clipping,
contrast and reduced motion. SVG filters and blur still require paint-cost
measurement; they are not automatically free or GPU-only.

## Adapter discipline

UI adapters accept typed presentation data and callbacks. Local derived values
and interaction state are allowed; importing domain stores, subscribing to
services or issuing IPC is not. Orchestrators supply these dependencies.
Keep types beside their adapter. Use existing generated wire types when they
are the actual contract; do not copy DTO shapes into another registry.

```svelte
<!-- ui/session-row/SessionRow.svelte uses Card as a semantic button. -->
<Card as="button" variant="minimal" data-ui="chat-session-row"
  data-selected={active || undefined} aria-current={active ? "true" : undefined}
  {disabled} onclick={onClick} class="w-full px-2 py-2">
  <Text size="sm">{session.title}</Text>
</Card>
```

The real session-row and agent-turn adapters in the chat domain are working
examples. Preserve native semantics, focus, disabled behavior and provider
choice IDs when moving presentation. Expose reusable adapters through the
domain public API when another domain needs them.

## Refuse duplication; extend the owner

- Use Button/Card/Tooltip/Dialog rather than hand-rolled styled replacements.
- Use RadialGauge, Progress or Meter before drawing a duplicate visualization.
- Add the needed typed variant/part/state to its owner when composition cannot
  express it; do not create a V2, compatibility alias or fallback implementation.
- Keep accessible names and application copy supplied by the owning domain.
- A shared gap belongs in ColdLight; a feature-specific composition belongs in
  that feature's UI directory. File length alone does not prove either case.
- Devtools follow the same contract as product pages.

## Generation and verification

From `interfaces/desktop`, `pnpm ds:tokens:build` generates changed outputs;
`pnpm ds:tokens:check` verifies freshness without writing. The output inventory
rejects duplicate/empty outputs and reports orphaned files for consumer review.
It never deletes them automatically. Token generation precedes normal builds.

Use `src/app.css` as the single desktop/Storybook CSS entry. It establishes
Tailwind's layer order before ColdLight. Importing ColdLight separately first
can make base resets override generated component styles.

Verify app and package types, generated-output tests and relevant browser
behavior with actual CSS loaded. `pnpm check:stories` covers the examples that
app typechecking excludes. `pnpm build-storybook` generates and typechecks the
review fixture before building it. The composition review renders the real
adapters across the generated family inventory; `/ui-demo` uses that same view.
The full native app is launched only with `cargo xtask run-dev`.

Inspect keyboard interaction, state transitions, long content, nested scopes
and responsive widths. A passing build does not prove visual fidelity,
accessibility, performance, or AgentHub runtime correctness. Record failures
and remaining coverage in the owning plan; never increase a baseline or hide
an error to report success. Curator review remains part of the intended audit;
report actual available evidence rather than inventing a curator sign-off.
