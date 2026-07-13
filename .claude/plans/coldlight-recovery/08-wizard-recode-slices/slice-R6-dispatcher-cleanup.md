# R6 — dispatcher cleanup: dead views out, forward flow ruled

## GOAL

Remove the dead `slot-save` surface (ABSORB-verified), take `clyffy-collab`
out of the forward flow per the operator's Q-1 answer, and leave the wizard's
nav model telling the truth: endpoint → capability → complete, with the
legacy install path intact where it is still reachable.

## PRECONDITIONS

1. R5 DONE. Tree clean. **Q-1 answered by the operator** (INDEX) — this
   slice executes the ANSWER; unanswered → BLOCKED, do not start.
2. Importer census (all separate greps, record hits):
   - `grep -rn "SlotSaveView" interfaces/desktop/src/`
   - `grep -rn "SaveSlotCard" interfaces/desktop/src/`
   - `grep -rn '"slot-save"' interfaces/desktop/src/`
   - `grep -rn '"clyffy-collab"\|ClyffyCollabView' interfaces/desktop/src/`
   - `grep -rn "firstRun" interfaces/desktop/src/`
   Expected: SlotSaveView imported by NOTHING in the dispatch (wizard.state
   doc says unreachable via next()/back()); SaveSlotCard consumed only by
   SlotSaveView; firstRun read by the boot gate (KEEP unless the census
   proves otherwise — "remove firstRun" from 04/C5 applies ONLY if the boot
   gate no longer reads it; the census decides, not this plan).

## FILES

1. `…/setup-wizard/feature/views/SlotSaveView.svelte` — DELETE.
2. `…/setup-wizard/ui/SaveSlotCard.svelte` — DELETE (iff census shows its
   only consumer was SlotSaveView; otherwise it STAYS and the report says why).
3. `…/setup-wizard/wizard.state.svelte.ts` — union/VIEW_ORDER edits.
4. `…/setup-wizard/util/wizard.types.ts` — drop `SlotSaveViewProps`
   (`SlotSaveEntryProps` STAYS — CapabilityView consumes it).
5. `…/setup-wizard/SetupWizardOverlay.svelte` — collab flow wiring per Q-1.

## STEPS

1. ABSORB check on SlotSaveView (read in full): its unique capabilities
   (vertical card-list rendering, per-slot save/pick-different callbacks,
   ICON_MAP) — confirm each is either present in CapabilityView/AnatomyTile
   or names a dead feature (the install-chain per-slot save died with the
   preconfigured-capabilities lock; cite the lock in the commit body). Any
   LIVE capability with no home → STOP.
2. `git rm` SlotSaveView.svelte (+ SaveSlotCard.svelte per census).
3. wizard.state.svelte.ts: remove `"slot-save"` from the union; per Q-1
   answer remove `"clyffy-collab"` from VIEW_ORDER (type union KEEPS
   `clyffy-collab` — the view stays reachable by `goTo` for the future
   enable-assist moment; only the forward walk changes). Update doc comments
   to the truth.
4. wizard.types.ts: delete `SlotSaveViewProps` + the `slot-save` ViewProps
   union arm (+ `clyffy-collab` arm stays). Doc-comment refresh.
5. SetupWizardOverlay.svelte: remove the SlotSave-era imports if any remain;
   the `clyffy-collab` dispatch branch STAYS (reachable surface); verify the
   auto-advance effect (installing → complete) is unaffected by the
   VIEW_ORDER change when installsTotal > 0 (read the effect, state the
   conclusion in the report).
6. `pnpm check` 0/0 · `no-raw-values` 0 ·
   `grep -rn "slot-save\|SlotSaveView" interfaces/desktop/src/` → 0.
7. Commit + push: `refactor(desktop): wizard nav truth — slot-save absorbed out, collab flow per operator ruling (R6)`.

## IMPORT REPOINTS

Whatever the census found — every hit repointed or deleted, enumerated in
the report.

## VERIFY

Step 6 · diff-stat ⊆ FILES.

## KNOWN REDS

Baseline only. If SlotSaveView had tests, they are deleted WITH their view
(a test of deleted code is not a chased red — name it).

## ROLLBACK

`git checkout HEAD -- <every touched/deleted path>`

## STOP CONDITIONS

- Census contradicts an expectation (live consumer of SlotSaveView/
  SaveSlotCard; boot gate NOT reading firstRun) → follow the census, and if
  that forces a decision the plan didn't rule → STOP, report.
