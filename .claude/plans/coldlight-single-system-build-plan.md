# ColdLight — THE MAP (what happened, what's duplicated, what to re-land)

**Date:** 2026-07-16 · **Branch:** main · **Status:** MAP — read-only findings, no code changed
**Method:** jscpd copy/paste detector (installed tonight), @projectwallace/css-analyzer, knip, dependency-cruiser, css-var-audit, 3 census agents, git archaeology.
**This document does NOT invent a plan.** The operator's plan already exists and is approved:
`.claude/plans/coldlight-recovery/01-rulings.md` (operator signature, 2026-07-12, Q1–Q22 + 3 LOCKED structural corrections) and `02-slices/INDEX.md` (11 authored slices + F2–F9 families).

---

## 1. WHAT HAPPENED — the recovery was reverted

The operator's ColdLight recovery was authored, executed, merged, and then **reverted**.

```
95537cdf  slice 02 — svg preset accent prefix (cl-svg → svg)
10839b67  slice 03 — retro/stark literals rebound
4fe3d586  slice 04 — emit orphaned z-index + scrollbar-size
03f4a285  slice 05 — accent wrong-name rebinds, batch A
eb8e68f4  slice 07b — TokenDebugOverlay gate-clean
5194b6ba  slice 10 — text-default + pressed-state rebinds
8b57fe50  slice 11 — last keyword fallback retired
   ...
4ca9e6ab  Refactor/coldlight recovery (#27)          ← the work, merged
b5ea3e1d  Revert "Refactor/coldlight recovery (#27)"
d2f5a37c  Revert "Refactor/coldlight recovery (#27)" (#28)   ← 129 files reverted
66c91e3d  feat(coldlight): absorb coldlight-recovery  ← partial restore only
```

`d2f5a37c` reverted **129 files**, including:
- `tokens/src/svg-presets.json` (66 lines — undoing slice 02's source fix)
- `.claude/plans/coldlight-recovery/00-census.md` (1,346 lines, deleted)
- `.claude/plans/coldlight-recovery/01-rulings.md` (412 lines, deleted)
- `02-slices/INDEX.md` (58 lines, deleted)

`66c91e3d` restored the **planning artifacts** (they are on disk today) but **not the code fixes**.

### 1.1 Proof, per slice — measured today vs at the merge

| Slice | Signal | At `4ca9e6ab` (#27) | HEAD today | Verdict |
|---|---|---|---|---|
| **02** | `cl-svg` refs in `tokens/src/svg-presets.json` (want 0) | **0** | **33** | **REVERTED** |
| **02** | `cl-svg` refs in `svg/presets/svg-presets.generated.css` | 0 | **33** | **REVERTED** |
| **11** | `var(--surface-inset, transparent)` in `ClyffyHeadshot.svelte` (want 0) | **0** | **1** | **REVERTED** |
| **04** | `--scrollbar-size-*` definers anywhere in `src` | — | **0** | **NEVER LANDED** |
| **04** | `--z-dropdown` definers | — | 1 | partial |

**Consequence of slice 02 being reverted:** `--cl-svg-accent-{main,glow,fill}` has **33 references and 0 definers** today. Per CSS custom-property semantics every `--svg-style-*` preset var referencing it is guaranteed-invalid, so **the entire SVG preset accent tier is inert**. `svg-accent-defaults.css:9-11` defines `--svg-accent-*` — the names nothing references. The two halves of the SVG accent chain do not meet.

### 1.2 The INDEX lies about its own state

`02-slices/INDEX.md` marks slices 02–11 **PENDING**. Git says they were committed. Both are true — the status column is only written by `/coldlight-execute`, and the revert erased the code without ever touching the status. **Anyone reading the INDEX today would redo work that was already done once, and would not learn it had been reverted.**

---

## 2. THE OPERATOR'S RULINGS ALREADY EXIST — do not re-ask

`01-rulings.md` §5 carries the operator's signature (2026-07-12). Six locked rules + Q1–Q22 + three structural corrections. Restated here **only** so no future session re-asks:

**Locked rules:**
1. ALL runtime CSS under `styles/` (SD5-emitted layers; rebind in token sources).
2. Base component in its own NAMED folder under the components directory, typed.
3. Variants colocated in that component's folder, typed.
4. **NO bucket directories anywhere** — `_shared`, `common`, `shared`, `_internal`, `utils`-as-bucket, `helpers`, `misc`. Bucket→bucket is FAILURE.
5. `domains/common` is banned and is itself dismantled.
6. Tokens bind through the role vocabulary — **no raw literals, no keyword fallbacks**.

**Structural corrections (LOCKED, override any option text):**
1. `design/blocks` = LIBRARY/CORE components + variants ONLY, all pulling from `styles/`. No devtool templates in blocks.
2. Devtools live in `devtools/{tier}/{bucket}/{id}` with components COLOCATED. Shared devtool TEMPLATES centralize devtools-side, never in the design library.
3. Devtool actions emit structured signals on `devtools.{id}` scoped targets; logs surface consumes emitted tracing events, 1:1.

Answered already, among others: **Q18** Glass\* demo components → retire/rewrite on existing tokens. **Q17** unify on 6-state `HealthState`, degraded = AMBER, StatusDot absorbs HealthSignal. **Q15** bytes SSOT at `models/util/format.ts`. **Q7/Q10** devtool shell + datastore quartet stay devtools-side, NOT blocks.

---

## 3. THE DUPLICATE MAP (jscpd — installed tonight, this is what was missing)

`npx jscpd src --min-lines 5 --min-tokens 50` → **414 clones, 9,827 duplicated lines (4.66%)**.

| Format | Files | Clones | Duplicated lines |
|---|---:|---:|---:|
| html (svelte markup) | 331 | 140 | **5,708 (11.09%)** |
| typescript | 1017 | 195 | 3,173 (3.31%) |
| css | 150 | 79 | 946 (3.56%) |
| **Total** | **1832** | **414** | **9,827 (4.66%)** |

| Location | clone pairs | duplicated lines |
|---|---:|---:|
| Both sides **outside** `design/` | 64 pairs / 170 clones | 3,755 |
| **Cross-boundary** (app duplicating design) | 8 clones | 76 |
| Both sides **inside** `design/` | 236 clones | **6,410** |

**The design system is more duplicated than the app.**

### 3.1 Duplicates OUTSIDE design/ — the top of the list

| lines | n | pair |
|---:|---:|---|
| 316 | 3 | `devtools/runtimes/orchestrator/slots/ui/SaveSlotCard.svelte` ↔ `domains/app/models/feature/setup-wizard/ui/SaveSlotCard.svelte` |
| 314 | 1 | `…/slots/ui/AnatomyTile.svelte` ↔ `…/setup-wizard/ui/AnatomyTile.svelte` |
| 233 | 9 | `runtimes/inference/candle/feature/CandleDevtool.svelte` ↔ `runtimes/inference/llama-cpp/feature/LlamaCppDevtool.svelte` |
| 230 | 11 | AnatomyTile **css** (same pair as above) |
| 181 | 2 | `clyffy/reasoning/rro/feature/RroDevtool.svelte` ↔ `runtimes/inference/llama-cpp/feature/EngineFoundationCard.svelte` |
| 146 | 8 | `system/datastores/duckdb/feature/DuckdbDevtool.svelte` ↔ `…/libsql/feature/LibsqlDevtool.svelte` |
| 132 | 1 | SaveSlotCard **css** |
| 120 | 2 | AnatomyConstellation **html** |
| 113 | 7 | Candle ↔ LlamaCpp **typescript** |
| 91 | 5 | `slots/feature/SlotsDevtool.svelte` ↔ `routes/(app)/devpulse/models/+page.svelte` |
| 86 | 1 | `layouts/app/Sidebar.svelte` ↔ `layouts/app/StatusBar.svelte` |
| 79 | 2 | `TtsDevtool` ↔ `LlamaCppDevtool` |
| 71 | 4 | `SlotsDevtool` ↔ `models/+page.svelte` **typescript** |
| 59 | 5 | `ears/sts/feature/StsDevtool.svelte` ↔ `ears/stt/feature/SttDevtool.svelte` |
| 52 | 3 | `domains/infra/duckdb/data-access/duckdb.state.svelte.ts` ↔ `…/libsql/…/libsql.state.svelte.ts` |

Full list: 64 pairs (see `jscpd` JSON report).

**Structural reading:** the devtool tier is copy-pasted from itself. Candle↔LlamaCpp, Duckdb↔Libsql, Sts↔Stt, Tts↔LlamaCpp, Rro↔EngineFoundationCard. That is what operator ruling **Q7/Q10** already addresses — shared devtool TEMPLATES centralized devtools-side (`devtools/shell/`, `devtools/system/datastores/store-hero/`), never in the design library. **The rulings already name the fix; it is family F4 in the INDEX, blocked behind CHECKPOINT V1.**

### 3.2 Cross-boundary — `app.css` duplicates a design component

6 clones between `app.css` [39-154] and `design/components/dynamic-background/DynamicBackground.svelte:css`. The route-backdrop gradient chains are authored in both places. **Locked rule 1** (all runtime CSS under `styles/`) already rules this: neither copy is correct — it belongs in the token pipeline.

---

## 4. WHAT THE EMITTED CSS ACTUALLY CONTAINS (css-analyzer)

Concatenated all SD5 output (`styles/primitives`, `styles/semantic`, `components.generated.css`, `theme/`, `generated/`, `svg/`) = 4,470 LOC, 4,169 declarations.

| Signal | Value |
|---|---|
| color values total | 1,983 |
| **UNIQUE colors** | **948** |
| formats | oklch 1943 · transparent 23 · hex6 8 · named 3 · currentcolor 6 |
| **distinct hue buckets** | **33** |
| teal+blue band (160–250) | **43.5%** of unique hued colors |
| top hues | 220 (75) · 160 (65) · 200 (49) · 30 (46) · 20 (46) · 240 (44) · 170 (36) · 330 (29) · 290 (25) · 280 (25) |

**This kills the "monochrome teal generation" theory.** The pipeline emits **33 distinct hue buckets** including ember/gold (h20–30), purple/magenta (h270–340), and green (h100–150). The 16-accent palette IS emitted correctly. The teal wash is a **consumption** defect, not an emission defect — consistent with operator ruling 6 (bind through the role vocabulary) and the wrong-name rebind slices 05–10.

**Separately: 948 unique colors is itself the sprawl.** A 16-accent × {main,glow,fill} × states system needs on the order of 150. 948 unique values is ~6× that.

---

## 5. THE HONEST STATE OF THE VAR CHAIN (today vs 07-11 baseline)

| Signal | 07-11 | 07-16 | |
|---|---|---|---|
| defined | 3319 | **3351** | worse |
| CONTESTED (2+ definers) | 745 | **765** | worse |
| UNDEFINED | 95 | **73** | better |
| DEAD (never consumed) | — | **2945 (88%)** | — |
| unused files (knip) | 586 | **544** | better |
| unused exports | 416 | **435** | worse |
| unused exported types | 766 | **783** | worse |
| circular imports | 3 | **3** | flat |

Five of eight flat or worse — **because the work that moved them was reverted (§1)**, not because the plan was wrong.

---

## 6. WHAT TO DO — re-land, do not re-plan

The plan exists. The rulings are signed. The slices are authored. **Nothing below is new work; it is restoring work that was done and reverted.**

1. **Fix the INDEX first.** `02-slices/INDEX.md` says PENDING for slices proven committed-then-reverted. Mark them **REVERTED-NEEDS-RELAND** with the reverting SHA (`d2f5a37c`). Until this is true, every future session redoes the same slices blind. *(1 file, docs only.)*
2. **Re-land slice 02.** `tokens/src/svg-presets.json`: 33 `cl-svg` → `svg`, regen. This is a **known-good diff that already existed at `4ca9e6ab`** — recoverable with `git show 95537cdf`. Unblocks the entire SVG preset accent tier.
3. **Re-land slice 11.** `ClyffyHeadshot.svelte` — 1 keyword fallback (rule 6).
4. **Verify slices 03/05/07b/10** the same way §1.1 does: compare HEAD against `4ca9e6ab` per signal. Re-land whatever the revert took.
5. **Land slice 04** — `--scrollbar-size-*` has **0 definers** today; the emission gap is real and independent of the revert.
6. **CHECKPOINT V1** — `/coldlight-verify` with operator's own eyes on `cargo xtask run-dev`, per the INDEX.
7. **Then F2–F9** as authored. F4 (devtools-structure, Q7–Q13) is what collapses the 3,755 duplicated lines in §3.1.

### The one gap the existing plan does not cover

Nothing in the repo prevents a revert from silently un-landing a slice. §1.1's per-signal comparison (`git show <merge>:<file>` vs HEAD) is a **regression probe that should be a committed check** — the `audit-baseline.json` ratchet idea, but anchored to the recovery's known-good SHA. Without it, "PENDING" and "reverted" remain indistinguishable, which is exactly how four days were spent re-deriving a cause that was already fixed once.

---

## 7. Evidence index

| Claim | Source |
|---|---|
| Recovery reverted, 129 files | `git show --stat d2f5a37c` |
| Slice 02 fix existed at #27 | `git show 4ca9e6ab:…/svg-presets.json \| grep -c cl-svg` → **0** |
| Slice 02 broken today | `grep -c cl-svg …/svg-presets.json` → **33** |
| Slice 11 broken today | `grep -c "surface-inset, transparent" ClyffyHeadshot.svelte` → **1** |
| scrollbar-size never landed | `grep -rl "scrollbar-size-width:" src` → **0** |
| 414 clones / 9,827 dup lines | `jscpd src --min-lines 5 --min-tokens 50` |
| 948 unique colors, 33 hue buckets | `@projectwallace/css-analyzer` over concatenated SD5 output |
| Operator rulings signed 2026-07-12 | `01-rulings.md` §5 |
| INDEX says PENDING | `02-slices/INDEX.md:29-38` |

**Corrections made to my own earlier claims tonight, recorded so they are not repeated:**
- I claimed the component tier's 620 teal literals were "winning the cascade." They are largely **inert** — `data-cl-*` comes only from `renderForge()`, so the tier is dead for kinds whose root never calls it.
- I claimed generation was monochrome-teal. **False** — 33 hue buckets emit correctly (§4).
- I asked the operator to re-rule Tailwind, blocks, SVG, and the Anatomy duplicates. **All four were already ruled** on 2026-07-12 (§2).
- I wrote a ~76-slice "build plan" reinventing work the operator had already authored as slices 01–11 + F2–F9. This document replaces it.
