# Model loader UI is LOCKED — stop relitigating

> The product spec exists; honor it. When ambiguity remains, surface it against the locked spec.

**Verified triggers (corpus document-frequency):** `Qwen` (49 hits), `layman friendly` (32), `Harrier` (20), `HF browse` (2), `blue tint` (1).

> Trigger phrase `click loads full model` had **zero hits** and has been removed.

**Promote to:** skill.
**Existing memory:** [project_model_loader_requirements.md](../../memory/project_model_loader_requirements.md), [project_model_selection_tiered.md](../../memory/project_model_selection_tiered.md).

## The recurring ask, in one sentence

The user re-states identical product requirements about the model loader (Qwen as floor, Harrier 0.5B downloaded+scanned, brain-discovers / UI-simplifies, click=full-model on-demand, HF browse as its own overlay, blue tint, animated background, layman-friendly, fluid clamp).

## The real underlying need

Stop having the same fight every session. The product spec exists; honor it. When ambiguity remains, surface the conflict against the locked spec rather than silently re-interpret.

## Automatic actions

- Before touching any model-loader / AI-picker / HF-browse / runtime-config UI, re-read [project_model_loader_requirements.md](../../memory/project_model_loader_requirements.md).
- Map the proposed change against the locked points before implementing.
- Use blue palette for primary CTAs on AI surfaces — never grayscale.
- Treat full-model load as the default click action; never partial / preview.
- Layout uses XY fluid clamp on first-page typography and spacing.
- If the proposal conflicts with the locked spec, STOP and surface the conflict to the user.

## Anti-patterns

- Suggesting 0.6B as the main brain (Qwen 4B is the floor).
- Embedding HF browse inline in the main picker.
- Shipping a black-and-white wizard / model-loader.
- Loading a slice / preview on click instead of the full model.
- Asking again whether Qwen should be the floor.
- Hardcoding rem/px on landing-page typography.
