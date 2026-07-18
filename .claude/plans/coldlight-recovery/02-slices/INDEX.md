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
| 02 | slice-02-svg-accent-prefix.md — fix `--cl-svg-accent-*` → `--svg-accent-*` in svg-presets SOURCE + regen (SVG presets currently resolve to NOTHING) | 1+regen | DONE (re-landed 2026-07-17; orig 95537cdf merged #27, reverted by #28, never re-applied — 33 refs/0 definers → 0/20; UNDEFINED 73→70; pnpm check 0/0) |
| 03 | slice-03-retro-stark-literals.md — 12 raw oklch literals → token refs in retro/stark preset sources + regen | 2+regen | PENDING |
| 04 | slice-04-emission-gaps.md — sd.config.mjs: `z-index` kebab filter (line 1012) + `scrollbar-size` in scrollbar filters (1031/1110/1139) + regen → z-scale + scrollbar sizes finally emit | 1+regen | PENDING |
| 05 | slice-05-rebind-accents-a.md — WRONG-NAME batch A (KnowledgeCard, IntelligenceMemoryStream, Sidebar, SuggestionDropdown, SurrealdbDevtool) | 5 | PENDING |
| 06 | slice-06-rebind-accents-b.md — batch B (BootOverlay, ProjectReferences, Frame, ProjectSwitcher, LoadingContentCard) | 5 | PENDING |
| 07 | slice-07-rebind-fonts-c.md — batch C (TokenDebugOverlay, ProjectDbDevtool, 3× Downloader panels) | 5 | PENDING |
| 08 | slice-08-rebind-fonts-shadows-d.md — batch D (BundleFileRow, ErrorOverlay, Panel.stories, CandleDevtool, runtimes/+page) | 5 | PENDING |
| 09 | slice-09-rebind-surfaces-e.md — batch E (StreamingAsrDevtool, IntelligenceDevtool, SlotsDevtool, ClyffyStatusOrb, RrdDevtool) | 5 | PENDING |
| 10 | slice-10-rebind-text-f.md — batch F (KnowledgeMultipleChoiceCard, ClyffyCollabView, EndpointView, ModelEventCard) | 4 | PENDING |
| 11 | slice-11-keyword-fallback.md — ClyffyHeadshot `var(--surface-inset, transparent)` → `var(--surface-inset)` (rule 6) | 1 | DONE (re-landed 2026-07-17; design tiers 0 keyword-fallbacks; pnpm check 0/0) |
| ✔ | **CHECKPOINT V1 — /coldlight-verify: gates + operator run-dev eyes** (SVG accents alive, no wrong-name grays, scrollbars sized, blue CTAs from P2.4) | — | PENDING |

## Family F1b — THEME NAMESPACE GUARD (landed 2026-07-17, new — from lane-alignment map)

| # | Slice | Files | Status |
| --- | --- | --- | --- |
| T1 | F9 namespace guard — `coldlight/tailwind-theme` emits a token ONLY if `toTw4VarName` lands on a real Tailwind v4 namespace; non-namespace domains (accent, role, surface, gradient, transition, elevation, border, backdrop, signal, interaction, overlay, scrollbar, shadow-as-depth, motion-as-duration) live ONLY in `styles/` (layered). Barrel pruned to 9 namespace files; 14 stale orphan theme files deleted. | sd.config.mjs + build.mjs + TOKEN_PIPELINE.md (+regen, −14 gen) | DONE (**CONTESTED 765→362**; UNDEFINED 70→70 no regression; theme/ 23→9 files; pnpm check 0/0) |
| T1v | ZERO-LOSS PROOF for T1 — parser+culori comparison of all 14 deleted theme files vs `styles/`: 400 props, 398 exact + 2 equivalent-via-reference (`--color-brand-blue-500` resolves to the identical baked `oklch(0.55 0.14 240)`, superior rebindable form), **0 lost / 0 changed**. | tooling only (`scratchpad/tools/compare-all-deleted.mjs`) | DONE (operator-requested audit; no visual spec lost) |
| T2 | Barrel DERIVE — `build.mjs` now derives styles/theme/types barrels from EMITTED files (never hand-listed) + auto-prunes F9-skipped empty theme files. Fixes `claude.css` dead-emit (emitted but never imported — now wired at `styles/index.css:25`); removes the T1 "keep-in-sync" drift point. Same bug class the config warned about (chat/wizard, F8). | build.mjs + TOKEN_PIPELINE.md (+regen barrels) | DONE (claude.css wired; all barrels resolve; CONTESTED 362 & UNDEFINED 70 unchanged; types 17=17; pnpm check 0/0) |
| T3 | @defaults RE-SEED — the component seed layer (`@defaults` doc-comments) now REFERENCES semantic roles instead of baking literals. 236 color values across 84 components: `background-color`→`var(--surface-base)`, `color`→`var(--text-primary)`, `border-color`→`var(--border-subtle)` (operator-confirmed targets, 2026-07-17). Surgical in-place edit (values only, formatting preserved). box-shadow DEFERRED (depth-system decision — design depth tokens are teal-tinted, needs own pass). **This is the SSOT/scale fix**: a palette change now edits 1 role, not 293 components. | 84 components + scratchpad transform (+regen) | DONE (bg teal literals 72→0; refs `--surface-base`×79 / `--text-primary`×99 / `--border-subtle`×75; UNDEFINED 70 & CONTESTED 362 unchanged; pnpm check 0/0). Zero-loss N/A — this is an INTENTIONAL operator-approved shift off-teal toward roles. |
| — | OPEN after T3 | — | box-shadow @defaults (70, deferred); CONSUMER raw-hue sweep (DevPulseDashboard/ChatFrame etc. still reach `var(--accent-teal-*)` directly — slices 05–10); LAYOUT/fluid track (vw→cqi, static shell chrome) — SEPARATE from color |

> Root cause of the 644 cascade collisions: `theme/` re-emitted every token's VALUE
> **unlayered**, under the same name as the layered `styles/` copy, for domains that
> aren't Tailwind namespaces (so they minted zero utilities — pure liability).
> `bevel`→`--inset-shadow-*` was the one correct pattern already in the repo; the guard
> generalizes it. The remaining 362 CONTESTED are BENIGN same-value dups on real
> namespaces (`--color-*`, `--radius-*`, etc.) that Tailwind v4 requires for utilities.
> VISUAL CHECKPOINT still owed at V1 (utilities are Tailwind built-ins / layered styles;
> statically verified, operator's eyes pending).

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
