> # ⚠️ UNVERIFIED — OUTPUT NOT TRUSTED
>
> This sprint was marked COMPLETE in a prior session log. That status is
> **not binding.** The setup wizard does not currently pass a live audit
> against the 10 Commandments in `POAM-MODEL-LOADER-WIZARD.md`.
>
> - Prior commits shipped. Prior code lives on disk. Neither proves the UX works.
> - Every file this sprint touched must be re-checked against the 10
>   Commandments (POAM §top) before being cited as "done."
> - Acceptance criteria below are aspirational, not retired.
>
> **Authority** → `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# Sprint ML-06: STIG Compliance + Error Documentation + Verification

| Field | Value |
|-------|-------|
| **Status** | `EXECUTED` |
| **Depends on** | ML-01 through ML-05 (all UI and backend complete) |
| **Blocks** | Model loader declared DONE |
| **Files** | 2 modified, 1 created |
| **Risk** | LOW — polish, documentation, accessibility audit |

---

## PROBLEM STATEMENT

Sprints ML-01 through ML-05 build the functionality. This sprint ensures:
1. STIG/SRG accessibility compliance on all interactive elements
2. Every error path documented with JSDoc (what throws, side effects, cleanup)
3. Every failed operation logged with full context (not just "error")
4. A verification checklist that proves every gap from the analysis is resolved — with the implementing file cross-referenced

---

## FILE 1: MODIFY `steps/SlotAssignmentPanel.svelte` — Accessibility Audit

### STIG Requirements Applied:

**V-222601 — Interactive elements must be keyboard accessible:**
- Every button: `tabindex="0"` (default for `<button>`, verify no `tabindex="-1"`)
- Expandable model list: `role="listbox"` on container, `role="option"` on each model row
- Model rows clickable via Enter/Space (add `onkeydown` handler)
- Escape key collapses expanded list: `onkeydown={(e) => { if (e.key === "Escape") expandedSlot = null; }}`

**V-222602 — Focus management on dynamic content:**
- On expand: focus first model row in the expanded list
- On collapse: return focus to the Assign/Change button that triggered expand
- Implementation: `let expandTriggerRef: HTMLButtonElement | null` + `$effect` with `document.querySelector`

**V-222603 — Screen reader announcements:**
- Status changes: wrap status Badge area in `aria-live="polite"` region
- Error messages: wrap error display in `aria-live="assertive"` region
- Download progress: `aria-label="Downloading {filename}, {percent}% complete"` on Progress

**V-222604 — All interactive elements have accessible names:**
- Every button: `aria-label="action description for slot name"` 
  - e.g., `aria-label="Load Main AI model into memory"`
  - e.g., `aria-label="Expand model list for Search Engine slot"`
  - e.g., `aria-label="Cancel downloading Qwen3-4B"`
- Every Badge: `aria-label="Status: {statusLabel}"` where meaningful

**V-222606 — Color is not the only indicator:**
- Fit indicator: dot + text label (e.g., "● fits comfortably", not just a colored dot)
- Status: Badge text + border color (not color alone)
- Readiness bar: dot + subsystem name (not dot alone)

### svelte-check warnings:

- Every remaining a11y warning: either FIX or add `<!-- svelte-ignore {rule} -->` with a comment explaining WHY it's intentional
- Document each ignored warning with the exact reason

---

## FILE 2: MODIFY `wizard.service.ts` — Error Documentation

### JSDoc every public function:

```typescript
/**
 * Download a model from HuggingFace and assign it to a slot.
 *
 * @param rec - Model recommendation containing repo, filename, target slot
 * @throws {Error} If download fails (network, disk, timeout)
 * @throws {Error} If model not found in registry after successful download
 * @throws {Error} If slot assignment fails
 *
 * @sideeffects
 * - Registers and cleans up onDownloadProgress listener
 * - Updates wizardState.activeDownloads throughout lifecycle
 * - Calls modelsState.scan() and modelsState.refresh() on success
 * - Calls modelsState.assign() on success
 * - Fires 2-3 toast notifications (start, complete/fail)
 *
 * @cleanup On failure: unsubscribes progress listener, updates download status to "failed"
 */
```

Apply this pattern to: `downloadAndAssign`, `cancelActiveDownload`, `autoAssignAllSlots`, `bulkDownloadAndAssign`, `startHardwareScan`, `fetchRecommendations`, `evaluateContinueGate`, `testInference`, `createDevProfile`, `checkDevProfile`, `checkOnboardingComplete`, `markOnboardingComplete`, `validateModelPaths`, `detectHardwareChange`, `subsequentLaunchCheck`.

### Enhanced error logging:

Every catch block must log via `logError()` with structured context:

```typescript
} catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logError("wizard.download", `Download failed`, {
        repo: rec.repo,
        filename: rec.file,
        targetSlot: rec.slot,
        bytesReceived: wizardState.activeDownloads[downloadId]?.bytesDownloaded ?? 0,
        totalExpected: wizardState.activeDownloads[downloadId]?.totalBytes ?? 0,
        error: msg,
    });
    // ... rest of error handling
}
```

For load failures:
```typescript
logError("wizard.load", `Load failed`, {
    slotId,
    modelFilename: model?.filename,
    modelSizeMb: model?.size_mb,
    vramEstimateMb: model?.vram_estimate_mb,
    availableVramMb: hardwareState.vramFreeMb,
    gpuName: hardwareState.gpuName,
    error: msg,
});
```

---

## FILE 3: CREATE `scripts/docs/sprints/dev-onboarding/MODEL-LOADER-VERIFICATION.md`

### Enterprise Verification Checklist

Every item has: description, implementing file, verification method.

```markdown
# Model Loader — Enterprise Verification Checklist

> Run this checklist after ML-01 through ML-06 are complete.
> Every item requires PROOF. "Looks good" is not proof.

## Rust Backend (ML-01)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 1 | .bin files discovered | discovery.rs | PASTE registry.json entry for ggml-small.bin showing SpeechToText capability |
| 2 | Safetensor shards filtered | discovery.rs | STATE count of safetensor entries in registry.json (expected: 0) |
| 3 | Duplicates deduplicated | registry.rs | STATE total model count in registry.json (expected: 6-8, not 20) |
| 4 | cargo check passes | model-loader | PASTE last line of cargo check output (0 errors) |
| 5 | cargo test passes | model-loader | PASTE test summary line (all tests pass) |

## Download Pipeline (ML-02)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 6 | Download progress updates in state | wizard.runes.svelte.ts | Start download, inspect wizardState.activeDownloads — bytesDownloaded updates |
| 7 | Toast on download start | wizard.service.ts | Visual: "Downloading..." toast appears |
| 8 | Toast on download complete | wizard.service.ts | Visual: "downloaded" toast appears |
| 9 | Toast on download fail | wizard.service.ts | Visual: toast.error with raw message |
| 10 | Cancel download works | wizard.service.ts | Click cancel → download stops, toast "cancelled" |
| 11 | pnpm svelte-check passes | — | PASTE COMPLETED line (0 errors) |

## Slot Assignment Panel (ML-03)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 12 | Glass cards visible | SlotAssignmentPanel.svelte | Screenshot: cards have depth/glass effect |
| 13 | Teal glow on loaded slots | SlotAssignmentPanel.svelte | Screenshot: loaded card has teal border glow |
| 14 | Red glow on failed slots | SlotAssignmentPanel.svelte | Screenshot: failed card has red border glow |
| 15 | chat.brain appears FIRST | SlotAssignmentPanel.svelte | Screenshot: first card is "Main AI" |
| 16 | Subsystem headers visible | SlotAssignmentPanel.svelte | Screenshot: "Chat", "Search Pipeline", "Voice" headers |
| 17 | Model metadata inline | SlotAssignmentPanel.svelte | Screenshot: arch, quant, size, VRAM, context visible |
| 18 | Inline expand works | SlotAssignmentPanel.svelte | Screenshot: card expanded showing model list, NO floating layer |
| 19 | Assign by clicking model row | SlotAssignmentPanel.svelte | Click model → assigned, card collapses |
| 20 | Load button works | SlotAssignmentPanel.svelte | Click Load → SwapOverlay appears → model loads |
| 21 | Unload button visible on loaded | SlotAssignmentPanel.svelte | Screenshot: Unload button on hot/standby slot |
| 22 | VRAM guard disables Load | SlotAssignmentPanel.svelte | Screenshot: "Too large for GPU" message, Load disabled |
| 23 | Download progress inline | SlotAssignmentPanel.svelte | Screenshot: Progress bar with speed/ETA during download |
| 24 | Cancel download button | SlotAssignmentPanel.svelte | Click cancel → download stops |
| 25 | Auto-Configure button | SlotAssignmentPanel.svelte | Click → slots auto-filled → toasts per assignment |
| 26 | No text-xs | SlotAssignmentPanel.svelte | GREP text-xs → 0 results |
| 27 | No floating layers | SlotAssignmentPanel.svelte | GREP fixed\|z-50 → 0 results |
| 28 | ModelPicker.svelte deleted | — | File does not exist on disk |
| 29 | pnpm svelte-check passes | — | PASTE COMPLETED line (0 errors) |

## Layout + VRAM + Swap (ML-04)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 30 | Toaster mounted | ModelLoaderStep.svelte | Toast notifications render in viewport |
| 31 | Scan on Phase 2 entry | ModelLoaderStep.svelte | Boot app → Phase 2 → models appear in slot cards |
| 32 | VRAM stacked bar | ResourceAllocationPanel.svelte | Screenshot: colored segments per slot |
| 33 | Over-budget indicator | ResourceAllocationPanel.svelte | Assign huge models → red overflow message |
| 34 | SwapOverlay stage dots | SwapOverlay.svelte | Screenshot: 5-dot progress with labels |
| 35 | SwapOverlay retry button | SwapOverlay.svelte | Load fail → Retry button visible and works |
| 36 | SwapOverlay Try CPU | SwapOverlay.svelte | VRAM error → "Try CPU Mode" button visible |
| 37 | No emoji in SwapOverlay | SwapOverlay.svelte | GREP emoji unicode → 0 results |
| 38 | ModelBrowserPopup removed | ModelLoaderStep.svelte | GREP ModelBrowserPopup → 0 results |
| 39 | ImportPrompt removed | ModelLoaderStep.svelte | GREP ImportPrompt → 0 results |

## HF Search + Cross-Links (ML-05)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 40 | HF search inline | HuggingFaceSearch.svelte | Screenshot: search section below slot cards |
| 41 | Search returns results | HuggingFaceSearch.svelte | Type query → results appear |
| 42 | Download from HF | HuggingFaceSearch.svelte | Click Download → slot picker → download starts |
| 43 | Load More pagination | HuggingFaceSearch.svelte | Click Load More → more results appear |
| 44 | Cross-link readiness bar | SlotAssignmentPanel.svelte | Screenshot: colored dots per subsystem |
| 45 | No floating popup for HF | — | GREP ModelBrowserPopup in models domain → 0 results |

## STIG Compliance (ML-06)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 46 | aria-label on all buttons | SlotAssignmentPanel.svelte | GREP aria-label → count matches button count |
| 47 | Keyboard expand/collapse | SlotAssignmentPanel.svelte | Tab to Assign → Enter → list expands → Escape → collapses |
| 48 | Focus management | SlotAssignmentPanel.svelte | Expand → focus moves to first model row |
| 49 | aria-live on status | SlotAssignmentPanel.svelte | aria-live="polite" on status region |
| 50 | aria-live on errors | SlotAssignmentPanel.svelte | aria-live="assertive" on error region |
| 51 | Color not sole indicator | SlotAssignmentPanel.svelte | Fit indicator has text label, not just dot |
| 52 | svelte-check warnings documented | All files | STATE count, each has comment with reason |

## Error Handling (ML-06)

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 53 | JSDoc on all public functions | wizard.service.ts | Read file, confirm every export has @throws/@sideeffects |
| 54 | logError with context | wizard.service.ts | GREP logError → every catch block has structured context |
| 55 | Download fail logs repo+file | wizard.service.ts | Code review: catch in downloadAndAssign logs repo, file, bytes |
| 56 | Load fail logs VRAM+model | wizard.service.ts | Code review: catch in load path logs model size, available VRAM |
| 57 | No silent catch blocks | All files | GREP "catch" → every catch either throws, logs, or sets error state |

## Data Integrity

| # | Requirement | File | Proof Method |
|---|-------------|------|-------------|
| 58 | No duplicate data-kind attributes | All components | Each element has ONE data-kind via renderForge spread |
| 59 | renderForge used on all ColdLight | All components | Every Card/Progress/Badge uses renderForge, not raw styles |
| 60 | No raw oklch in component files | All components | GREP "oklch" → only in scoped <style> blocks for glow/hover, not inline |
```

---

## VERIFICATION FOR THIS SPRINT (ML-06 itself)

### After a11y edits to SlotAssignmentPanel:

- [ ] **GREP `aria-label` in file** — count matches number of interactive elements (buttons, model rows)
- [ ] **GREP `aria-live` in file** — at least 2: one "polite" (status), one "assertive" (errors)
- [ ] **GREP `role="listbox"` in file** — present on expandable model list container
- [ ] **GREP `role="option"` in file** — present on each model row in expanded list
- [ ] **Test keyboard**: Tab through page → every button reachable. Enter on Assign → list expands. Escape → list collapses. Enter on model row → assigned.

### After error docs in wizard.service.ts:

- [ ] **Re-read every exported function** — each has `@throws`, `@sideeffects`, `@cleanup` JSDoc
- [ ] **GREP `logError` in file** — every `catch` block that handles user-facing errors has a `logError()` call with structured context object
- [ ] **No empty catch blocks** — GREP `catch.*\{[\s]*\}` → 0 results

### After creating MODEL-LOADER-VERIFICATION.md:

- [ ] **Read the full checklist** — every item has a concrete proof method, not "verify it works"
- [ ] **Cross-reference** — every gap item from MODEL-LOADER-GAP-ANALYSIS.md appears in the checklist
- [ ] **Count** — minimum 60 verification items covering all 6 sprints

### Final compilation:

- [ ] `pnpm svelte-check` — **PASTE the COMPLETED line**. `0 ERRORS`.
- [ ] **State total warning count** across all modified files. Each warning documented.

---

## DONE GATE

The Model Loader is NOT done until:

1. All 60 items in MODEL-LOADER-VERIFICATION.md are checked with proof
2. `cargo check -p model-loader` = 0 errors, 0 warnings from our code
3. `pnpm svelte-check` = 0 errors
4. Owner visual inspection approves glass cards, layout, readiness bar
5. Owner can: browse models, assign to slot, download with progress, load, unload, search HF, import — all from one page with no popups
