---
id: 0004
boundary: engine
paths:
  - systems/devpulse-engine/src/signals/
  - systems/devpulse-engine/src/platform/guidance/
  - kernel/devpulse-clyffy/src/guidance/
  - kernel/devpulse-clyffy/config/guidance/
  - kernel/devpulse-clyffy/src/profile/
  - interfaces/desktop/src/lib/sys/events/signal-fabric.ts
touches: [kernel-clyffy, kernel-model-loader, desktop-tauri, desktop-sys, desktop-models, desktop-coldlight, desktop-layouts, desktop-clyffy, desktop-devtools, repo]
status: draft
owner: jesse
created: 2026-10-10
updated: 2026-10-12
supersedes: []
specs:
  - docs/knowledge_library/00_MASTER_SPEC.md
  - docs/knowledge_library/08_TEACHER_SENSEI_CONTRACT.md
  - scripts/docs/specs/ROSETTA-FOX-SPEC.md
  - scripts/docs/specs/PROMPT-STUDIO-UI-SPEC.md
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md
  - .claude/plans/coldlight-recovery/07-wizard-recode-spec.md
---

# Contextual guidance — tooltips, pop-ups and Knowledge Drops from real signals, fitted to each developer

## Goal

Every tooltip, pop-up and Knowledge Drop Clyffy shows is chosen by
deterministic rules in Rust from a real signal (what happened, where it came
from, what the user typed), carries that provenance, is fitted to **this
developer** — their projects, GitHub history, vocabulary and what they
already know — and is rendered by a UI that holds no logic.

Three parts, built in order:

- **A — Signal fabric.** One typed path from Rust to every screen. Rust owns
  state; the UI renders it. Live stats, model progress, boot, setup/Clyffy and
  guidance all ride it.
- **B — Guidance.** Signals → trigger rules → guides with provenance → one
  renderer.
- **C — Developer profile.** Onboarding feeds projects and GitHub; usage and
  knowledge-card reactions keep it current; rules and prompts read it.

Research notes with every citation: `~/.claude/plans/unified-signal-fabric.md`
(planning skill, 2026-10-12).

## Terms

| Term | Meaning here | Industry source |
| --- | --- | --- |
| Signal | One typed message: provenance header + payload variant | CloudEvents envelope |
| State topic | A value Rust owns and replays to late windows (hardware, models readiness, boot, profile) | Kubernetes list + watch; tokio `watch` |
| Guide | One piece of guidance shown to the user | Pendo "Guides", Appcues "Flows" |
| Surface | How a guide appears: `tooltip`, `hotspot`, `modal`, `slideout`, `inline` | Appcues / Pendo pattern names |
| Anchor | The UI element a guide attaches to — `data-guide-anchor="onboarding.brain.change"` | Pendo element targeting |
| Trigger rule | Event + conditions + frequency | Appcues trigger / audience / frequency |
| Provenance | The signal and facts that caused the guide, shown as "Why am I seeing this?" | W3C PROV |
| Knowledge entry | Library content: Did You Know?, Knowledge Drop, Heads Up, Pro Tip, Glossary | `00_MASTER_SPEC.md` |
| Flow | A multi-step scripted guide (the setup wizard) | existing `interactions` module |
| Developer profile | Per-user data: skill per domain, personal lexicon with weights, concept mastery, sources | learner model (adaptive learning); `08_TEACHER_SENSEI_CONTRACT.md` `user_profile` |
| Lexicon | The terms this developer uses and knows, each with a weight, source and last-seen time | Rosetta Fox "vocabulary map" |
| Mastery | Per-concept memory strength from knowledge-card reactions | FSRS (used by Anki) |

## How it works

```text
producers (Rust)                     kernel loader · hardware · boot · chat · project scan · GitHub
  → signal fabric (engine)           events → SignalRouter │ state → StateStore (latest + revision)
  → trigger rule match (Rust)        event kind + state conditions + profile conditions + term sets
  → content resolve                  copy key (wizard_copy) | knowledge query (libSQL selector, profile-weighted)
  → frequency gate                   impressions + reactions in libSQL
  → Guidance signal                  { guide, surface, anchor, content, provenance(correlation_id), pose }
  → one bridge → UI fabric           subscribe → snapshot → apply newer revisions
  → GuideHost renders it             tooltip · modal · slideout · inline card · Clyffy pose — no logic
  → user acts → intent back to Rust  dismiss · helpful · not_helpful · act → profile + mastery update
```

Machine language, not an LLM: rules are pattern matches over signals, state
and the profile. The same rules later read the project index (plan 0005), so
answers that look like AI come from the codebase and the profile.

## Grounded in shipping practice

| Mechanism | Precedent | What we take |
| --- | --- | --- |
| Events for small notifications, ordered channels for streams | **Tauri 2** docs: events "not designed for low latency or high throughput", JSON payloads; Channels "designed to be fast and deliver ordered data" (Tauri's own download progress and process output) | global signals over one event; tokens and per-request progress over typed `Channel<T>` |
| Latest value vs every value | **tokio** `watch` "only retains the last sent value"; `broadcast` delivers every value, drops the oldest on lag (`Lagged(n)`) | state = latest per topic; events = broadcast |
| Snapshot then changes, no gaps | **Kubernetes** list + watch from `resourceVersion`; `410 Gone` → re-list | subscribe first, fetch snapshot, apply newer revisions; lag → resync |
| Envelope | **CloudEvents 1.0**: `id`, `source`, `type`, `time`, extensions; version in type/schema | header `id`, `source`, `timestamp`, `correlation_id`, `revision` |
| Typed bindings, current in dev | **tauri-specta** official example: typed `Channel<T>` args; bindings exported at startup under `#[cfg(debug_assertions)]` | restore debug-only export |
| Contract kept honest | **strum** (generated kinds), **schemars** (JSON Schema), **insta** (snapshot diffs — what `buf breaking` does for Protobuf), **proptest** (round-trip + invariants) | one spec per signal; wire changes are reviewed diffs |
| Guides with targeting and frequency | **Pendo / Appcues** | guide, surface, anchor, trigger, frequency |
| Memory strength from reviews | **FSRS** — `fsrs` crate 6.6.2; Anki's Rust core depends on it (`ankitects/anki` `rslib/Cargo.toml`) | concept mastery from knowledge reactions |
| Developer signals from code | **tokei** 15.0 (language stats), **tree-sitter** 0.27 (already in the kernel safety scanner), **gix** 0.89 (git history), **octocrab** 0.54 (GitHub API) | profile from projects + GitHub, in Rust, no Python runtime |

## Context — what exists today

Verified 2026-10-10 (guidance) and 2026-10-12 (fabric, profile).

| Piece | State | Evidence |
| --- | --- | --- |
| Knowledge library spec | Exists | [00_MASTER_SPEC.md](../docs/knowledge_library/00_MASTER_SPEC.md): 5 types, 407 entries, libSQL schema, weighted selector |
| Authored content docs | **Missing** | Only 00, 01, 06, 07, 08 exist. [01_DID_YOU_KNOW.md](../docs/knowledge_library/01_DID_YOU_KNOW.md) stops at entry 47 of 100. 02–05 were never committed on any branch (`git log --all`). |
| Shipped corpus | Partial — 119 of 407 | [knowledge/data/](../kernel/devpulse-clyffy/src/cortex/knowledge/data/): 55 Did You Know, 6 Knowledge Drops, 5 Heads Up, 5 Pro Tips, 24 Glossary, 24 quiz-style |
| MD → JSON build | Exists, not re-run | [scripts/knowledge_library/build.mjs](../scripts/knowledge_library/build.mjs) |
| libSQL tables + boot sync | **Works** | [relational.rs:652](../systems/devpulse-engine/src/platform/services/relational.rs#L652), [boot/mod.rs:280](../systems/devpulse-engine/src/platform/boot/mod.rs#L280). `user.db`: 119 rows, 56 shown |
| Selector | Works — random rotation only | [selector.rs](../kernel/devpulse-clyffy/src/cortex/knowledge/selector.rs): affinity × cooldown × reaction |
| Tauri command | Works | [commands/knowledge.rs](../interfaces/desktop/src-tauri/src/commands/knowledge.rs) `get_knowledge_entry` + reactions |
| Knowledge cards | Exist — self-fetch on a timer | [design/blocks/knowledge/](../interfaces/desktop/src/lib/design/blocks/knowledge/) |
| `ClyffyKnowledgeNudge` | **Dead** — mounted nowhere | [ClyffyKnowledgeNudge.svelte](../interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyKnowledgeNudge.svelte) |
| Knowledge context stack | Stub | [knowledge-context.svelte.ts](../interfaces/desktop/src/lib/domains/app/knowledge/data-access/knowledge-context.svelte.ts): `enrichContext()` returns its input |
| Second corpus in TypeScript | **Violation** | [loading-content.ts](../interfaces/desktop/src/lib/domains/clyffy/learning/loading-content.ts), [activity-hud/knowledge-drops.ts](../interfaces/desktop/src/lib/sys/activity-hud/knowledge-drops.ts) |
| Trigger types | Flows only — nothing evaluates them | [interactions/mod.rs:112](../kernel/devpulse-clyffy/src/interactions/mod.rs#L112) `InteractionTrigger`; templates `setup`, `welcome-back` |
| Teacher signals | **Missing** | `terminology_gap`, `confusion_signal`, `mastery_evidence`, `competency_update`: the contract says they fire; no code emits them |
| Tooltip copy | **Zero consumers** | `wizard_copy.default.toml` `[clyffy_tooltips]`, 8 entries |
| Tooltip types | Types only | [wizard/tooltips.rs](../kernel/model-loader/src/wizard/tooltips.rs) `TooltipEntry` |
| Tooltip component | Exists — 0 uses in onboarding | [design/components/tooltip/](../interfaces/desktop/src/lib/design/components/tooltip/) |
| Clyffy art | Partial — no state → pose catalog | `static/imgs/clyffy/` + `static/imgs/mascot/`; painted hero + pixel sprites; hero1 carries a generator watermark |
| Clyffy components | Exist — pose not driven by state | `ClyffyMascot`, `ClyffyHeadshot`, `ClyffyStatusOrb`, `ClyffyNarration` |
| Known defect | Open | The "Did you know?" deck overlaps the wizard's Apply-all button |
| **Signal fabric** | Built in April, wired 2026-10-12 for hardware only | [signals/](../systems/devpulse-engine/src/signals/) `Signal{header, payload}`, provenance `SignalSource` + `correlation_id`, `SignalRouter`; kernel expects "the (future) `SignalBridge`" ([interactions/mod.rs:143-145](../kernel/devpulse-clyffy/src/interactions/mod.rs#L143-L145)) |
| Competing paths | 4 more | `InternalEvent` bus ([facade/events.rs:253](../systems/devpulse-engine/src/platform/facade/events.rs#L253)); loader `EventBridge` flattening a typed enum into `model:*` strings ([integrations/events.rs](../systems/devpulse-engine/src/platform/integrations/events.rs)); `emit_status` untyped ([commands/mod.rs:66](../interfaces/desktop/src-tauri/src/commands/mod.rs#L66)); tauri-specta event list ([events.rs](../interfaces/desktop/src-tauri/src/events.rs)). UI: 23 raw `listen("…")` |
| `EventFacade` | Built, **never spawned** | translates internal events to plain-language `SurfaceEvent`, whitelists, **redacts IP-sensitive internals** ([facade/mod.rs:1-20](../systems/devpulse-engine/src/platform/facade/mod.rs#L1-L20)) |
| Profile storage | **Tables only, 0 readers or writers** | `attunement_preferences`, `attunement_learned`, `translation_memory`, `hardware_profile` ([relational.rs:549-600](../systems/devpulse-engine/src/platform/services/relational.rs#L549-L600)); `profiles.expertise_level` one integer, default 1 ([devpulse/profile.rs:139-159](../interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs#L139-L159)) |
| Profile specs | Authored, unbuilt | `competency_update {user_level, known_concepts, gaps, suggested_terminology}` ([08_TEACHER_SENSEI_CONTRACT.md:36,73-89](../docs/knowledge_library/08_TEACHER_SENSEI_CONTRACT.md#L36)); vocabulary map ([ROSETTA-FOX-SPEC.md:161-168](../scripts/docs/specs/ROSETTA-FOX-SPEC.md#L161-L168)); `user.profile` / `user.history` ([PROMPT-STUDIO-UI-SPEC.md:119-126](../scripts/docs/specs/PROMPT-STUDIO-UI-SPEC.md#L119-L126)) |
| GitHub, project stats | **No code** | `projects` table holds name, path, type only |

What is wrong today:

- **Stats never updated** (fixed for hardware 2026-10-12): UI listened to `model:hardware`, Rust sent `hardware-metrics-updated`. Still drifted: `inference-token` vs `inference-token-streamed`; `model:narration` has no sender.
- **Clyffy's setup screen can stay closed**: the UI recomputes "models ready" ignoring `setup_done` ([platformState.svelte.ts:309](../interfaces/desktop/src/lib/sys/runes/platformState.svelte.ts#L309)) while Rust says not ready ([src-tauri lib.rs:1194](../interfaces/desktop/src-tauri/src/lib.rs#L1194)) — the same state has two shapes.
- **Late windows and lag lose data**: snapshot fetched before listeners attach; the RRD bridge stops on its first `Lagged`.
- **Dev loop runs on stale bindings**: startup export removed ([lib.rs:528-535](../interfaces/desktop/src-tauri/src/lib.rs#L528-L535)); this crashed the app on 2026-10-12.
- **Guidance cannot be personal**: nothing records what the developer knows, uses or struggles with.

## Onboarding scope (amends plan 0001)

Owner direction, 2026-10-10 and 2026-10-12: onboarding **connects the Brain
and feeds the developer profile** — the user points DevPulse at their project
folders and connects GitHub; the scan runs in the background and the profile
fills in. **Vision, Voice and Memory are not part of onboarding.** They are
offered later by guides, when a real signal proves the user needs them:

| Need proven by | Condition | Guide (modal) |
| --- | --- | --- |
| Image pasted or dropped into chat | Vision not set up, and the Brain can't see images | "Want me to see images? I can set up Vision." [Set it up] [Not now] |
| Message mentions the screen, a screenshot or an error box (term set) | Same | Same |
| Mic button or push-to-talk pressed | Voice not set up | "Want to talk out loud? I can set up Voice." [Set it up] [Not now] |
| Project folder opened, or a message names a file or symbol | Memory not set up | "Want me to remember this project?" [Yes] [Not now] |
| The Brain reports it can see images | — | No guide. Vision shows "Built into your Brain". |

[Set it up] opens that capability's card in the Model Loader (plan 0001's
maintain view).

## Non-goals

- No LLM decides when or what to show. An LLM may later supply content, never
  triggers.
- No content is generated at runtime (contract rule 2: payloads are read-only).
- Endpoint discovery and configuration stay in plan 0001; runtimes in plan
  0007; codebase indexing in plan 0005 — this plan consumes them when ready.
- The agent pop-up subsystem (07 spec track) is separate.
- No profile data leaves the machine; team sharing is a later, opt-in plan.
- Persisting signals (Durable/Analytics sinks) — versioned when the first sink persists.

## Phases

Each phase touches at most 5 files and is verified live before approval of
the next. Within a phase, Rust and bindings land and the app restarts before
any UI edit that uses them. Each phase deletes the path it replaces.

### Part A — Signal fabric

| # | Outcome | Files | Live check |
| --- | --- | --- | --- |
| A1 | Dev loop: bindings exported at debug startup (logged, never `expect`) | `src-tauri/src/lib.rs`, `src-tauri/bin/export-bindings.rs` | change a Rust signal type → app restart rewrites `bindings.ts`; GPU/VRAM numbers change every 2 s |
| A1b | `cargo xtask clippy -p <crate>` / `cargo xtask test -p <crate>` apply the same `[build.deps.*]` env (sccache wrapper, CC/CXX, cmake) as `run-dev`, so lint/test and the dev loop share build artifacts instead of invalidating each other's build-script fingerprints (observed: 264-crate rebuild after each plain `cargo clippy`) | `xtask/src/commands/*`, `xtask/src/main.rs` | clippy then `run-dev` → backend stage reuses artifacts (seconds, not minutes) |
| A1c | The linker is declared once in `.cargo/config.toml` (`rust-lld.exe`, resolved by rustc from its sysroot tools dir) instead of an env var only xtask sets. Cargo hashes the target linker into every unit's fingerprint (check units too), so the env-only linker made the outer `cargo xtask` build, the inner xtask cargo, plain cargo and rust-analyzer rebuild the shared host units (`proc-macro2` → `syn` → every derive) in place on each switch: ~1,386 crates per `run-dev` | `.cargo/config.toml`, `xtask/src/workspace.rs` | `cargo xtask clippy` → `cargo xtask run-dev` → backend stage rebuilds only workspace members; a second `cargo xtask` call does not relink xtask |
| A2 | Signal registry + contract tests: generated `SignalKind`, one `SignalSpec` per kind (delivery, sinks, audience, coalesce, version) — a kind without a spec does not compile | `signals/variants.rs`, `signals/spec.rs`, engine `Cargo.toml` (strum, schemars, insta, proptest — latest stable), `signals/tests/contract.rs`, spec constant in the bindings builder | changing a payload fails the snapshot test; every kind round-trips |
| A2b | Hardware types without the `inference` gate: kernel feature `model-loader-core` (types + NVML, no candle/ort) | clyffy `Cargo.toml`, clyffy `lib.rs`, engine `Cargo.toml`, `platform/mod.rs` | engine builds with default features and links `HardwareMetrics` |
| A2c | Signal tuning is configuration: `[signals]` in `config/platform/signals.toml` (coalesce, sample interval), shipped defaults + user override, unknown kind rejected; `SignalSpec` keeps contract facts only | `config/platform/signals.toml`, `config/loader.rs`, `config/mod.rs`, `signals/spec.rs`, `signals/variants.rs`, contract test | config tests: shipped defaults, override, unknown kind fails |
| A3 | `StateStore`: latest value per topic + revision + process epoch; router interest per subscriber | `signals/state.rs`, `signals/header.rs`, `signals/router.rs`, `signals/mod.rs`, engine `lib.rs` | `cargo test -p devpulse-engine`: latest wins, revision monotonic, interest set semantics |
| A4 | Snapshot, interest, resync | `commands/signals.rs`, `commands/mod.rs`, `src-tauri/src/lib.rs`, `signal-fabric.ts`, `signal-fabric.test.ts` | a window opened after boot shows current state at once; forced lag → one resync |
| A5 | Hardware produced by the kernel loader, only while a screen shows it | `model-loader/src/service.rs`, `integrations/events.rs`, `src-tauri/src/lib.rs`, `hardware.state.svelte.ts` | stats live; no sampling with no screen open; desktop loop gone |
| A5b | Dashboard renders only real values: CPU/RAM/GPU from hardware state; messages/sessions/uptime labelled as what they are; invented gauges (latency-as-"Context", messages-as-"Commits", uptime-as-"streak", hardcoded branch) removed | `hardware.state.svelte.ts`, `devpulse.types.ts`, `devpulse.service.ts`, `devpulse.state.svelte.ts`, `devpulse/index.ts`, `DevPulseDashboard.svelte`, `stats/+page.svelte` | dashboard values match the hardware signal; no proxy labels |
| A6a | `Models` readiness signal contract | `signals/payloads.rs`, `signals/variants.rs`, `signals/spec.rs`, contract test | contract snapshot reviewed |
| A6b | Rust computes readiness once (`models_readiness`) and publishes it after every mutation and at boot; `get_models_status` lists without a disk scan; `ModelsStatusSnapshot` deleted | `commands/models/mod.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/state.rs` | `cargo check`; session log `models readiness published` |
| A6c | UI renders Rust's readiness; lists refetched on revision change; raw listeners deleted | `platformState.svelte.ts`, `models.state.svelte.ts`, `boot.types.ts`, 3 re-export files | UI `ready` == Rust `ready`; setup screen with Clyffy opens when setup is incomplete |
| A7a | `Boot` state contract (phase, error, latest status per step) | `platform/init.rs`, `signals/payloads.rs`, `signals/variants.rs`, `signals/spec.rs`, contract test | contract snapshot reviewed |
| A7b | Bridge starts in `setup` (before boot); every tracker change publishes `Boot` — added beside the old events first | `src-tauri/src/lib.rs`, `src-tauri/src/state.rs`, `commands/signals.rs` | live: `boot` signals stream from revision 1 during boot |
| A7c | UI follows `boot`; failure panel reads Rust's boot error | `platformState.svelte.ts`, `BootOverlay.svelte` | UI logs READY from the fabric |
| A7d | Old paths removed: `BootPhaseChanged`, `platform:boot-failed`, `platform:subsystem-status`, `get_boot_state`, `BootSnapshot`, hand-written `boot.types.ts` / `init.types.ts` | `lib.rs`, `events.rs`, `state.rs`, `commands/sys/{boot,mod}.rs`, TS mirrors + `bindings/sys/boot` | bindings carry one `BootPhase`; `pnpm check` 0 errors |
| A8 (first) | Readiness computed in the engine (move `models_readiness` out of the desktop crate) and published when the loader's background registry scan completes (`RegistryScanComplete`); `models.state` stops scanning at mount (today it races boot: "Platform not ready") | `services/model_loader.rs`, `integrations/events.rs`, `commands/models/mod.rs`, `models.state.svelte.ts` | lists correct after a cold boot with no mount-time errors |
| A8a | Loader: loading / unload / capability / runtime version | `traits/events.rs`, `signals/variants.rs`, `integrations/events.rs`, `capability-channel.svelte.ts`, `models.state.svelte.ts` | slot load progress live |
| A8b | Loader: downloads, coalesced progress | `integrations/events.rs`, `download.state.svelte.ts` | progress then completion, in order |
| A8c | Loader: install / swap / wizard / intelligence; string bridge removed | `integrations/events.rs`, `IntelligenceMemoryStream.svelte`, `narration.state.svelte.ts`, `src-tauri/src/lib.rs` | no `model:*` strings left |
| A9a | Cloud tokens over typed `Channel<T>` (gate: typed-channel spike on our specta pin) | `commands/cloud/mod.rs`, `events.rs`, cloud UI service | reply streams with no gaps |
| A9b | Local inference tokens over `Channel<T>` (paths kept by plan 0007 only) | `commands/models/mod.rs`, `inference.service.ts` | `inference-token` gone |
| A10 | Remaining events; `emit_status` and the typed-event list deleted | `commands/updates/mod.rs`, `updates.state.svelte.ts`, `commands/chat/sessions.rs`, `events.rs`, `commands/mod.rs` | `events.rs` holds only the bridge event |
| A11a | `EventFacade` spawned; plain-language `surface` output published as `Surface` signals | `platform/mod.rs`, `facade/mod.rs`, `facade/surface.rs`, `signals/variants.rs` | readable headlines in the main UI; nothing IP-sensitive in payloads |
| A11b | `dev` output as `Dev` signals to devtools windows only; RRD hand bridge deleted | `src-tauri/src/lib.rs`, `signals/variants.rs`, `rrd.state.svelte.ts` | main window never receives `Dev` signals |
| A12 | Gates | preflight + xtask checks | CI fails on raw `listen(`, Rust `.emit("…")`, `emit_status` |

### Part B — Guidance

| # | Outcome | Files | Live check |
| --- | --- | --- | --- |
| B1 | Guide contract + rule data (kernel); flows and guides share one trigger type | `kernel/devpulse-clyffy/src/guidance/mod.rs`, `config/guidance/onboarding.default.toml`, `config/guidance/capabilities.default.toml`, `interactions/mod.rs`, `lib.rs` | tests parse every rule file, reject unknown anchors and content keys |
| B2 | Evaluator subscribes to the fabric, matches rules, resolves content, applies frequency, records the impression, publishes a `Guidance` signal whose `correlation_id` names its trigger | `platform/guidance/{mod.rs, evaluator.rs, impressions.rs}`, `platform/mod.rs`, `relational.rs` (`guide_impressions`) | tests with real rule files and libSQL; one `guidance.*` log line per guide |
| B3 | Intents: `guide_dismiss`, `guide_react`, `guide_act`, `get_anchor_tooltips` (no new event — guidance rides the fabric) | `commands/guidance.rs`, `commands/mod.rs`, `src-tauri/src/lib.rs` | bindings diff; intents reach the evaluator |
| B4a | `GuideHost.svelte` renders tooltip / modal / slideout / inline from `Guidance` signals, mounted once in `routes/(app)/+layout.svelte` | `design/blocks/clyffy/GuideHost.svelte`, `routes/(app)/+layout.svelte` | a real signal → screenshot + `guide_impressions` row + log line, matching |
| B4b | `KnowledgeDeck` renders only what the host passes; `ClyffyKnowledgeNudge` deleted; TS tip lists deleted after B8 | `KnowledgeDeck.svelte`, `ClyffyKnowledgeNudge.svelte`, `loading-content.ts`, `knowledge-drops.ts` | no timer fetch left |
| B5 | Anchored tooltips: `guideAnchor` action + `wizard/tooltips.rs` rewritten from copy + library | `design/behaviors/overlays/tooltip/`, `wizard/tooltips.rs`, `wizard_copy.default.toml` | gate fails on any anchor without text; hover screenshots |
| B6 | Prompt matching: term sets from glossary + rules + the developer's lexicon; word-boundary, no LLM | `platform/guidance/prompt.rs`, chat submit path, `KnowledgeTerm` | type "what's a context window" → glossary tooltip with provenance "matched 'context window' in your message" |
| B7 | Capability offers (onboarding scope above) | `capabilities.default.toml`, `attachment.added` / `mic.pressed` / `project.opened` signals | each trigger live; no guide when ready; frequency respected |
| B8 | Knowledge corpus: re-author 02–05 and Did You Know 48–100; onboarding entries; TS tips moved in; `build.mjs` run | `docs/knowledge_library/*`, `knowledge/data/*` | manifest counts == `user.db` counts |
| B9 | Clyffy likeness catalog: file name is the catalog, typed pose list generated, `Guidance` carries the pose | `static/imgs/clyffy/`, pose generator, `ClyffyMascot.svelte` | every file covered; screenshot of each mood |
| B10 | Codebase as knowledge (after plan 0005) | rules read the project index | share of guides answered from the index |

### Part C — Developer profile

| # | Outcome | Files | Live check |
| --- | --- | --- | --- |
| C1 | Profile store replaces the dead tables: skill per domain (level, confidence, evidence), lexicon (term, weight, source, last seen), concept mastery (FSRS state), sources (projects, GitHub, last scan); published as a `Profile` state topic | `kernel/devpulse-clyffy/src/profile/{mod.rs, store.rs}`, `relational.rs` (drop `attunement_*`, `translation_memory`, `expertise_level`; add profile tables), `signals/variants.rs` | tests on real libSQL; profile state visible in a devtool |
| C2 | Project scan in the background: languages (tokei), frameworks + identifiers (tree-sitter), commit cadence (gix) → skill + lexicon | `profile/scan.rs`, `commands/projects/mod.rs` (scan on add), kernel `Cargo.toml` | add this repo → Rust/TypeScript/Svelte skills and its own terms appear, with sources |
| C3 | GitHub connect: OAuth device flow, token in the OS keychain, repos + languages + activity via octocrab → same profile | `profile/github.rs`, `commands/profile.rs`, kernel `Cargo.toml` | connect a real account → profile gains GitHub-sourced skills; token never in the DB |
| C4 | Mastery from knowledge reactions (FSRS); the selector favours due and weak concepts at the developer's level | `profile/mastery.rs`, `cortex/knowledge/selector.rs`, `commands/knowledge.rs` | react to cards → `concept_mastery` changes; next drops shift |
| C5 | Teacher signals emitted per the contract: `terminology_gap`, `mastery_evidence`, `confusion_signal`, `competency_update` → silent profile update | `platform/guidance/prompt.rs`, `profile/store.rs`, `signals/variants.rs` | an unknown term in a message → `terminology_gap` signal → lexicon updated |
| C6 | Personalization: trigger rules gain profile conditions (level, term known/unknown); prompt assembly reads the profile (`user.profile`) | `guidance/mod.rs`, rule files, prompt assembly | the same trigger shows a different guide to a beginner vs an expert profile |
| C7 | Onboarding view: "Point me at your projects / Connect GitHub", renders the captured stats (dumb UI) | plan 0001 UI phase files | first run → stats fill in live as the scan runs |

## Decisions needed

1. Placement: rule data, knowledge content and the developer profile in
   `kernel-clyffy` (AI configuration; it drives prompts and guidance); the
   fabric and evaluator in `engine`. Confirm.
2. Vocabulary: signal, state topic, guide, surface, anchor, trigger rule,
   provenance, developer profile, lexicon, mastery. Confirm.
3. The missing content (02–05, Did You Know 48–100): anywhere else — another
   machine, a Claude.ai chat, a drive? If not, re-authored through
   `07_DELEGATION_PROMPT.md`.
4. Clyffy art: the request was cut off at "a plethora of …" — poses,
   expressions, outfits? Who produces new art? Painted or pixel as primary?
5. Clyffy's pronoun: `MODEL-LOADER-UX-REQUIREMENTS.md` says "her own voice";
   the owner said "his likeness" on 2026-10-10. Which goes in copy and voice?
6. Frequency defaults: knowledge entries keep the 30-day cooldown; guides once
   per trigger per session?
7. `KnowledgeDeck`'s timed rotation: keep as an "idle moment" rule, or remove?
8. Internal events reach the UI through the existing `EventFacade`
   (translate, whitelist, redact) rather than being merged into the signal
   enum (A11). Recommended.
9. Hardware sampled only while a screen shows it (A5), per the 2026-04-20
   no-auto-load directive. Recommended.
10. GitHub sign-in by OAuth device flow with the token in the OS keychain
    (C3). Confirm against GitHub's current docs in C3.

## Verification

- `cargo clippy -p devpulse-clyffy -- -D warnings`,
  `cargo clippy -p devpulse-engine -- -D warnings`,
  `cargo clippy -p model-loader -- -D warnings`, `cargo test` on each.
- `cargo check -p devpulse_desktop_backend`.
- `cd interfaces/desktop && pnpm check` — 0 errors, 0 warnings; fabric reducer tests.
- Live against `cargo xtask run-dev`: every guide is shown by reproducing its
  real trigger, never by injecting an event; evidence is a screenshot, a
  `guide_impressions` row and a `guidance.*` log line that match. A second
  window opened after boot shows identical state.
- End state: no raw `listen(` outside `signal-fabric.ts`; no Rust `.emit("…")`;
  profile tables populated from real projects and a real GitHub account.

## Log

- 2026-10-10 — Drafted. Inventory verified: `user.db` holds 119 knowledge
  rows, 56 shown; 0 tooltips in onboarding; `ClyffyKnowledgeNudge` unmounted;
  `enrichContext()` a stub; Teacher signals never emitted; content docs 02–05
  never committed.
- 2026-10-12 — Hardware stats wired through the signal fabric ahead of this
  revision (variant, bridge, UI fabric, real field names). It crashed the app
  because UI code reloaded before bindings were regenerated; A1 fixes that.
- 2026-10-12 — Extended at owner direction instead of opening new plans: Part A
  (signal fabric, from the never-approved draft 0008, now deleted — ID retired)
  and Part C (developer profile from projects, GitHub and usage). Onboarding
  scope now includes feeding the profile. Research:
  `~/.claude/plans/unified-signal-fabric.md`.
- 2026-10-12 — Implemented A1–A6 (with A2b, A2c, A5b added at owner direction: no inference gate,
  no hardcoded tuning, no invented stats). Verified: clippy `-D warnings` on desktop + engine + kernel;
  engine signal tests (state proptest, router interest, config) + 4 contract tests; 2 bridge tests;
  5 fabric ledger tests (Chromium); `pnpm check` 0 errors. Live: `bindings: regenerated` after a Rust
  change; UI snapshot sync; hardware signals every 2 s only while watched (200+ forwarded); UI renders
  Rust readiness (`ready=false setup_complete=false`) and the setup screen with Clyffy + a Knowledge
  Drop opens. Found and fixed on the way: the hardware push sent a cached snapshot frozen at boot
  (`hardware_metrics()` never refreshed). Deviations: A2c and A6c touched 6 files (one-line exports);
  a ~90 s dashboard render error while A5b's data and render halves landed in two steps on the
  running app — multi-file UI changes now land add-new → switch → remove-old. Seen, not ours:
  sessions query fails (`.userdata` schema), `IPC logging disabled` on hot reload, DuckDB span flush
  warnings.
- 2026-10-12 — A7 done as add → switch → remove (A7a–d). Live: 22 `boot` signals stream from
  revision 1 during boot; UI reaches READY from the fabric; `get_boot_state`, three string/typed boot
  events and two hand-written TS mirrors deleted. Mistake caught: starting the bridge in `setup`
  panicked ("no reactor running" — `setup` is outside the tokio runtime); fixed by taking the
  subscription synchronously and running the loop on Tauri's async runtime.
- 2026-10-12 — A8 (first) done. `Engine` became a cheap-to-clone handle passed into
  `Platform::boot`, so engine services publish directly (the shell no longer computes AI state).
  Readiness lives in the engine model-loader service (`readiness` / `publish_readiness`), published
  after the background registry scan and after every slot/registry change (12 desktop call sites
  now call the engine); the desktop copies and three unused `AppHandle` params were removed.
  `models.state` no longer scans at mount; it re-reads lists on each `models` revision once Rust's
  `boot` state is ready (the scan can finish before the platform answers queries). Live: "models
  readiness published" right after "registry scan complete". Cold start: no `reload failed`.
- 2026-10-12 — A1b + A1c done. `cargo xtask clippy|test (-p <crate>… | --workspace) [-- <cargo args>]`
  apply `run-dev`'s env and its acceleration features (qualified `pkg/feature`, only for packages
  that declare them); the `pre-push` clippy hook uses it. A1b alone did not meet its check (384 s
  backend stage after clippy). Cargo's fingerprint log showed why: the linker was an env var only
  xtask's inner cargo saw, and cargo hashes the linker into every unit (`config`), so the outer
  `cargo xtask` build and the inner build rebuilt the shared host units (`proc-macro2` → `syn` →
  every derive) in place on each call. A1c declares `rust-lld.exe` in `.cargo/config.toml`. Measured:
  second `cargo xtask clippy` 17 s (xtask not relinked, 0 dependencies rebuilt); `run-dev` backend
  stage after clippy **9.5 s** for 1,386 crates (was 384 s). Seen, not fixed: (1) 7 workspace crates
  re-check on every clippy (~15 s) because rustc keeps an unchanged `.rmeta`'s old mtime while its
  dependencies are newer (cargo: `FsStatusOutdated`); (2) the sccache guard sets
  `SCCACHE_LOG=info,sccache=debug`, overriding `.cargo/config.toml`'s `warn`, so DEBUG lines flood
  clippy/test output; `RUSTC_WRAPPER` is set in three places; (3) clippy on a single library crate
  resolves its own feature set, so it builds a separate artifact set once (cargo feature
  unification, not thrash). CI's clippy step is unchanged (clean runner).
