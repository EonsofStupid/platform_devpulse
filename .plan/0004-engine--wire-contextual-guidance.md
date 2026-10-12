---
id: 0004
boundary: engine
paths:
  - systems/devpulse-engine/src/platform/guidance/
  - kernel/devpulse-clyffy/src/guidance/
  - kernel/devpulse-clyffy/config/guidance/
touches: [kernel-clyffy, kernel-model-loader, desktop-tauri, desktop-coldlight, desktop-layouts, desktop-clyffy]
status: draft
owner: jesse
created: 2026-10-10
updated: 2026-10-10
supersedes: []
specs:
  - docs/knowledge_library/00_MASTER_SPEC.md
  - docs/knowledge_library/08_TEACHER_SENSEI_CONTRACT.md
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md
  - .claude/plans/coldlight-recovery/07-wizard-recode-spec.md
---

# Contextual guidance — tooltips, pop-ups and Knowledge Drops triggered by real signals

## Goal

Every tooltip, pop-up and Knowledge Drop Clyffy shows is chosen by
deterministic rules in Rust from a real signal (what happened, where it came
from, what the user typed), carries that provenance, and is rendered by a UI
that holds no logic.

## Terms

| Term | Meaning here | Industry source |
| --- | --- | --- |
| Guide | One piece of guidance shown to the user | Pendo "Guides", Appcues "Flows" |
| Surface | How a guide appears: `tooltip`, `hotspot`, `modal`, `slideout`, `inline` | Appcues / Pendo pattern names |
| Anchor | The UI element a guide attaches to — `data-guide-anchor="onboarding.brain.change"` | Pendo element targeting |
| Trigger rule | Event + conditions + frequency | Appcues trigger / audience / frequency |
| Provenance | The signal and facts that caused the guide, shown as "Why am I seeing this?" | W3C PROV |
| Knowledge entry | Library content: Did You Know?, Knowledge Drop, Heads Up, Pro Tip, Glossary | `00_MASTER_SPEC.md` |
| Flow | A multi-step scripted guide (the setup wizard) | existing `interactions` module |

## How it works

```text
signal on the engine bus (SignalSource = provenance)   probe.finished · prompt.submitted · attachment.added · mic.pressed
  → trigger rule match (rule data, evaluated in Rust)   event kind + state conditions + term sets / patterns
  → content resolve                                     copy key (wizard_copy) | knowledge query (libSQL selector)
  → frequency gate                                      impressions + reactions in libSQL
  → GuideShown { guide, surface, anchor, content, provenance, pose }
  → GuideHost renders it — no logic in the UI           tooltip · modal · slideout · inline card · Clyffy pose
  → user acts → intent back to Rust                     dismiss · helpful · not_helpful · act
```

Machine language, not an LLM: rules are pattern matches over signals and
state. The same rules later read the project index (plan 0005), so answers
that look like AI come from the codebase.

## Context — what exists today (verified 2026-10-10)

| Piece | State | Evidence |
| --- | --- | --- |
| Knowledge library spec | Exists | [00_MASTER_SPEC.md](../docs/knowledge_library/00_MASTER_SPEC.md): 5 types, 407 entries, libSQL schema, weighted selector |
| Authored content docs | **Missing** | Only 00, 01, 06, 07, 08 exist. [01_DID_YOU_KNOW.md](../docs/knowledge_library/01_DID_YOU_KNOW.md) stops at entry 47 of 100. 02–05 (Knowledge Drops, Heads Up, Pro Tips, Glossary) were never committed on any branch (`git log --all`). |
| Shipped corpus | Partial — 119 of 407 | [knowledge/data/](../kernel/devpulse-clyffy/src/cortex/knowledge/data/): 55 Did You Know, 6 Knowledge Drops, 5 Heads Up, 5 Pro Tips, 24 Glossary, 24 quiz-style |
| MD → JSON build | Exists, not re-run | [scripts/knowledge_library/build.mjs](../scripts/knowledge_library/build.mjs) |
| libSQL tables + boot sync | **Works** | [relational.rs:652](../systems/devpulse-engine/src/platform/services/relational.rs#L652), [boot/mod.rs:280](../systems/devpulse-engine/src/platform/boot/mod.rs#L280). Live `.userdata/user/libsql/user.db`: 119 rows, 56 shown |
| Selector | Works — random rotation only | [selector.rs](../kernel/devpulse-clyffy/src/cortex/knowledge/selector.rs): affinity × cooldown × reaction |
| Tauri command | Works | [commands/knowledge.rs](../interfaces/desktop/src-tauri/src/commands/knowledge.rs) `get_knowledge_entry` + reactions |
| Knowledge cards | Exist — self-fetch on a timer | [design/blocks/knowledge/](../interfaces/desktop/src/lib/design/blocks/knowledge/): Did You Know / Knowledge Drop / Heads Up / Pro Tip / Glossary cards, `KnowledgeDeck`, `KnowledgeTerm` |
| `ClyffyKnowledgeNudge` | **Dead** — mounted nowhere | [ClyffyKnowledgeNudge.svelte](../interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyKnowledgeNudge.svelte) |
| Knowledge context stack | Stub | [knowledge-context.svelte.ts](../interfaces/desktop/src/lib/domains/app/knowledge/data-access/knowledge-context.svelte.ts): `enrichContext()` returns its input |
| Second corpus in TypeScript | **Violation** | [loading-content.ts](../interfaces/desktop/src/lib/domains/clyffy/learning/loading-content.ts), [activity-hud/knowledge-drops.ts](../interfaces/desktop/src/lib/sys/activity-hud/knowledge-drops.ts) hardcode tips outside the library |
| Trigger types | Flows only — nothing evaluates them | [interactions/mod.rs:112](../kernel/devpulse-clyffy/src/interactions/mod.rs#L112) `InteractionTrigger { FirstRun, Manual, HardwareChanged, SlotBroken, LongAbsence }`; templates `setup`, `welcome-back` |
| Teacher signals | **Missing** | `terminology_gap`, `confusion_signal`, `mastery_evidence`, `competency_update`: the contract says they fire; no code emits them |
| Tooltip copy | **Zero consumers** | `wizard_copy.default.toml` `[clyffy_tooltips]`, 8 entries |
| Tooltip types | Types only — no query, no consumer | [wizard/tooltips.rs](../kernel/model-loader/src/wizard/tooltips.rs) `TooltipEntry { element_id, label, knowledge_drop }` |
| Tooltip component | Exists — 0 uses in onboarding | [design/components/tooltip/](../interfaces/desktop/src/lib/design/components/tooltip/), used in 3 devtool/badge spots |
| Signal provenance | Exists — linked to no surface | [signals/header.rs:9](../systems/devpulse-engine/src/signals/header.rs#L9) `SignalSource` |
| Clyffy art | Partial — no state → pose catalog | `static/imgs/clyffy/` 16 PNG, `static/imgs/mascot/` 8 PNG + GIF (3 identical duplicates). Painted hero (lab coat, ClyffyAI badge) + pixel sprites (head, standing, blink, wobble, side-look). `clyffy-mascot-hero1.png` carries an image-generator sparkle watermark, bottom right |
| Clyffy components | Exist — pose not driven by state | `ClyffyMascot`, `ClyffyHeadshot`, `ClyffyStatusOrb`, `ClyffyNarration` |
| Known defect | Open | The "Did you know?" deck overlaps the wizard's Apply-all button |

## Onboarding scope change (amends plan 0001)

Owner direction, 2026-10-10: **Vision, Voice and Memory are not part of
onboarding.** Onboarding connects the Brain only. The other three are offered
later by guides, when a real signal proves the user needs them:

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
- Endpoint discovery and configuration stay in plan 0001; codebase indexing
  stays in plan 0005 — this plan consumes them when ready.
- The agent pop-up subsystem (07 spec track) is separate.

## Phases

Each phase touches at most 5 files and is verified live before approval of
the next.

1. **Guide contract + rule data** (kernel-clyffy)
   - Files: `kernel/devpulse-clyffy/src/guidance/mod.rs` (Guide, Surface,
     Anchor, TriggerRule, Frequency, Provenance — generic names at the
     boundary), `kernel/devpulse-clyffy/config/guidance/onboarding.default.toml`,
     `kernel/devpulse-clyffy/config/guidance/capabilities.default.toml`,
     `kernel/devpulse-clyffy/src/interactions/mod.rs` (its trigger enum becomes
     the shared trigger type — flows and guides trigger the same way),
     `kernel/devpulse-clyffy/src/lib.rs`.
   - Verify: clippy `-D warnings`; tests parse every rule file and reject
     unknown anchors and content keys.

2. **Evaluator in the engine**
   - Files: `systems/devpulse-engine/src/platform/guidance/{mod.rs, evaluator.rs, impressions.rs}`,
     `platform/mod.rs`, `platform/services/relational.rs` (table
     `guide_impressions` beside `knowledge_seen`).
   - Subscribes to the signal bus, matches rules, resolves content, applies
     frequency, records the impression, emits `GuideShown` with provenance.
     Tracing target `guidance.*`, one line per guide shown.
   - Verify: clippy; tests with real rule files and real libSQL in a temp dir.

3. **Tauri bridge**
   - Files: `src-tauri/src/events.rs` (`GuideShown`),
     `src-tauri/src/commands/guidance.rs` (`guide_dismiss`, `guide_react`,
     `guide_act`, `get_anchor_tooltips`), `src-tauri/src/lib.rs`, regenerated
     `bindings.ts`.
   - Verify: `cargo check -p devpulse_desktop_backend`; bindings diff.

4. **One renderer**
   - 4a: `design/blocks/clyffy/GuideHost.svelte` (renders tooltip, modal,
     slideout and inline surfaces from the event), mounted once in
     `routes/(app)/+layout.svelte`.
   - 4b: `KnowledgeDeck.svelte` renders only what the host passes (its timer
     fetch is removed); `ClyffyKnowledgeNudge.svelte` is deleted (replaced by
     the host); the TypeScript tip lists are deleted once Phase 8 has moved
     their content into the library.
   - Verify: `pnpm check` 0/0; live — a real signal, a screenshot of the
     surface, a `guide_impressions` row and a `guidance.*` log line, all
     matching.

5. **Anchored tooltips**
   - Files: `design/behaviors/overlays/tooltip/` (a `guideAnchor` action sets
     `data-guide-anchor` and wires the existing Tooltip), `wizard/tooltips.rs`
     (rewrite: label from copy + `knowledge_drop` from the library entry
     tagged with the anchor), `wizard_copy.default.toml` tooltip keys.
   - The onboarding views adopt anchors in plan 0001's UI phase.
   - Verify: a gate lists every anchor without resolved text and fails on
     any; hover screenshots.

6. **Prompt matching**
   - Files: `platform/guidance/prompt.rs` (term sets from glossary `term` +
     `see_also` and from rule files; word-boundary matching, no LLM), the chat
     submit path emits `prompt.submitted`, `KnowledgeTerm` highlights matched
     terms.
   - Verify: tests against real glossary rows; live — type "what's a context
     window", and the glossary tooltip appears on the term with provenance
     "matched 'context window' in your message".

7. **Capability offers** (the onboarding scope change above)
   - Files: `capabilities.default.toml` rules, plus the engine signals
     `attachment.added`, `mic.pressed` and `project.opened` where missing.
   - Verify: each trigger live; no guide when the capability is already
     ready; frequency respected.

8. **Knowledge corpus**
   - Restore or re-author: Did You Know 48–100, Knowledge Drops (100), Heads
     Up (58), Pro Tips (49), Glossary (100). Add onboarding entries (What is an
     endpoint? What is WSL? What is an API key?). Move the TypeScript-hardcoded
     tips into the library. Run `build.mjs`.
   - Verify: manifest counts equal `user.db` counts after boot sync.

9. **Clyffy likeness catalog**
   - The file name is the catalog: `clyffy-<style>-<pose>[-<frame>].png`. A
     build step generates the typed pose list from the folder — no
     hand-written manifest.
   - `ClyffyMascot` takes `pose`; `GuideShown` carries the pose its rule
     chose (error → confused, found → happy, teaching → pointing).
   - Inventory first: map the 24 existing files to poses, merge `mascot/` into
     `clyffy/`, clean the watermark, list the missing poses.
   - Proposed poses: greeting, idle, scanning, thinking, found, teaching,
     heads-up, confused, celebrating, offline.
   - Verify: the generated list covers every file; a missing pose prints as a
     build warning; a screenshot of each guide mood.

10. **Codebase as knowledge** (after plan 0005)
    - Rules read the project index: a message names a symbol or file → a
      tooltip with its purpose and location; an error signal in a file → a
      Heads Up from indexed history.
    - Proof metric: the share of guides answered from the index.

11. **Checkpoint** — the owner walks every guide; each is ticked with a
    screenshot, a DB row and a log line.

## Decisions needed

1. Placement: rule data and knowledge content in `kernel-clyffy` (AI
   configuration; the master spec says the kernel owns the library), the
   evaluator in `engine` (the signals live there). Confirm.
2. Vocabulary: guide, surface, anchor, trigger rule, provenance. Confirm.
3. The missing content (02–05, Did You Know 48–100): is it anywhere else — another
   machine, a Claude.ai chat, a drive? If not, it is re-authored through
   `07_DELEGATION_PROMPT.md`.
4. Clyffy art: the request was cut off at "a plethora of …" — poses,
   expressions, outfits? Who produces new art? Which style is primary in the
   app, painted or pixel?
5. Clyffy's pronoun: `MODEL-LOADER-UX-REQUIREMENTS.md` says "her own voice";
   the owner said "his likeness" on 2026-10-10. Which goes in copy and the
   voice profile?
6. Frequency defaults: knowledge entries keep the spec's 30-day cooldown;
   guides show once per trigger per session?
7. `KnowledgeDeck`'s timed random rotation: keep it as an "idle moment" rule,
   or remove it?

## Verification

- `cargo clippy -p devpulse-clyffy -- -D warnings`,
  `cargo clippy -p devpulse-engine -- -D warnings`, `cargo test` on both.
- `cargo check -p devpulse_desktop_backend`.
- `cd interfaces/desktop && pnpm check` — 0 errors, 0 warnings.
- Live over CDP against `cargo xtask run-dev`: every guide is shown by
  reproducing its real trigger, never by injecting an event. Evidence is a
  screenshot, a `guide_impressions` row and a `guidance.*` log line that
  match.
- First live target: the WSL condition on this machine today — Ollama 0.33.3
  inside Ubuntu on port 11435, while the Windows-side forwarder on 11434 hangs
  — once plan 0001 detects it.

## Log

- 2026-10-10 — Drafted. Inventory verified: `user.db` holds 119 knowledge
  rows, 56 shown; 0 tooltips in onboarding; `ClyffyKnowledgeNudge` unmounted;
  `enrichContext()` a stub; Teacher signals never emitted; content docs 02–05
  never committed.
