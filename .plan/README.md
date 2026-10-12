# `.plan/` — work plans

Every non-trivial change gets a plan file here **before** code changes. One
file = one outcome in one boundary. Plans are reviewed and approved by the
owner; code follows the plan, never the other way around.

Older sprint documents in `scripts/docs/sprints/` are history. New plans go
here.

---

## File name

```text
NNNN-<boundary>--<task>.md
```

| Part | Rule | Example |
| --- | --- | --- |
| `NNNN` | Next free 4-digit number. Never reused, never renumbered. It is the plan's permanent ID ("plan 0004"). | `0004` |
| `<boundary>` | One token from the **boundary registry** below. Never invented. | `desktop-clyffy` |
| `--` | Double hyphen. The only place it appears, so the name splits cleanly into boundary and task. | |
| `<task>` | Verb + object, 2–5 words, from the **verb list** below. The outcome, not a list of steps. | `wire-contextual-nudges` |

All lowercase ASCII, words joined with single hyphens, `.md` extension.

Machine check:

```text
^[0-9]{4}-[a-z0-9]+(-[a-z0-9]+)*--[a-z]+(-[a-z0-9]+){1,4}\.md$
```

plus: the boundary must appear in the registry and the verb in the verb list.

### Corrected example

| | Name | Why |
| --- | --- | --- |
| Before | `desktop-features-ui-agent-user-interactions.md` | No ID. No boundary/task split — where does the boundary end? `features` and `ui` are not boundaries (every desktop feature is UI). `agent` is vague. `user-interactions` is a category, not a task. |
| After | `0004-desktop-clyffy--wire-contextual-nudges.md` | ID `0004`. Boundary `desktop-clyffy` = `interfaces/desktop/src/lib/domains/clyffy/`, the folder that owns the outcome. Task says exactly what changes. |

Planned (these IDs are reserved for them):

| Plan | Name |
| --- | --- |
| Onboarding (07 spec) + subscriptions in one chat (ACP) | `0001-engine--rebuild-onboarding-workflow.md` |
| ~~User-managed AI endpoints~~ — folded into 0001 Part A (2026-10-12); ID retired | ~~`0002-kernel-clyffy--add-endpoint-registry.md`~~ |
| ColdLight / Tailwind boundary gate | `0003-repo--enforce-coldlight-boundary.md` |
| Contextual guidance + signal fabric + developer profile | `0004-engine--wire-contextual-guidance.md` |
| Prebuilt AI runtimes instead of compiled-in engines | `0007-kernel-model-loader--replace-inprocess-inference-with-runtimes.md` |
| Codebase indexing for Clyffy | `0005-kernel-clyffy--index-project-codebase.md` |

---

## Boundary registry

A boundary is an existing folder that **owns** the outcome. The `devpulse-`
prefix is dropped (it is on everything). Desktop domains use their folder
name. Add a row here only when the folder exists.

| Token | Path |
| --- | --- |
| `kernel-clyffy` | `kernel/devpulse-clyffy/` |
| `kernel-model-loader` | `kernel/model-loader/` |
| `kernel-rrd` | `kernel/rrd/` |
| `engine` | `systems/devpulse-engine/` |
| `media` | `systems/devpulse-media/` |
| `telemetry` | `systems/infra/devpulse-telemetry/`, `systems/infra/devpulse-telemetry-macros/` |
| `desktop` | `interfaces/desktop/` (whole app — only when no narrower token fits) |
| `desktop-tauri` | `interfaces/desktop/src-tauri/` |
| `desktop-coldlight` | `interfaces/desktop/src/lib/design/` |
| `desktop-devtools` | `interfaces/desktop/src/lib/devtools/` |
| `desktop-layouts` | `interfaces/desktop/src/lib/layouts/` |
| `desktop-sys` | `interfaces/desktop/src/lib/sys/` |
| `desktop-<domain>` | `interfaces/desktop/src/lib/domains/<domain>/` or `domains/app/<domain>/` — e.g. `desktop-models`, `desktop-chat`, `desktop-clyffy`, `desktop-projects`, `desktop-onboarding` (planned, 0001) |
| `xtask` | `xtask/` |
| `config` | `config/` |
| `deps` | `deps/` |
| `repo` | Cross-cutting only: gates, hooks, CI, root configuration |

A plan that touches several boundaries is named after the one that owns the
outcome and lists the others under `touches:` in the front matter. Use `repo`
only when no single boundary owns it.

---

## Verb list

| Verb | Use for |
| --- | --- |
| `add` | New capability that did not exist |
| `remove` | Delete a capability or dead code |
| `rebuild` | Replace an existing implementation from scratch |
| `fix` | Correct broken behaviour |
| `align` | Bring existing code to an existing spec or convention |
| `move` | Relocate code to the boundary that should own it |
| `extract` | Split code out into its own module, crate, or repo |
| `replace` | Swap one dependency or approach for another |
| `wire` | Connect existing pieces that are built but not connected |
| `enforce` | Add a gate that makes a rule mechanical |
| `upgrade` | Move dependencies or toolchains to newer versions |

---

## Front matter

Status lives here, not in the file name, so the name never changes.

```yaml
---
id: 0004
boundary: desktop-clyffy
paths:
  - interfaces/desktop/src/lib/domains/clyffy/
touches: [kernel-clyffy, engine]
status: draft          # draft | approved | in-progress | done | superseded
owner: <name>
created: 2026-10-10
updated: 2026-10-10
supersedes: []         # plan ids this replaces
specs:                 # the documents this plan must conform to
  - docs/PLATFORM_SPEC_LAYMAN.md
---
```

## Body

```markdown
# <Task in plain words>

## Goal
One sentence: what is true when this is done.

## Context
What exists today, with file:line links. What the specs say.

## Non-goals
What this plan deliberately does not change.

## Phases
Each phase: at most 5 files, the files listed, and its verification.
Approval between phases.

## Decisions needed
Questions only the owner can answer. Empty when approved.

## Verification
Exact commands and evidence (type check, lint, gates, live screenshots).

## Log
Dated entries: approvals, phase completions, deviations.
```

---

## References

- [MADR](https://adr.github.io/madr/) — numbered decision records: `NNNN-title-with-dashes.md`
- [Rust RFCs](https://github.com/rust-lang/rfcs) — `NNNN-feature-name.md`, status in the document
- [Kubernetes KEPs](https://github.com/kubernetes/enhancements/tree/master/keps) — scoped by owning group, numbered, status in metadata
