# Program: ColdLight Foundation Through Wizard Ship

> **Status:** Plan only. Phase 0 begins on owner approval. No code authored
> below this line — every reference points at a file that exists today.
>
> **Owner:** Jesse
> **Authored:** 2026-05-08
> **Drives:** [SPRINT-COLDLIGHT-00..05] (sub-sprints, authored after this plan locks)

## Why this program exists

The desktop UI currently fails six locked rules visibly on screen (no blue,
no MP4 background, layman copy missing, hardcoded strings in `.svelte`,
inline HF browse, multi-accent skill levels). The ColdLight design system
has 95 primitives + 7 preset families ready to compose, but the wizard
authoring drifted into one-off custom markup. 73 components were deleted
in commit [`2035d613`](git log) without a restoration discipline. The
connector / capability deferral pattern is documented across scattered
comments in [slots.default.toml](../../../kernel/model-loader/config/slots.default.toml)
and [SPRINT-VISION-PIXVIX-FOUNDATION.md](SPRINT-VISION-PIXVIX-FOUNDATION.md)
but no central spec. The `coldlight-curator` agent exists at
[.claude/agents/](../../../.claude/agents/coldlight-curator.md) but is
missing rules the conversation surfaced.

This program closes those gaps **methodically, foundation-first**, in six
sprints. Each sprint has explicit dependencies, verification gates, and
exit criteria. No sprint starts until the prior sprint's exit gate clears.

## Stop conditions (apply across all sprints)

The program halts at any sprint boundary if:

- `cargo check` for any touched crate is non-zero (errors OR warnings on our
  crates per [strict-foundation-engineer](../../../.claude/agents/strict-foundation-engineer.md))
- `pnpm check` is non-zero (errors OR warnings)
- The `coldlight-curator` agent flags a lock violation in code authored
  during the sprint and the violation is not corrected in the same commit
- A boot trace regression appears in `cargo xtask run-dev` (errors that
  weren't there before)
- An owner-locked memory entry would have to be modified to permit the
  current direction (memory entries don't change to fit code; code changes
  to fit them, or the entry is consciously updated in the same turn with
  reasoning)

These are not negotiable. Resume only after the offending change is
reauthored or reverted.

---

## Sprint dependency graph

```
   ┌──────────────────────────┐
   │ Sprint 00 — Foundation   │  authoritative specs + agent rules
   └────────────┬─────────────┘
                │ all sprints below depend on 00's spec docs
        ┌───────┴───────┐
        ▼               ▼
   ┌────────────┐  ┌──────────────────┐
   │ Sprint 01  │  │ Sprint 02        │
   │ Tooling    │  │ Restoration      │  parallel-safe with 01
   │ /coldlight │  │ 73 blank shells  │
   └────┬───────┘  └────────┬─────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌────────────────────┐
        │ Sprint 03          │
        │ Connector wiring   │  needs 00 (specs), 02 (shells)
        │ V-12, V-13, omni   │
        └─────────┬──────────┘
                  ▼
        ┌────────────────────┐
        │ Sprint 04          │
        │ Wizard reauthor    │  needs 02 (shells), 03 (connectors)
        └─────────┬──────────┘
                  ▼
        ┌────────────────────┐
        │ Sprint 05          │
        │ Verification       │  needs everything above
        │ test shortcut, e2e │
        └────────────────────┘
```

---

## Sprint 00 — Foundation

**Goal:** Lock three architectural specs and update the curator agent so
every sprint downstream has a single authoritative reference for the
patterns it must respect.

**Deliverables:**

1. **CONNECTOR-DEFERRAL.md** at `kernel/model-loader/src/CONNECTOR-DEFERRAL.md` —
   pulls together the capability/connector deferral pattern currently
   scattered across [slots.default.toml:130](../../../kernel/model-loader/config/slots.default.toml#L130) ("omni override warning"),
   [slots.default.toml:213](../../../kernel/model-loader/config/slots.default.toml#L213) (voice fallback chain), and
   [traits/capability.rs](../../../kernel/model-loader/src/traits/capability.rs).
   Authoritative answer to: when does platform vision/voice DROP because
   the model has it native? What's the cascade? What's the omni-override
   warning UX? What slots fall through to what?

2. **ONBOARDING-CASCADE.md** at `interfaces/desktop/src/lib/design/ONBOARDING-CASCADE.md` —
   the 4-layer cascade ratified in conversation (Flow template → View
   template → Content config → User preferences). Family TOML schema.
   `<root>/families/<id>/{flow.toml, overrides/...}` layout. Bundled vs
   user-modifiable resolution rule. Per-user vs per-project model scope
   (default `user`, `project` schema-scaffolded but not UI-surfaced).

3. **COMPOSITION-CONTRACT.md** at `interfaces/desktop/src/lib/design/COMPOSITION-CONTRACT.md` —
   the compose-don't-author rule. Lists the 95 ColdLight primitives.
   States: a `feature/` orchestrator MAY NOT hand-roll markup or CSS that
   an existing primitive covers. Cites RRO's `.rro-cap-btn`
   ([RroDevtool.svelte:198](../../../interfaces/desktop/src/lib/devtools/clyffy/reasoning/rro/feature/RroDevtool.svelte#L198))
   as the anti-pattern to refuse. Documents the `feature/` + `ui/` + `util/`
   colocation pattern with RRO as the reference.

4. **`coldlight-curator` agent updates** — three new rules:
   - "Compose, don't author" rule citing COMPOSITION-CONTRACT.md
   - Connector deferral enforcement citing CONNECTOR-DEFERRAL.md
   - Family cascade enforcement citing ONBOARDING-CASCADE.md

**Verification:**

- All three spec docs cross-reference each other and TRUTH.md / RENDERFORGE.md / MACRO-LAW.md
- Agent's "What you ALWAYS refuse" table grows with three new entries citing the new specs
- Spec docs themselves pass the agent — i.e. each markdown file's reference list is current and accurate
- No code paths change in this sprint. Pure docs + agent updates.

**Exit criteria:**

- Three spec files committed
- Agent file committed with new rules
- One-paragraph cross-reference added to each of TRUTH.md / RENDERFORGE.md / MACRO-LAW.md / PARKING-LOT.md
- Owner reads all three specs and signs off that they reflect intent

**Estimated scope:** Three docs ~300-500 LOC each + agent diff. Authored
slowly, reviewed phrase by phrase. **No code written. No components touched.**

---

## Sprint 01 — Tooling (`/coldlight` skill)

**Goal:** Slash-invokable skill at `D:\localdev\agent-skills\claude-code-skills\coldlight\SKILL.md`
that delegates to `coldlight-curator` agent + writes capture lines per
the [smart-skill pattern](D:\localdev\agent-skills\claude-code-skills\_PATTERN.md).

**Deliverables:**

1. `agent-skills/claude-code-skills/coldlight/SKILL.md` per pattern
2. `agent-skills/claude-code-skills/coldlight/references/capture-format.md` per pattern
3. Preflight checks added to `agent-skills/categories/preflight-scripts/preflight-scripts.yaml`:
   - `coldlight.skill.deployed` — SKILL.md installed
   - `coldlight.skill.subagent_installed` — agent file present
   - `coldlight.skill.namespace_resolves`
   - `coldlight.skill.captures_writable`
   - `coldlight.skill.coldlight_tokens_built` — `pnpm ds:tokens:build` artifacts present
4. Connectome registration in `agent-skills/connectome.registry.yaml`
5. `install.ps1` re-run to deploy to `~/.claude/skills/coldlight/`

**Surfaces:**

- `subagent` (delegate to coldlight-curator) for review/author/refuse
- `api` (direct file reads via Bash + Glob/Grep) for inventory/audit/parking

**Verbs (drafted; locked when SKILL.md is authored):**

- `audit <component-path>` — review against the three Sprint-00 specs
- `inventory` — walk design tree, return primitives × presets × shells matrix
- `compose <kind> <preset>` — return the renderForge output for visual debug
- `parking [PL-ID]` — show or update a PARKING-LOT entry
- `restore <git-rev>:<path>` — pull a deleted component as a blank shell (Sprint 02 dispatch)

**Verification:**

- `python _shared/preflight.py --profile coldlight-skill-ready` clean
- `@connectome coldlight meta.preflight` clean
- `@connectome coldlight meta.namespace` returns `devpulse.coldlight`
- `@connectome coldlight inventory` returns counts matching `Glob` of design tree

**Exit criteria:**

- Skill installed at `~/.claude/skills/coldlight/`
- Preflight green
- Connectome dispatch works for all five verbs

---

## Sprint 02 — Component Restoration (73 blank ColdLight shells)

**Goal:** Restore every component deleted in commit `2035d613` as a
blank ColdLight-driven shell — content stripped, structure preserved,
ready to author against family TOMLs.

**Deliverables (organized by batch, each batch = one commit):**

| Batch | Files | Domain |
|---|---|---|
| 02-A | `BrainCard, MemoryCard, VisionCard, VoiceCard` | Slot cards (4) |
| 02-B | `WelcomeView, SystemCheckView, ConfigView, ValidateView, DoneView` | Wizard views (5) |
| 02-C | `HuggingFaceSearch, HfTokenModal, SearchHfPopup, BrowseLocalPopup, SlotCard` | HF/browse popups (5) |
| 02-D | `ModelDetailPanel, ModelLoaderPanel, ModelPicker, ModelSearch, SlotRow, SubsystemGroup, VramBudgetPlanner` | Model picker UI (7) |
| 02-E | `WizardHelpTip, WizardInfoPopup, ClyffyTooltip, CurrentSetupPopup, DownloadProgressRow, PresetBanner, VramBar` | Wizard helpers (7) |
| 02-F | `LoadStageOverlay, ApiKeyPanel, EscalationConfigPanel, LatencyTuningPanel, VoiceLabPanel` | Config panels (5) |
| 02-G | `ContextGauge, GpuUtilGauge, VoiceSlotStatus, VramGauge, ClyffyNarration, ModelEventCard` | Gauges + chat-margin (6) |
| 02-H | `_archive/` 21 files (pre-2035d613 archive) | Earlier shells (21) |

Total: **60 from 2035d613 + 13 from 2035d613^ data-access modules + 21
from `_archive/` = 73 components** (rounding to user-stated count;
actual count from `git log --diff-filter=D` is exactly 73 .svelte files
across both commits).

**Restoration discipline (per file):**

1. `git show 2035d613^:<path> > <path>` (restore raw)
2. Strip every hardcoded English string — replace with `{copy.<key>}` placeholder + add the key to a `wizard_copy.toml` TODO list
3. Strip every `oklch(...)` / hex / rgb / hsl / px in templates — replace with `var(--*)` from existing tokens
4. Strip every `<div class="custom-thing">` with hand-rolled CSS — replace with primitive composition (`<Card>`, `<Stat>`, `<Badge>`, etc.)
5. Strip every business-logic state machine / IPC call — leave function signatures + `// TODO: wire to <state-rune-or-Tauri-cmd>`
6. Preserve: prop shape, snippet structure, ARIA wiring, keyboard nav, accessibility attributes
7. Add header comment: `@status restored from 2035d613^, awaiting authoring against family TOML cascade`
8. `coldlight-curator` reviews each file before commit; flagged violations get fixed in the same commit

**Verification (per batch):**

- `pnpm check` zero errors zero warnings on touched files
- `coldlight-curator` review: no compose-don't-author violations, no hardcoded strings, no raw oklch in templates
- Visual smoke: each restored component renders in a Storybook-style harness without crashing (even with empty props)

**Exit criteria:**

- All 73 components present as blank shells
- Each batch's commit has agent sign-off in the body
- A `RESTORATION-MANIFEST.md` lists every restored file with its `wizard_copy.toml` TODO keys

**Estimated scope:** ~5–10 minutes per file authored carefully. 8 batches
× 5–9 files × ~7 min = **~6–10 hours of focused work**, conservatively.
Real number; not "half a day" handwave.

---

## Sprint 03 — Connector Wiring (V-12, V-13, omni-detection)

**Goal:** Implement the three pieces of the connector pattern that exist
in the spec (Sprint 00 / SPRINT-VISION-PIXVIX-FOUNDATION) but not in
code.

**Deliverables:**

### V-12 — Process / task-manager surface as vision input

- New `interfaces/desktop/src-tauri/src/commands/pixvix/processes.rs`
- `list_processes() -> Vec<ProcessInfo>` via `sysinfo` (already a dep)
- `ProcessInfo { pid, name, cpu_pct, ram_mb, parent_pid, executable_path }`
- `capture_process_summary() -> CapturedFrame` — renders a process-list visualization to PNG via `tiny_skia` (skia-safe Rust SVG raster), so it feeds SigLIP just like a screenshot
- Tests + register commands in `lib.rs::collect_commands![]`

### V-13 — Video file → frame extraction → SigLIP encode loop

- New `systems/devpulse-engine/src/vision/video_input.rs`
- `extract_frames(path: &Path, fps: u32) -> Vec<CapturedFrame>` via `ffmpeg-sidecar` (Rust ffmpeg wrapper) or `re_video` (Rerun's pure-Rust decoder)
- Owner picks the dep — both have tradeoffs. Document the choice with cited reasoning.
- Decision lands in CONNECTOR-DEFERRAL.md as an addendum

### Omni-detection auto-defer (D)

- New `kernel/model-loader/src/slots/omni_detection.rs`
- `detect_omni_capabilities(brain_model: &ModelRegistryEntry) -> Vec<ModelCapability>` — pattern-matches against known omni archs (Phi-4-multimodal, Qwen3-VL family, Gemma-3-omni, etc.)
- `slot_should_defer(slot_id: &str, brain_caps: &[ModelCapability]) -> bool` — returns true when slot's capability is covered by brain
- UI side: when `slot_should_defer` returns true, slot card shows "Vision integrated — using AI Assistant's built-in vision" instead of "Load model"
- Override path: user can force-load even when omni; UI shows "D6 — Omni Override Warning" dialog citing the locked rule

**Verification:**

- `cargo test -p devpulse-engine --lib vision::video_input` green
- `cargo test -p devpulse_desktop_backend --lib commands::pixvix::processes` green
- `cargo test -p model-loader --lib slots::omni_detection` green
- Specta bindings regen, every new command + DTO present in `bindings.ts`
- Runtime smoke: `/devtools/vision` PixVix tab gains a "Processes" source picker; Live tab shows process-summary frame; Settings tab shows "Use video file" with file picker

**Exit criteria:**

- All three sub-features land with their own commit
- `SPRINT-VISION-PIXVIX-FOUNDATION.md` has V-12 / V-13 boxes checked
- `CONNECTOR-DEFERRAL.md` has the dep choice (ffmpeg-sidecar vs re_video) recorded as ratified

---

## Sprint 04 — Wizard Reauthor

**Goal:** Reauthor `SetupWizardOverlay` and the 5-view sequence using
RRO's pattern verbatim (`feature/` + `ui/` + `util/` colocation) +
restored components from Sprint 02 + family TOML cascade from Sprint 00.

**Deliverables:**

```
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/
├── feature/
│   ├── SetupWizardOverlay.svelte      ← orchestrator (composes Dialog + Steps + view snippets)
│   └── views/
│       ├── WelcomeView.svelte          ← uses 02-B WelcomeView shell
│       ├── HardwareView.svelte         ← uses 02-B SystemCheckView shell
│       ├── PresetView.svelte           ← uses 02-B ConfigView shell
│       ├── InstallingView.svelte       ← uses 02-B ValidateView shell
│       └── CompleteView.svelte         ← uses 02-B DoneView shell
├── ui/                                  ← colocated dumb adapters
│   ├── ClyffyMascot.svelte             ← <Avatar> + PNG mood selector (24 PNGs in static/imgs/clyffy/)
│   ├── KickerPill.svelte               ← <Badge>
│   ├── TierDisplay.svelte              ← <Stat> + <Meter> + <Badge>
│   ├── ModelInstallRow.svelte          ← <Card preset="cortex-node"> + <Progress> + <StatusDot>
│   └── DykNudge.svelte                 ← <ContextualHelp> + <Tooltip>
├── util/
│   ├── wizard.types.ts
│   ├── wizard.wire.ts                  ← specta re-exports only
│   ├── wizard.copy.ts                  ← typed accessor for WizardCopy
│   ├── wizard.narrations.ts            ← layman copy tables
│   ├── wizard.family.ts                ← family TOML loader (per ONBOARDING-CASCADE.md)
│   └── wizard.capture.ts               ← per-view CapturePayload like RRO
└── index.ts
```

State moves to `$lib/sys/data-access/wizard/wizard.state.svelte.ts` (not
inside the feature tree, mirroring RRO's `$lib/sys/data-access/rro/`).

**Hard rules during this sprint (enforced by `coldlight-curator`):**

- Zero hand-rolled CSS in `.svelte` files — pure ColdLight composition
- Zero hardcoded English strings — all from `WizardCopy` typed accessor
- Zero `oklch(...)` literals in templates
- Zero `text-xs` anywhere
- Background = `BackgroundScene variation="loop-video"` (the MP4) when wizard is open
- CTA = `<Button preset="primary">` (blue per token)
- Mascot = `<ClyffyMascot mood="idle|blink|wobble|standing">` cycling PNGs from [static/imgs/clyffy/](../../../interfaces/desktop/static/imgs/clyffy/)

**Verification:**

- `pnpm check` zero/zero
- `coldlight-curator audit src/lib/domains/app/models/feature/setup-wizard/` returns no violations
- Visual smoke: 5-view flow runs end-to-end with default family
- "Jesse Config" family completes the four-model chain (Phi 15B / SigLIP HD / Nvidia 7B / Harrier 0.5B) without manual intervention

**Exit criteria:**

- Wizard flow ships, all 5 views compose primitives + restored shells
- `default-onboarding` family TOML loads from `<root>/families/default-onboarding/flow.toml`
- `jesse-config` family TOML applies the test-shortcut preset

---

## Sprint 05 — Verification

**Goal:** End-to-end verification that the program closed every gap it
opened, with the test shortcut as the binding contract.

**Deliverables:**

1. **Test shortcut runs end-to-end** — Phi 15B safetensors, SigLIP HD
   patch16-512 (or 384 per tier), Nvidia 7B (exact ID confirmed with
   owner during Sprint 04), Harrier 0.5B all download → scan → save →
   load. UI shows tier-picked variant with reasoning before install.

2. **Boot trace is clean** — `cargo xtask run-dev` produces:
   - No "Platform not ready" errors
   - No `wizardState.refreshFirstRun failed`
   - Wizard opens only when `firstRun=true OR !modelsReady` AFTER `modelsStatusReceived=true`
   - MP4 background renders (`loop-video` variation active)
   - First-page Clyffy DYK overlays fire on hover

3. **Connector pattern visible** — load Phi-4-multimodal as `chat.brain`,
   confirm `vision.embedder` slot UI flips to "Integrated — using AI
   Assistant" with dismissable D6 override.

4. **e2e Playwright** — `interfaces/desktop/e2e/wizard-happy-path.spec.ts`
   extended to cover the full 5-view sequence with the default family.

5. **Memory updates** — locked memory entries get a final pass:
   - `project_model_loader_requirements.md` — every locked req cross-referenced to the file that satisfies it
   - `project_test_shortcut_requirements.md` — confirmation the chain runs
   - `project_central_ui_library.md` — reference to COMPOSITION-CONTRACT.md
   - New entry: `project_connector_deferral.md` pointing at CONNECTOR-DEFERRAL.md

**Verification:**

- All `cargo check` + `pnpm check` zero/zero
- `cargo test --workspace` green
- Playwright e2e green
- Owner runs `cargo xtask run-dev`, completes the 5-view wizard, sees Clyffy mascot, hears Clyffy speak (TTS bundled), sees vision integration message when omni model loaded

**Exit criteria:**

- Program complete. Locked memory updated. Test shortcut passing.
- A `PROGRAM-COLDLIGHT-COMPLETE.md` summarises final commit shas, total
  LOC delta, and links to every spec doc, sub-sprint doc, and the
  `coldlight-curator` agent.

---

## Cross-cutting discipline

**Every sprint:**

- One slice at a time. Max 5 files per phase per the strict-foundation
  rule. State the slice. Wait for approval between phases.
- After every file edit: `cargo check -p <crate>` (Rust) or `pnpm check`
  (frontend). Read every line of output. Zero errors AND zero warnings.
- After every commit: `coldlight-curator` review of changed files.
- No `#[allow]` to silence warnings. Unused = incomplete = finish or delete.
- No stubs. No fake "coming soon" UI. Schema-scaffold optional features
  but don't surface dead toggles.
- No backwards-compat shims. Pre-release; reauthor aggressively.
- Every visible string flows from `wizard_copy.toml` via `get_wizard_copy`.
- Every color flows from `wizard.tokens.json` / SD5 emitted vars.
- Every component composes ColdLight primitives; no hand-rolled markup.

**No exceptions for "the wizard is special" or "this is just temporary."**
Every drift becomes the next session's debt.

---

## What this plan deliberately doesn't promise

- **No timeline.** Each sprint takes as long as it takes to clear its
  exit gate. "Half a day" estimates have already produced trust damage.
- **No parallelism beyond 01+02.** Sprint 03/04/05 are linear. Each gate
  is real; skipping one to "save time" is how the wizard ended up
  black-and-white in the first place.
- **No scope creep.** New asks during the program get parked in
  PARKING-LOT.md as PL-009+ and revisited at Sprint 05's exit. The
  program does what it says it does.

---

## Sprint 00 — what I author next, ON OWNER APPROVAL

If the plan above is correct:

1. CONNECTOR-DEFERRAL.md — drafted from existing comments + spec sources
2. ONBOARDING-CASCADE.md — drafted from this conversation + locked memory
3. COMPOSITION-CONTRACT.md — drafted from RRO pattern + 95-primitive inventory
4. coldlight-curator agent diff — three new rules + the audit mode

Each spec is read-only research output until the owner reads and signs
off. **No code paths change in Sprint 00.** The point is to have
authoritative reference material the rest of the program hangs off of.

If the plan above is wrong, say what's wrong and I'll redraft. Don't
start Sprint 00 until the plan locks.
