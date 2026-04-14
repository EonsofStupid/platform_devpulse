# Setup Overlay Absorb Audit

## Decision

- The setup flow is a shell-mounted overlay under the app frame.
- Route files under `src/routes/(setup)/model-loader/*` are temporary extraction sources only.
- The overlay steps under `src/lib/domains/app/models/features/setup-wizard/steps/*` are the source of truth.
- Deletion target: remove setup route authority once every real UX/behavior item below is absorbed.

## Styling SSOT

- No `--wiz-*` variables survive the final pass.
- Use semantic ColdLight variables generated from primitives and aliases:
  - surfaces: `--surface-base`, `--surface-raised`, `--surface-overlay`, `--surface-inset`, `--surface-subtle`
  - glass/matte: `--glass-deep`, `--glass-smoke`, `--matte-dark`, `--matte-medium`
  - text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-accent`, `--text-link`
  - borders: `--border-subtle`, `--border-strong`, `--border-soft`, `--border-focus`
  - signals: `--signal-success`, `--signal-warning`, `--signal-error`, `--signal-info`
  - accents: `--accent-teal-*`, `--accent-purple-*`, `--accent-blue-*`, `--accent-green-*`, `--accent-coral-*`, `--accent-gold-*`
  - elevation/motion/radius: `--shadow-z*`, `--motion-*`, `--transition-*`, `--radius-*`, `--space-*`, `--breakpoint-*`
- Layout and density should stay fluid with `clamp()` and semantic spacing/radius tokens.

## Route Shell Features To Preserve

Source: `src/routes/(setup)/+layout.svelte`

- Full DevPulse background treatment, not a dead opaque blocker.
- Use the animated DevPulse `maincontentbackground.png` treatment behind the setup shell, not a static fallback image.
- Framed glass panel with soft border, blur, shadow, and responsive `clamp()` sizing.
- Header/body shell separation.
- Mobile fallback that collapses to full-screen without weird inset framing.

## Welcome Screen Absorb List

Source: `src/routes/(setup)/model-loader/+page.svelte`

- Keep the single CTA and scan-before-advance behavior.
- Keep live hardware preview.
- Add layman tooltip affordances for GPU, VRAM, CPU, RAM, and Disk.
- Add page-level explainer popup that describes the setup flow in plain English.
- Preserve stronger visual hierarchy: mascot, kicker, snapshot emphasis, CTA emphasis.

## Models Screen Absorb List

Source: `src/routes/(setup)/model-loader/models/+page.svelte`

- Help row at top with quick inline tip and popup overlay.
- Hardware-aware loading state with mascot/copy while recommendations are being prepared.
- Recommendation failure card with retry path and browse fallback.
- Subtitle/guidance copy that explains the plan is sized for the current machine.
- Brain chooser row across presets.
- Strong active preset presentation.
- Required vs optional grouping.
- Optional section copy that makes on-demand/non-blocking roles explicit.
- Role-specific icons and role-specific accent treatment.
- Tooltip/explainer affordances beside brain section, required section, optional section, and per-role cards.
- Page-level “plain English” popup.
- Download queue visible inline.
- Full blocking setup overlay while downloads/assignment run.
- One-click full setup CTA plus post-success banner state.
- Retry paths for recommendation failure and setup failure.
- Escape hatches to Customize and Browse.
- Back action to the welcome/hardware step and continue action into activation.
- Continue gate tied to real setup state, not a blind unconditional forward action.
- Keep the VRAM bar visible on the step.
- Continue path into activation step, not silent dismiss.

## Browse Screen Absorb List

Source: `src/routes/(setup)/model-loader/browse/+page.svelte`

- Dual-tab browse shell is required: `On Your Computer` and `Search HuggingFace`.
- Active/inactive tab styling and tab-switch behavior are part of parity, not optional polish.
- Help row and page popup.
- Back-to-setup action and done action must return cleanly to the parent setup step.
- Role-grouped local inventory, not flat list.
- Capability-to-layman-role mapping.
- Role-colored section headers and icons.
- Group descriptions under each role heading.
- Cleaned display names instead of raw filenames.
- Persistent download banner visible while searching/browsing.
- Shared download progress must stay visible across both tabs, not only local inventory.
- Empty-state CTA back into HuggingFace search.
- Import state polish and dismissible error state.
- Import button loading copy and disabled state during import.
- Role-colored assign actions.
- Compatible-slot assignment actions for every matching local model.
- Generic semantic tokens replacing all legacy wizard variables.

## Customize Screen Absorb List

Source: `src/routes/(setup)/model-loader/customize/+page.svelte`

- Help row and page popup.
- Layman group labels aligned to route version.
- Preserve grouped slot cards and swap popup flow.
- Preserve browse handoff.
- Back-to-setup action and done-customizing action must return cleanly to the parent setup step.
- Action row must keep the explicit “browse or download more models” affordance.
- `SlotSwapPopup` browse-all path must close the popup and hand off to Browse.
- Keep the VRAM bar visible on the step.
- Generic semantic tokens replacing all legacy wizard variables.

## Activation Screen Absorb List

Source: `src/routes/(setup)/model-loader/activate/+page.svelte`

- Route wrapper is already thin.
- Main missing work is overlay progression into `ClyfActivationStep.svelte` after models.
- Keep help row, explainer popup, exchange counter, voice toggle, and brain-missing fallback UI.

## Profile Screen Absorb List

Source: `src/routes/(setup)/model-loader/profile/+page.svelte`

- Route wrapper is already thin.
- Main missing work is overlay progression into `ProjectSetupStep.svelte` after activation.
- Keep help row, explainer popup, level cards, and folder browse flow.
- Future improvement: align raw inputs to fuller ColdLight input field primitives.

## Completion Screen Absorb List

Source: `src/routes/(setup)/model-loader/complete/+page.svelte`

- Route wrapper is already thin.
- Main missing work is overlay progression into `CompletionStep.svelte` after profile.
- Keep help row, explainer popup, readiness summary, cloud-key summary, and final launch CTA.
- Final launch action must return the user to the real app shell cleanly, without another setup-route hop.

## Remaining Overlay-Specific Features To Reconcile

Source: `src/lib/domains/app/models/features/setup-wizard/SetupWizardOverlay.svelte`

- Keep `DynamicBackground` on `/imgs/backgrounds/maincontentbackground.png` animated anywhere the setup shell owns the viewport.
- Existing role-card / model-change / voice-lab flows need explicit reintegration or deletion by design decision.
- Download/load tracker UI must remain coherent with the new step flow.
- Closing behavior must stop conflicting with the step sequence.

## Token Migration Crosswalk

- `--wiz-card` -> `--surface-raised` or `--glass-deep`
- `--wiz-border` -> `--border-subtle`
- `--wiz-border-strong` -> `--border-strong`
- `--wiz-text` -> `--text-primary`
- `--wiz-text-sub` -> `--text-secondary`
- `--wiz-text-muted` -> `--text-muted`
- `--wiz-cyan` -> `--accent-cyan-main`
- `--wiz-green` -> `--accent-green-main`
- `--wiz-fill-green` -> `--accent-green-fill`
- `--wiz-fill-cyan` -> `--accent-teal-fill` or `--interaction-selected`
- `--wiz-fill-ember` -> `color-mix(in oklch, var(--signal-error) 12%, transparent)`
- `--wiz-ember-600` -> `color-mix(in oklch, var(--signal-error) 45%, transparent)`
- `--wiz-void-*` -> `--color-void-*`
- `--wiz-radius-*` -> `--radius-*`
- `--wiz-duration-*` -> `--motion-duration-*` / `--transition-*`

## Route Deletion Criteria

- Welcome, models, browse, customize, activation, profile, and completion all render from overlay steps.
- Overlay can advance through all phases without `goto("/model-loader/*")`.
- No setup comments anywhere claim route ownership.
- No setup step uses `--wiz-*` variables.
- Help affordances and explainer popups are present on every step that previously had them or clearly needs them.

## Execution Order

1. Finish welcome and models help/popup restoration.
2. Reauthor browse step from route source.
3. Reauthor customize step from route source.
4. Wire overlay progression through activation, profile, completion.
5. Remove remaining route wrappers.
6. Delete route tree.