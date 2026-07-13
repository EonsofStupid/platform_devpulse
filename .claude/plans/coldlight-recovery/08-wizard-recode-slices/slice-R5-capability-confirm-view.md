# R5 — CapabilityView replaces CortexView: the confirm step, honest + SSOT

## GOAL

The wizard's second step becomes `CapabilityView` — it presents the CONNECTED
Clyffy's advertised capability as layman sense-tiles (computed from the wire,
honest empty when standalone), copy from the new `[capability]` SSOT table,
tooltips per tile, cortex vocabulary GONE from the wizard seam. There is no
embedded cortex — it is all via ClyffyOS.

## PRECONDITIONS

1. R2 DONE (CapabilityCopy exists in bindings). Tree clean.
2. Importer census (CC-007 — run ALL, record every hit):
   - `grep -rn '"cortex"' interfaces/desktop/src/ --include="*.ts" --include="*.svelte"`
   - `grep -rn "CortexView" interfaces/desktop/src/`
   - `grep -rn "goTo(" interfaces/desktop/src/ | grep -v node_modules`
   Known-expected sites: wizard.state.svelte.ts (union, VIEW_ORDER, default
   `view = $state("cortex")` at ~:83), SetupWizardOverlay.svelte (import,
   dispatch branch, `cortexContinue`), CortexView.svelte itself,
   wizard.types.ts (CortexViewProps). ANY hit outside these four files (boot
   gate, TopBar chip, tests) goes in the repoint table BEFORE editing — if
   one changes behavior beyond a rename, STOP and report it.

## FILES

1. `…/setup-wizard/feature/views/CapabilityView.svelte` — NEW.
2. `…/setup-wizard/feature/views/CortexView.svelte` — DELETED (after absorb
   check, step 5).
3. `…/setup-wizard/wizard.state.svelte.ts` — view id + default + doc.
4. `…/setup-wizard/util/wizard.types.ts` — `CapabilityViewProps`, drop
   `CortexViewProps`.
5. `…/setup-wizard/SetupWizardOverlay.svelte` — dispatch + copy + handler.

## STEPS

1. wizard.types.ts — add (and delete CortexViewProps):

```ts
/** Props for the capability confirm view — renders the CONNECTED Clyffy's
 *  advertised slots as layman sense tiles. Copy = [capability] SSOT. The
 *  tiles are a pure function of the wire capability — honest empty when
 *  standalone. */
export interface CapabilityViewProps {
	copy: CapabilityCopy | null;
	/** True while a live endpoint is connected (drives standalone_hint). */
	connected: boolean;
	slotSaves: SlotSaveEntryProps[];
	busy: boolean;
	/** Tile CTA — routes to the endpoint step (tiles never install). */
	onApplySlot: (kernelSlotId: string) => void | Promise<void>;
	callbacks: WizardCallbacks;
}
```

2. `wizard.state.svelte.ts`: union member `"cortex"` → `"capability"`;
   VIEW_ORDER entry likewise; default `view = $state<WizardView>("cortex")`
   → `$state<WizardView>("endpoint")` (the landed flow's step 1 — the boot
   gate/TopBar re-entry land the operator on the connect step, verified
   against the step-2 census hits); update the stale doc comments (the
   "collapses to cortex single-screen" paragraph describes a dead design —
   rewrite to the two-step endpoint → capability → complete truth).
3. Author `CapabilityView.svelte` from CortexView's skeleton with these
   deltas (CortexView.svelte re-read in full first — 272 lines):
   - Props: `let { copy, connected, slotSaves, busy, onApplySlot, callbacks }: CapabilityViewProps = $props();`
   - OverlayShell: `label={copy?.title ?? ""} step={2} totalSteps={2} title={copy?.title ?? ""}`
     (the hardcoded `"DevPulse setup — cortex"` label dies).
   - Header: Heading/Text from `copy.title` / `copy.subtitle`;
     `{#if !connected}<Text size="xs" color="muted">{copy?.standalone_hint ?? ""}</Text>{/if}`;
     KnowledgeTermStrip caption from `copy.terms_caption` (terms array is a
     TERM-ID list, not English — stays).
   - Constellation + tiles: keep the AnatomyConstellation/AnatomyTile
     composition and SLOT_BY_ANATOMY verbatim (extend over rewrite), but
     wrap each tile in the Tooltip trio with the matching
     `copy.tile_{anatomy}_tip`. The five duplicated snippet bodies collapse
     into one `{#snippet tile(anatomy, tipKey)}`-style helper ONLY if
     AnatomyConstellation's named-snippet API allows passing a shared
     snippet — read AnatomyConstellation.svelte first; if its API is five
     named snippets, keep five (API truth wins; no design/ edits).
   - Footer: Skip button label `copy.skip_label` + Tooltip `copy.skip_tooltip`;
     Continue label `copy.continue_label` + Tooltip `copy.continue_tooltip`
     (the hardcoded "Set up backend later"/"Continue" die).
4. Rewire `SetupWizardOverlay.svelte`:
   - import swap CortexView → CapabilityView; dispatch branch
     `view === "capability"` renders it with
     `copy={copy?.capability ?? null}`,
     `connected={clyffyConnection.state.state === "connected"}` (read the
     rune's actual shape at connection.state.svelte.ts before writing this
     expression — mirror EndpointView:80's `clyffyConnection.state.state`),
     `slotSaves={slotSaveEntries}`, `busy`, `onApplySlot={goToEndpoint}`,
     `callbacks={{ ...callbacks, onNext: capabilityContinue }}`.
   - Rename `cortexContinue` → `capabilityContinue` (logic unchanged, C1).
   - The two hardcoded title/subtitle strings at ~:539-540 are DELETED (they
     live in [capability] now).
   - Repoint every OTHER census hit from step-2 (e.g. `goTo("cortex")`
     anywhere) → `goTo("capability")`.
5. ABSORB-before-DELETE for CortexView.svelte: diff its capabilities against
   CapabilityView — ICON_MAP, SLOT_BY_ANATOMY, findEntry, constellation
   snippets, busy spinner on Continue, ChevronRight affordance. Each either
   lands in CapabilityView or is named as intentionally dead (hardcoded
   strings) in the commit body. Then `git rm` CortexView.svelte.
6. `pnpm check` 0/0 · `no-raw-values` 0 ·
   `grep -rn "cortex" interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/` → ZERO hits (the wizard seam is clean; the 44-file
   app-wide purge stays B8).
7. HMR gate: operator sees the confirm step titled from the SSOT, tiles
   honest (empty-standalone or lit from a real capability), tooltips on
   tiles + footer.
8. Commit + push: `feat(desktop): CapabilityView — wire-truth confirm step, cortex vocabulary out of the wizard (R5)`.

## IMPORT REPOINTS

The full step-2 census table, every hit repointed and listed in the report.
`SlotSaveEntryProps` untouched (CapabilityView consumes it).

## VERIFY

Step 6 raw output · diff-stat ⊆ 5 files · census grep re-run post-edit → 0.

## KNOWN REDS

Baseline only. NOTE (named debt, not this slice): SLOT_LAYMAN's
purpose/tagline strings in SetupWizardOverlay are hardcoded English feeding
tiles — pre-existing; moving them into the engine copy SSOT is follow-up
F-slot-layman (recorded in INDEX deferred list).

## ROLLBACK

`git checkout -- <the four edited files>` ;
`git checkout HEAD -- …/CortexView.svelte` ; `git clean -f …/CapabilityView.svelte`.

## STOP CONDITIONS

- Census finds `"cortex"` hits whose repoint would change behavior outside
  the wizard seam (boot gate branching, persisted state keys) → STOP, list
  them.
- AnatomyConstellation's API can't host tooltips without editing design/ or
  ui/AnatomyTile → STOP, propose the minimal seam, wait.
