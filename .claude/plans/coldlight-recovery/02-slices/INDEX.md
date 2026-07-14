# ColdLight Recovery — Slice INDEX

> Authored by /coldlight-slices from APPROVED 01-rulings.md (operator signature
> 2026-07-12, Section 5). One slice = one concern, ≤5 content-edited files.
> Executor: Sonnet via /coldlight-execute NN — one slice per invocation, never
> auto-continuing. Status column updated by /coldlight-execute only.
> A slice is DONE at a checkpoint only when /coldlight-verify logs it green.

## Standing constraints (every slice inherits these)

- Tree must be clean before each slice except `.claude/plans/**` artifacts.
- KNOWN REDS (never chase): Sheet.test.ts (5 failures) + Checkbox.test.ts (2)
  pre-broken, baseline-verified; Sonar react-hooks rule on `*.svelte.ts` = false
  positive, never rename hooks.
- No `--fix`/`--write` flags. No commits (operator commits separately). No new
  directories beyond those a slice names. No shims, no re-export stubs at old paths.
- Token regen command: `cd interfaces/desktop && pnpm ds:tokens:build` — generated
  outputs (styles/, theme/, types/, generated/) are expected to change on token
  slices and do not count against the 5-file edit budget.
- Devtool-action rule (operator correction 3): any slice touching devtool actions
  verifies the action emits a structured tracing event on its `devtools.{id}`/
  scoped target.

## Family F1 — RENDER TRUTH (tokens + pipeline; the operator SEES these)

| # | Slice | Files | Status |
| --- | --- | --- | --- |
| 01 | slice-01-delete-domains-common.md — delete dead `domains/common` + fix CLAUDE.md registry path | 2 | DONE |
| 02 | slice-02-svg-accent-prefix.md — fix `--cl-svg-accent-*` → `--svg-accent-*` in svg-presets SOURCE + regen (SVG presets currently resolve to NOTHING) | 1+regen | DONE |
| 03 | slice-03-retro-stark-literals.md — 12 raw oklch literals → token refs in retro/stark preset sources + regen | 2+regen | DONE |
| 04 | slice-04-emission-gaps.md — sd.config.mjs: `z-index` kebab filter (line 1012) + `scrollbar-size` in scrollbar filters (1031/1110/1139) + regen → z-scale + scrollbar sizes finally emit | 1+regen | DONE |
| 05 | slice-05-rebind-accents-a.md — WRONG-NAME batch A (KnowledgeCard, IntelligenceMemoryStream, Sidebar, SuggestionDropdown, SurrealdbDevtool) | 5 | DONE |
| 06 | slice-06-rebind-accents-b.md — batch B (BootOverlay, ProjectReferences, Frame, ProjectSwitcher, LoadingContentCard) | 5 | DONE |
| 07 | slice-07-rebind-fonts-c.md — batch C (TokenDebugOverlay, ProjectDbDevtool, 3× Downloader panels) | 5 | DONE |
| 08 | slice-08-rebind-fonts-shadows-d.md — batch D (BundleFileRow, ErrorOverlay, Panel.stories, CandleDevtool, runtimes/+page) | 5 | DONE |
| 09 | slice-09-rebind-surfaces-e.md — batch E (StreamingAsrDevtool, IntelligenceDevtool, SlotsDevtool, ClyffyStatusOrb, RrdDevtool) | 5 | DONE |
| 10 | slice-10-rebind-text-f.md — batch F (KnowledgeMultipleChoiceCard, ClyffyCollabView, EndpointView, ModelEventCard) | 4 | DONE |
| 11 | slice-11-keyword-fallback.md — ClyffyHeadshot `var(--surface-inset, transparent)` → `var(--surface-inset)` (rule 6) | 1 | DONE |
| ✔ | **CHECKPOINT V1 — /coldlight-verify: gates + operator run-dev eyes** (SVG accents alive, no wrong-name grays, scrollbars sized, blue CTAs from P2.4) | — | PENDING |

## Families F2–F9 — TO-AUTHOR (next /coldlight-slices invocation; rulings rows locked)

| Family | Content (rulings ref) | Depends on |
| --- | --- | --- |
| F2 renderforge-axis | Q19: register interactive/layout axis vars in var-to-family.ts + render.ts | V1 |
| F3 behaviors-structure | Q1 nine primitives → `behaviors/interaction/{name}/` (mv+repoint per primitive; dismiss=6, presence=7 consumers flagged); Q2 kbd split via create→repoint(≤5/slice)→delete; Q3 uid SSOT absorbs idGen (create→repoint ~10 slices→delete); Q4 data-attr → `components/_base/`; delete dead `_shared/index.ts` | V1 |
| F4 devtools-structure | Q7 `devtools/shell/` + accents/types to devtools root; Q8 `devtools/logs/`; Q9 `devtools/dashboard/`; Q10 `devtools/system/datastores/store-hero/`; Q11 ReasoningTopology → `rrd/ui/`; Q12 HF cluster → models/downloader; Q13 voice state → `sys/data-access/voice/`; SubsystemTile relocation flag | V1 |
| F5 sys-facades | Q14: inline bindings/_shared types into 6 facades; drop dead `Result`; delete bucket | F4 |
| F6 ssot-dedups | Q15 bytes SSOT at models/util/format (absorb 8+4, fix mislabeled formatMb); Q17 status unify on 6-state HealthState + degraded=amber + StatusDot absorbs HealthSignal + honors own tokens | F4 |
| F7 overlays-unify | Q22: 9 OVERLAY-DUP sites onto behavior primitives + z-token rebinds (needs slice-04 z-scale + F3 primitives in place) | F3 |
| F8 dead-retirement | Q16+Q18: utils dead exports, Glass* rewrite-or-retire, SwapPrimaryBrainButton, rro formatBytes, ScopedLogPanel after F4/F6 migrations (absorb-verify FIRST per slice) | F4, F6 |
| F9 checkpoints | /coldlight-verify after every family above | — |

## DAG

01→02→03→04→05→06→07→08→09→10→11→V1 (F1 strictly sequential — token slices share
regen outputs; rebind batches are content-independent but ordered to keep one
diff-front). F2..F8 as per Depends column. F1 slices are individually revertible.
