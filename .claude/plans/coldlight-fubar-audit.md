# ColdLight FUBAR Audit — Root Cause + Recovery Plan

**Date:** 2026-07-11 · **Branch:** refactor/kernel-severance · **Status:** AUDIT COMPLETE, plan pending owner approval
**Method:** 4 parallel deep-audit agents (pipeline / consumption / layout / structure) + installed tooling (knip, dependency-cruiser, custom css-var chain auditor) + baseline battery (svelte-check, token-build staleness, dep-graph validation).

---

## 1. The verdict — why the UI is FUBAR

**The design system's spine is healthy. The app never binds to it, and the cascade is won by accident, not architecture.**

Generation works: the SD5 pipeline runs clean (rebuild produces zero diff against the committed tree), all 16 accent triplets and hue ramps are emitted correctly, the renderForge resolver is sound, container seams are wired correctly where used, svelte-check is 0/0. None of that is what renders.

What renders is decided by five competing color authorities, and the wrong ones win:

| # | Authority | Where | Layered? | Content |
| --- | --- | --- | --- | --- |
| 1 | Primitives + semantic tokens (16-accent palette, roles) | `styles/{primitives,semantic}/*.css` | ✅ `tokens.*` | CORRECT — and loses the cascade |
| 2 | Component tier: `--style-*` (479) + `--preset-*` (1326) | `styles/components/components.generated.css` | ❌ UNLAYERED | 360 raw teal-band `oklch()` literals, **0 palette refs** |
| 3 | Tailwind `@theme` re-emissions | `theme/*.css` | ❌ unlayered `:root` | FLATTENED literals duplicating tier 1 — kills rebindability |
| 4 | Hand shims: role vocabulary + button-primary retarget | `app.css:21-80` | ❌ unlayered, imported last | Fights tier 2, covers 7 of ~1300 preset axes |
| 5 | SVG accent defaults | `svg/svg-accent-defaults.css` | ❌ unlayered `:root` | Pins `--svg-accent-* = teal` globally |

Unlayered CSS **always beats** `@layer`ed CSS at equal specificity. So the correctly-generated, rebindable palette (tier 1) is structurally incapable of winning against tiers 2/3/5. The app.css shims (tier 4) only "work" because they're unlayered too and imported last — cascade order by import accident.

### Why monochrome teal, mechanically

1. The two tiers components actually bind to (`--style-*`, `--preset-*`) are hand-authored literal teal: hue histogram of `components.generated.css` is dominated by 224/220/180/173 (teal↔cyan↔navy band). Source: `tokens/src/presets/*.tokens.json` (360 literals, 0 refs — "HAND-MAINTAINED, no generator writes it") and the `@defaults` doc-comment seeds in ~89 components, all teal-hued.
2. The default preset chain is teal-grey even without accents: `primary → glass-deep` → `oklch(0.12 0.025 220 / 0.6)`; neutral tokens are teal-tinted (`--border-soft` hue 163, `--color-void-base` hue 220).
3. `svg-accent-defaults.css` defaults every SVG widget to `--accent-teal-main` at `:root`.
4. 154 component sites reach directly for `var(--accent-teal-*)` (and friends) instead of role vars; role consumption is ~22 sites total.
5. Every hardcoded fallback literal in the codebase (`var(--x, oklch(… 173/180/224 …))`) is teal-hued — whatever fails, fails to teal.

### The vocabulary schism (roles)

Four role vocabularies coexist; none is canonical:
- `--primary-main` (generated, `styles/semantic/role.css`) — 6 consumers
- `--accent-main` (generated, `styles/semantic/accent.css`) — 3 consumers
- `--accent-primary-*` (hand shim, `app.css:21-44`) — 13 consumers
- `--accent-{positive,section,service,tile}-*` — consumed in ~10 files, **defined NOWHERE** (silent render failures)

No aliasing between them. Rebinding one leaves the others stale.

### The numbers (installed-tool baseline, 2026-07-11)

| Signal | Value |
| --- | --- |
| Custom properties defined / consumed | **3319 / 434** (~90% dead weight) |
| Consumed but NEVER defined (silent failures) | **95** |
| Defined in 2+ files (cascade fights) | **745** |
| Unused files (knip) | **586** (concentrated: `design/components/*` shell catalog, `design/config/`, `presets/`, `visual/presets/`) |
| Unused exports / exported types | 416 / 766 |
| Unused deps / devDeps (knip; has false positives — tauri CLI, commitlint, postcss chain) | 17 / 22 |
| Circular imports (dependency-cruiser, error-level) | **3** (profile, auth, models/downloader — all component→domain-barrel→component) |
| Orphan modules (warn) | 35 |
| svelte-check | 0 errors / 0 warnings (220 files) |
| Token build staleness | none — committed output current |
| renderForge adoption: design library / app surface | 89/191 (47%) / **9/242 (~4%)** |
| Runtime hardcoded colors (app surface) | 152 across 40 files |
| Legacy `var(--color-*)` raw-ramp reaches | 72 across 21 files (`--dp-*` fully dead) |

### Layout ("chat-tiny" + "stalled clamping") — root causes CORRECTED

Both standing failures have different mechanisms than assumed:

- **Chat-tiny is not CSS.** Rust sizing is correct (`size_fraction 0.45×0.8`, min 640×520, computed against the main monitor). The culprit: `lib.rs:687` registers `tauri_plugin_window_state` with default `StateFlags::all()` and **no per-window filter** — stale persisted geometry (e.g. pre-fix) is restored over the proportional size on every launch, guarded only by the 640×520 floor. The CSS fill-chain (`.chat-frame` 100vh grid → 1fr → flex) is intact.
- **"Stalled clamping" is not missing containers.** cqi ancestry is intact everywhere it's used, and cqi without a container falls back to **viewport units, not 0** (documented at `sd.config.mjs:358-360`) — the `cqi→0→floor` mental model is contradicted by the project's own emit code. The real mechanisms: (1) ~70% of fluid sizing rides `vw` (93 hits/28 files) vs cqi (34/11), so shell-zone resizes produce no response; (2) emitted clamp slopes are micro (`--padding-md-x`: ~6px total travel).
- **Shell chrome is 0% fluid** — all zone chrome is static rem (`layout.css:7-11`, `chat.css:16-19`); only the `1fr` content track adapts.
- **Per-copy drift:** `AnatomyTile`/`SaveSlotCard`/`AnatomyConstellation` exist twice; the setup-wizard copies were migrated to cqi, the devtools copies still ride vw.
- The devtools window declares a `devtools` container seam that **nothing consumes** — every devtools component sizes with vw.

### Structural sediment

- **Built-but-unwired subsystems** (real code, zero importers): `attachments/` (23 files), `presets/` (the "public preset façade" per TRUTH.md — nobody imports it; real presets live in `visual/presets/`), `patterns/`, `provider/` (`ColdLightProvider` never mounted), the entire `config/` + `coldlight.config.ts` chain (self-declared "SSOT for ALL build tools" — **no build tool reads it**), `surface.config.ts`.
- **Fictional packaging:** `design/package.json` exports `./style-macro` and `./primitives/*` — folders that don't exist.
- **Spec-vs-reality:** of ~24 root specs, only `TRUTH.md` (+ `RenderForge.md`) approximately match the tree. `MASTER-PLAN.md` describes the pre-ADR-001 4-layer world (recipes/useColdLight/Zod) that ADR-001 explicitly killed. `ADR-001` itself diverges from implementation (folder `primitives/` vs real `behaviors/{group}/{kind}/`; `<RenderForge>` component vs real `renderForge()` fn; `intent` prop vs real `preset`; axis count 11 vs 20 vs real ~36). `design/CLAUDE.md` contradicts `design/.claude/CLAUDE.md`; the latter contradicts itself (bans `primitives/` then imports from it in its own sample). `TOKEN_PIPELINE.md` documents a pipeline that no longer exists.
- **Banned-name residue in live code:** the `StyleMacro` type still exists across ~20 files despite the "renamed to renderForge" claim.
- `.cowlevel/` = 1,194 generated TypeDoc files (7.3MB api.json) inside the source tree.

---

## 2. Tooling installed (permanent)

| Command | Tool | Purpose |
| --- | --- | --- |
| `pnpm audit:cssvars` | `scripts/audit/css-var-audit.mjs` (custom) | defined vs consumed vs contested custom-property chains — the silent-render-failure detector |
| `pnpm audit:color` | `scripts/audit/color-audit.mjs` (custom, culori) | sRGB gamut sweep, WCAG contrast on resolved var-chains, DTCG hex-fallback drift |
| `pnpm audit:deps` | dependency-cruiser + `.dependency-cruiser.cjs` | circular / orphan / design-is-a-leaf rules |
| `pnpm audit:deps:graph` | dependency-cruiser | mermaid graph of `$lib/design` |
| `pnpm audit:unused` | knip + `knip.json` | unused files / exports / deps (SvelteKit-aware) |

These four are the regression harness for the recovery: every phase below must leave `audit:cssvars` UNDEFINED-count and `audit:deps` error-count monotonically decreasing.

---

## 3. Recovery plan (phased, ≤5 files/phase per CC-002, spec-first, no auto-fix)

> Ordering rationale: fix **emission layering first** — rewriting teal sources while the component tier is unlayered changes nothing (unlayered literals still outrank the palette). Cascade → sources → consumers → layout → sediment.

### Phase 0 — Spec truth (docs only, before any code per spec-first)
Declare the canon: `TRUTH.md` + `RenderForge.md` + corrected `.claude/CLAUDE.md`. Fix `design/CLAUDE.md` (behaviors not primitives, real axis count, renderForge-fn). Mark `MASTER-PLAN.md` and stale sections of `ADR-001` as superseded (ABSORB unique content first, never bare delete). Update `TOKEN_PIPELINE.md` to the real `.mjs` pipeline.

### Phase 1 — Win the cascade (the "properly loading" fix)
1. Emit `components.generated.css` **inside `@layer tokens.components`** (sd.config format or build.mjs barrel `@import … layer(tokens.components)`).
2. Stop `@theme` from re-emitting flattened duplicates of reference vars (emit registrations only, or `@theme inline` refs — verify Tailwind 4 semantics online first per Rust-weakness rule analog: verify before authoring).
3. Promote the app.css role vocabulary (S2 shim) into SD5 source under `tokens/src/semantic/` → emitted in `tokens.semantic`; delete the shim.
4. **DECISION NEEDED (owner):** canonical role vocabulary name. Recommendation: `--accent-{role}-{main,glow,fill}` (matches app.css shim + the 13 existing consumers + the wizard quartet convention); alias `--primary-*`/`--accent-main` to it during migration, then retire.
Verify: `audit:cssvars` contested count drops; visual spot-check that accents bind.

### Phase 2 — Re-source the component tiers (kill the 360 teal literals)
Rewrite `tokens/src/presets/*.tokens.json` color axes as `{accent.*}`/`{color.*}` DTCG references (emit with `outputReferences: true` for the components platform). Re-seed the `@defaults` doc-comment blocks to reference role vars. Retarget `svg-accent-defaults.css` to `--accent-primary-*`. Delete the app.css button-primary preset shim (S1). Batched ≤5 files; presets are 9 files → 2 slices.

### Phase 3 — Consumption sweep (app surface)
Replace, in batches of ≤5 files: 154 direct palette reaches → role vars; 95 undefined-var consumptions (define the missing `--accent-{section,service,tile,positive}-*` as REAL role tokens in SD5 source if the vocabulary is wanted, else rebind consumers); 72 legacy `--color-*` reaches → semantic tokens; 152 runtime hardcoded colors (excluding the generative backgrounds + debug overlay, which are legitimately raw). Fix the 3 circular barrel imports while touching those domains.

### Phase 4 — Layout truth
1. Chat-tiny: filter `chat` out of `tauri_plugin_window_state` (per-window `StateFlags` / skip list) or validate restored geometry against the proportional minimum on show.
2. Finish the vw→cqi migration: devtools subtree (the declared-but-unused `devtools` seam), knowledge blocks, wizard views — and unify the duplicated AnatomyTile/SaveSlotCard/Constellation copies at the source (extend-over-rewrite).
3. Re-slope the micro-clamps if fluidity should be visible (owner call on travel range).
4. **DECISION NEEDED (owner):** should shell chrome (topbar/sidebar/statusbar heights) stay static rem (predictable cockpit) or scale with a seam? Recommendation: keep static; the directive's value is in the content zones.

### Phase 5 — Sediment excision (ABSORB before DELETE; deferred ≠ retired)
- NOT deletion candidates without owner call: the 586-file unused-component catalog overlaps the deliberate "73 components restored as blank shells" Sprint-02 plan — reconcile against that sprint first.
- Deletion/absorption candidates: `attachments/`, `presets/` (fold façade intent into `visual/presets`), `patterns/` stubs, `provider/` (or mount it — it's the only place the ColdLight context would live), `config/` + `coldlight.config.ts` + `surface.config.ts` (either wire as actual SSOT or remove the fiction), fictional `design/package.json` exports, `.cowlevel/` → move out of `src/` or gitignore.
- Finish the `StyleMacro → renderForge` rename across the ~20 residue files (CC-007 multi-search).
- Prune unused deps knip flagged (hand-verified each — several false positives).

---

## 4. Open decisions for the owner

1. **Canonical role vocabulary** (Phase 1.4) — recommend `--accent-{role}-*`.
2. **Shell chrome: static vs fluid** (Phase 4.4) — recommend static.
3. **586 unused files vs Sprint-02 shell-restoration plan** — reconcile before any deletion.
4. **`coldlight.config.ts`:** wire it for real or delete the "SSOT" claim (currently pure fiction — highest-risk doc for a future session to trust).

## 5. Full evidence

Agent transcripts + `css-var-audit.json` in session scratchpad; re-runnable anytime via the four `audit:*` scripts.

---

# ADDENDUM — Resumed audit 2026-07-11: OKLCH · W3C · RAC · Fluid XY

Four further deep-audit agents + a new color-science tool (`pnpm audit:color` —
culori-backed gamut / WCAG-contrast / hex-drift checks, `scripts/audit/color-audit.mjs`).
Phase 1 (cascade fix) had already landed when this ran; the W3C agent **verified it
safe** (tokens.* outranking Tailwind utilities is harmless — those layers hold only
custom-property definitions).

## The meta-pattern

**ColdLight's recurring failure is not bad engineering — it is unwired engineering.**
Every dimension found quality infrastructure with no consumers:

- Fluid tokens: correct pipeline, **~1% adoption** (22 cqi tokens, 3 consumer files; devtools = 568 static `p-N` hits, 0 fluid).
- Focus primitives: **two** complete orphaned implementations (`attachments/` AND `_shared/{focus-trap,roving-focus,active-descendant,typeahead}` — 0 importers) while every composite widget hand-rolls its own, buggy.
- A11y gates: storybook a11y set to `"todo"`, `schema/enforce.ts` never invoked, `aria-query` never imported, `ColdLightProvider` never mounted.
- (Prior audit: 16-accent palette generated and unconsumed; `coldlight.config.ts` "SSOT" read by nothing.)

## A. OKLCH discipline

- **Authoring is clean**: 0 hex/rgb/hsl in DTCG sources, hand CSS, or Svelte styles; all 190 `color-mix()` calls mix `in oklch`.
- **BLOCKER — flat-chroma ramps**: `generate-scales.mjs` holds chroma constant across all 11 stops per hue → **406 emitted oklch() outside sRGB** (audit:color). electric/hotpink C=0.22 unrealizable at the extremes; the generator wrote `hex:#f5f5f5` (grey) for `brand-electric-50` (vivid blue). Fix: per-stop chroma envelope (peak ~L0.55–0.65, taper at ends) or gamut-map each stop.
- **MAJOR — shadow transform leaks hex** (~56 values): `col()` in `sd.config.mjs:409-425` checks `c.hex` BEFORE oklch. Flip the order (mirror `gradientStopColor`).
- **MAJOR — hex fallback is dead for ~95% of colors, LIVE for shadows/borders, and unreliable at gamut edges** — decide: drop it, or regenerate gamut-mapped.
- Chroma varies 3.7× across hues at the same stop (frost 0.06 vs hotpink 0.22) — perceptual weight inconsistency. L ladder itself is perfectly coherent.
- **Three competing cool-neutral tints**: void hue 220, borders hue 163 (both intentional, undocumented as policy), ad-hoc 224/270 in ErrorOverlay/DynamicBackground/BootOverlay. `void` sits in `achromatic/` contradicting `DTCG-REFERENCE.md:642`.
- 366 raw `oklch()` fallback literals across 80 .svelte files (BackgroundScene 32, TokenDebugOverlay 30, ErrorOverlay 19).

## B. W3C conformance

- **DTCG 2025.10: conformant** — color shape incl. `hex` is spec-legal; composites, $type placement, refs all clean. ONE defect: `$extensions` vendor-root split (`com.coldlight` ×11 vs `com.devpulse.coldlight` ×139; `semantic/border/color.tokens.json` uses BOTH). Unify on `com.devpulse.coldlight`.
- **REAL layer hazard (MAJOR)**: `generated/render-base.css` (+ `diagonal-blends.css`, `scrollbars.css`) set REAL properties on `[data-kind]` UNLAYERED → they beat Tailwind utilities; utility overrides on RenderForge components silently lose. Wrap in a layer ordered below `utilities`.
- `@property`: zero registrations; currently harmless (nothing animates a custom property directly) but required before chrome-flow's planned hue animation.
- **WCAG (exact numbers, audit:color)**: `--text-muted` on void = **3.49:1 FAIL** AA body (2.3:1 on chrome surface); role fg on solid mains: primary 4.14 / danger 3.78 / **success 2.61** FAIL — only warning (text.inverse) passes at 9.15. Fix: signal roles adopt `{text.inverse}` fg or "main is indicator-only, text sits on fill" rule; raise text-muted to ~L0.62.
- `focus-glow` sets `outline:none` (invisible in forced-colors mode) — add transparent outline fallback.

## C. RAC / behaviors layer

- **The governing doc names the wrong north star**: architecture is Zag/Ark/Radix-shaped (anatomy parts, `onValueChange`, attach actions), NOT React Spectrum S2 / RAC (`buttonProps`, `onPress`). Internally consistent — fix the CLAUDE.md claim, don't refactor to RAC.
- **Cat-1 DEFECT**: `DialogContent.svelte` renders `<dialog open>` AND `attachContent` calls `showModal()` → spec `InvalidStateError` → the only native focus trap likely broken. One-line fix + browser test.
- Sheet = fake modal (`aria-modal` with no trap/no focus-in); popover = unnamed dialog with no focus management; **toolbar has no initial tab stop** (all `tabindex=-1` at rest — keyboard-unreachable).
- **No live region for chat streaming** — for a chat product, the highest aggregate a11y harm. `_shared/live-region.announce()` exists; only `display/progress` imports it.
- Coverage: 82 hooks → 51 real (>50 LOC) / 31 thin / 4 anatomy-only. `pagination` = 3 LOC.
- Consumption is faithful (prop bags spread) but: Button/Checkbox style with Tailwind `disabled:` variants that NEVER fire (hooks emit `aria-disabled`/`data-disabled`, no native `disabled`); Popover hardcodes static `data-state="open"` over the hook's reactive one.

## D. Fluid XY

- **Stall cause #1 = adoption (~1%)**, then range mis-tuning: every fluid token uses minViewport 20rem/maxViewport 90rem — tuned as VIEWPORT widths, silently reinterpreted as CONTAINER widths under `basis:"container"`. Sidebar/context/statusbar zones (< 320px) sit below every floor → pinned static. Travel on workhorse tokens is 2–8px — sub-perceptual even where it works.
- **The Y axis never shipped and was closed off deliberately** (S1.C adoption contract rule 3: cqb/cqh abandoned; only `container-type: inline-size` declared). "Fluid XY" = fluid X applied to both x/y token slots.
- Typography: fluid on `vw` by decision, but body band (`2xs/xs/sm`) is fully static and `base` travels 2px — reads as static.
- The `tokens-regen` lefthook watches a legacy path — source edits don't force regeneration.
- **Fix package (Phase 4 rewrite)**: retune container ranges to real zone envelopes (≈30rem→75rem for content), widen md+ travel to ≥40%, convert devtools to `Section` (the anointed consumer) so the live-but-unused `devtools` seam drives something, add a deliberate `basis:"container-block"` → cqb track for chat/content zones, extend TokenDebugOverlay to live-read resolved cqi values (visible feedback), fix the regen hook path.

## Revised phase map (supersedes §3 details where they overlap)

- **Phase 2 (re-source presets) gains**: shadow-transform oklch fix; layer the glue CSS (render-base + diagonal-blends + scrollbars); chroma-taper in generate-scales + ramp regen; hex policy decision; $extensions namespace unification.
- **NEW Phase 3.5 — A11y correctness** (can run parallel to Phase 3): DialogContent `open` fix; wire `_shared/focus-trap` into sheet/popover + name popovers; consolidate roving/typeahead on `_shared`; toolbar tab stop; chat live-region; role fg contrast fixes + text-muted raise; flip storybook a11y to error + invoke `schema/enforce.ts` in test:arch or delete it; then delete `attachments/`.
- **Phase 4 (layout) rewritten** per fluid fix package above.

## New owner decisions

5. **Ramp chroma strategy**: taper per-stop (recommended) vs gamut-map at build vs accept browser clamping.
6. **Hex fallback**: drop from generated tokens (recommended after shadow fix) vs regenerate gamut-mapped.
7. **Behaviors north star**: relabel docs to Zag/Ark-style anatomy model (recommended — matches reality) vs refactor toward RAC vocabulary.
8. **`--text-muted`**: raise lightness to ~0.62 (recommended) vs restrict to large text.
