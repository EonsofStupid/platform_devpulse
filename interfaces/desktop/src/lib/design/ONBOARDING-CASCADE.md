# Onboarding Cascade — authoritative spec

> **Revised 2026-10-12 (plan 0001, settled item 9).** The four layers stay:
> flow template (TOML) → views with no strings → copy from the Rust SSOT →
> the user's state. Two changes:
>
> - Gates are evaluated in Rust (the onboarding workflow), not in TypeScript.
>   Svelte renders what Rust publishes.
> - The user's state lives in DevPulse's Turso database (the profile record),
>   not in `preferences.toml`.
>
> The model-tier sections below (`auto_config` tier → model maps, the Qwen
> floor) are superseded: AI comes from providers over endpoints, and hardware
> presets are configuration the user selects (plan 0001 A4, A4b). The
> onboarding UI lives in `domains/app/onboarding/`; the setup wizard under
> `domains/app/models/feature/setup-wizard/` was deleted.

> **Sprint 00 deliverable.** Locks the four-layer cascade that drives
> the onboarding wizard, the per-template configuration system, and
> the per-user vs per-project model scope rule.
>
> **Status:** Locked.
> **Owner:** Jesse.
> **Authored:** 2026-05-09.
> **Cross-references:**
> [`CONNECTOR-DEFERRAL.md`](../../../../kernel/model-loader/src/CONNECTOR-DEFERRAL.md),
> [`COMPOSITION-CONTRACT.md`](./COMPOSITION-CONTRACT.md),
> [`TRUTH.md`](./TRUTH.md),
> [`MACRO-LAW.md`](./MACRO-LAW.md),
> locked memory `project_template_families.md`,
> `project_central_ui_library.md`.

## The four layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Flow template (TOML)                                   │
│   Which views run, in what order, gated by which conditions     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: View template (Svelte)                                 │
│   Pure ColdLight composition, takes structured props,           │
│   never authors strings, never picks models, never decides tiers│
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Content config (Rust SSOT)                             │
│   wizard_copy.toml + auto_config.toml + kernel_terms.toml,      │
│   fed to views via specta-emitted typed accessor                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: User preferences (TOML)                                │
│   {root}/.userdata/preferences.toml — top of the cascade,       │
│   user wins on every collision                                  │
└─────────────────────────────────────────────────────────────────┘
```

Each layer SHADOWS the layer below it on collision. A view's prop
defaults come from layer 3; user preferences (layer 4) override
specific keys; the view (layer 2) sees the resolved struct only.

## Why four layers, not three

Earlier drafts collapsed Layer 1 (flow) into Layer 3 (content). That
broke template families: a family that wanted the same content
strings but a different view sequence (e.g. an enterprise family
that skipped HuggingFace browsing) couldn't express that without
either duplicating all copy or introducing flag-soup. Splitting
flow from content lets a family override **either** axis cleanly.

## Layer 1 — Flow template (TOML)

Path: `<root>/families/<id>/flow.toml` (bundled) or
`<root>/.userdata/families/<id>/flow.toml` (user-modifiable).

```toml
# Example: families/default-onboarding/flow.toml
id = "default-onboarding"
label = "First Run"

[[views]]
id = "welcome"
view = "WelcomeView"          # maps to a Svelte file in feature/views/
gate = "always"

[[views]]
id = "system-check"
view = "HardwareView"
gate = "always"

[[views]]
id = "preset-pick"
view = "PresetView"
gate = "hardware.detected"     # only run if Layer 4 says hardware probe finished

[[views]]
id = "installing"
view = "InstallingView"
gate = "preset.selected"

[[views]]
id = "complete"
view = "CompleteView"
gate = "models.scanned"        # all four models registered in the brain
```

Gate expressions are evaluated by [`util/wizard.flow.ts`](#) (Sprint 04
deliverable) against the merged content+preferences struct.

Key fields:
- `id` — unique within `<root>/families/`. Loader collisions: user wins.
- `label` — layman family name shown in the wizard's family picker.
- `views[].view` — Svelte component identifier; must exist in
  `feature/views/`. The `coldlight-curator` agent enforces this.
- `views[].gate` — boolean expression over `flow.context`. See
  the gate language section below.

## Layer 2 — View template (Svelte)

Each view is a `.svelte` file under
`interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/`.

```svelte
<!--
  @file WelcomeView — first-run greeting + family pick.
  @layer wizard.view (Layer 2 in onboarding cascade)
-->
<script lang="ts">
import type { WelcomeViewProps } from "$lib/domains/app/models/feature/setup-wizard/util/wizard.types.js";

let { copy, family, callbacks }: WelcomeViewProps = $props();
</script>

<DialogContent>
  <ClyffyMascot pose="pointing" mood={family.mood} />
  <Heading>{copy.welcome.title}</Heading>
  <Text preset="body">{copy.welcome.body}</Text>
  <Button preset="primary" onclick={callbacks.advance}>
    {copy.welcome.cta}
  </Button>
</DialogContent>
```

Hard rules (enforced by `coldlight-curator` audit):
- ZERO hardcoded English strings — all from the `copy` prop.
- ZERO `oklch(...)` / hex / rgb / hsl / px in templates.
- ZERO `text-xs` (rule 28).
- ZERO `<div class="custom-thing">` — composes ColdLight primitives only.
- ZERO `title=` on interactive elements (rule 67).
- Props are a single typed struct from
  [`util/wizard.types.ts`](#); never a flat string list.

The view does not know which family is active beyond the `family`
prop. Swapping families is a re-render with different props; no
view-internal state changes.

## Layer 3 — Content config (Rust SSOT)

Three files, all under `kernel/model-loader/config/` (or family
override paths — see Layer 4):

```
config/
├── wizard_copy.toml      — every visible string the wizard renders
├── auto_config.toml       — preset → slot.model mapping per tier
└── kernel_terms.toml      — layman labels + brief field for cortex surfaces
```

Loaded into Rust structs (`WizardCopy`, `AutoConfig`, `KernelTerms`)
that derive `serde::Deserialize`, `specta::Type`, and a Tauri command
that returns each: `get_wizard_copy()`, `get_auto_config()`,
`get_kernel_terms()`.

The wizard's frontend state rune
(`$lib/sys/data-access/wizard/wizard.state.svelte.ts` — Sprint 04
location) calls these commands once on mount; the views read the
resolved struct via the `copy`/`config`/`terms` props.

### `wizard_copy.toml` schema

Top-level table per view:

```toml
[welcome]
title = "Hi! I'm Clyffy."
body  = "Let's pick a setup that matches your machine."
cta   = "Let's go"

[hardware]
title       = "Looking at your machine..."
body_low    = "We'll go light. Quality stays good."
body_mid    = "Solid setup. We'll pick the recommended preset."
body_high   = "Great machine. Anything you want is on the menu."
cta_continue = "Continue"
```

Authoring rule: every key is layman-readable. No internal IDs in copy
text. Tier names, model names, and quant labels stay in tooltips
(progressive disclosure per rule 44).

### `auto_config.toml` schema

```toml
# Tier -> slot -> model mapping
[tier.minimum.slots]
"chat.brain"      = "qwen-3-1.5b"
"vision.embedder" = "siglip-base-patch16-224"
"voice.tts"       = "kokoro-en"
"voice.stt"       = "whisper-tiny"

[tier.recommended.slots]
"chat.brain"      = "phi-4-15b-multimodal"
"vision.embedder" = "siglip-large-patch16-384"
"voice.tts"       = "kokoro-en"
"voice.stt"       = "whisper-base"
```

The wizard's preset apply path consumes this map. Per
[`CONNECTOR-DEFERRAL.md`](../../../../kernel/model-loader/src/CONNECTOR-DEFERRAL.md),
`vision.embedder` may defer if the chosen brain has native vision —
the auto_config entry exists as a fallback only.

### `kernel_terms.toml`

Already exists. Extended with a `brief` field per memory entry
`project_cortex_surfaces.md`. Drives the rotating Thinking-strip label
("Pondering Deeply", "Ruminating", etc.) and every layman-name in
slot cards.

## Layer 4 — User preferences (TOML)

Path: `<root>/.userdata/preferences.toml`. Atomic write
(write-temp + rename) so a crash mid-write never corrupts. Schema:

```toml
[onboarding]
family_id = "default-onboarding"
completed = false
last_view = "system-check"

[slots."chat.brain"]
assigned_model = "phi-4-15b-multimodal"

[slots."vision.embedder".overrides]
forced_specialist = true
reason = "user-typed-on-2026-05-08"
warned_about_omni = true

[models]
scope = "user"   # "user" | "project". Default user. UI exposes neither yet.
```

Cascade resolution (top wins):

1. `<root>/.userdata/preferences.toml`
2. `<root>/.userdata/families/<active>/overrides/copy.toml`
3. `<root>/.userdata/families/<active>/overrides/preset.toml`
4. `<root>/families/<active>/overrides/copy.toml`
5. `<root>/families/<active>/overrides/preset.toml`
6. `<root>/families/<active>/flow.toml`
7. Bundled `wizard_copy.toml` / `auto_config.toml` / `kernel_terms.toml`

A bundled family ships with NO overrides; the bundled config files
ARE its content. User-edited families add overrides without
shadowing every key — only the keys they care about.

## Per-user vs per-project model scope

```
<root>/
├── DevPulse(.exe)                         # binary
├── models/                                # SSOT for weights
│   ├── chat/
│   ├── voice/
│   ├── vision/
│   └── rag/
└── .userdata/
    ├── preferences.toml                   # Layer 4
    ├── projects/
    │   └── <project-id>/
    │       └── models/  →  ../../../models   (symlink — per-user default)
    └── families/                          # user-modifiable families
```

The per-project `models/` is a symlink into the global `<root>/models/`
on `models.scope = "user"` (default). On `models.scope = "project"`
the symlink is replaced with a real directory holding that project's
private weights.

**`models.scope` is schema-scaffolded but NOT exposed in onboarding
UI.** Per locked memory `feedback_no_stubs`: schema-scaffold optional
work, never surface dead toggles. The wizard uses `"user"` always.
Per-project mode requires a feature-gated UI Sprint 04 does not
include; until that ships, the field exists in TOML for forward
compatibility but no view writes to it.

## Family loader rules

```rust
// systems/devpulse-engine/src/platform/services/families.rs (Sprint 04)
fn load_families(root: &Path) -> Vec<FamilyConfig> {
    let bundled  = scan(&root.join("families"));
    let user     = scan(&root.join(".userdata/families"));
    merge_user_wins(bundled, user)
}
```

- Bundled paths read-only (overwriting on update is allowed).
- User paths writable; the visual editor authors here.
- ID collision: `user` wins, with a warning logged to
  `query_scoped_log("families.")`.
- Schema validation runs on load; bad family TOML logs an error and
  is excluded from the family picker rather than crashing boot.

## Gate language (used by `views[].gate`)

Atoms:
- `always` — never gates out
- `<key>.<key>` — truthy field on the resolved struct
- `<key> = <value>` — equality
- `not <expr>` — negation
- `<a> and <b>` / `<a> or <b>` — combinators

Examples:
- `always`
- `hardware.has_gpu`
- `not models.scanned`
- `hardware.has_gpu and not models.scanned`
- `family_id = "jesse-config"`

The grammar is intentionally tiny — anything more complex belongs in
a real Rust `auto_config` rule, not a TOML expression.

## Authoring families (Sprint 04+)

```
<root>/.userdata/families/<id>/
├── flow.toml                              # Layer 1 override
└── overrides/
    ├── copy.toml                          # Layer 3 override (subset of wizard_copy.toml keys)
    ├── preset.toml                        # Layer 3 override (subset of auto_config.toml keys)
    └── kernel_terms.toml                  # Layer 3 override (rare — usually for non-English voice)
```

Visual editor (Sprint 05+) reads/writes this tree. Until then,
families are authored by hand and the wizard's "Family" dropdown
lists them.

## Anti-patterns this spec refuses

- A view that imports `wizard_copy.toml` directly. Views consume the
  `copy` prop only; the rune does the load.
- A view that takes 12 individual string props instead of a typed
  struct. One typed prop per Sprint 04 contract; types come from
  [`util/wizard.types.ts`](#).
- A family that ships its own model files. Models are global by
  scope rule. A family lists model IDs; the IDs resolve through the
  registry to weights under `<root>/models/`.
- Inline gate expressions in Svelte. Gates evaluate in Rust /
  TypeScript before the view mounts; the view receives `{copy,
  family, callbacks}` and renders unconditionally.
- A "skip onboarding" preference that bypasses the cascade entirely.
  Returning users skip via `[onboarding].completed = true`, but the
  cascade still resolves on every cold start so a re-config flow
  has the same data.
