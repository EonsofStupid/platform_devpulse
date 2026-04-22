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

# Sprint ML-02: Frontend — Download Event Wiring + Toast

| Field | Value |
|-------|-------|
| **Status** | `PLANNED` |
| **Depends on** | ML-01 (registry must discover all models correctly) |
| **Blocks** | ML-03 (UI needs download state to render progress) |
| **Files** | 2 TS modified |
| **Risk** | LOW — wiring existing events to existing state, no new IPC |

---

## PROBLEM STATEMENT

`onDownloadProgress()` exists in `download.service.ts:85` but is NEVER called by the wizard. `wizardState.downloadProgress` is set to 0 and never updated. The user clicks "Download" and sees nothing happen — no progress, no speed, no ETA, no way to cancel, no notification when done.

The Rust backend emits `model:download-progress` events with `{ download_id, bytesDownloaded, totalBytes, speedBps }`. The frontend has the listener function. The wire between them does not exist.

---

## PRE-FLIGHT

Read and confirm understanding of:

1. `services/download.service.ts` — FULL FILE
   - Line 85-101: `onDownloadProgress()` — takes callback, returns unsubscribe fn
   - Line 104-120: `onDownloadComplete()` — takes callback, returns unsubscribe fn
   - Line 36-46: `cancelDownload()` — calls Rust cancel command
2. `features/setup-wizard/wizard.runes.svelte.ts` — FULL FILE
   - Current download state: `downloadQueue`, `downloadingIndex`, `downloadProgress`
3. `features/setup-wizard/wizard.service.ts` — FULL FILE
   - Line 116-149: `downloadAndAssign()` — current implementation, does NOT wire progress
   - Line 152-169: `bulkDownloadAndAssign()` — loops, sets index, never updates progress
4. `systems/devpulse-engine/src/platform/integrations/events.rs` — Lines 65-87
   - Confirm event payload shapes: `bytesDownloaded`, `totalBytes`, `speedBps` (camelCase in JSON)
5. Confirm `svelte-sonner` is in `package.json` dependencies
6. Confirm `Toaster` component exists at `$lib/design/components/toaster/index.js`

---

## FILE 1: `features/setup-wizard/wizard.runes.svelte.ts`

### Change: Add download tracking state and methods

Add to WizardState class, after the existing Phase 2 section (after `importTargetSlot`):

```typescript
// ── Download Tracking ────────────────────────────────
// Wired to Rust events via wizard.service.ts.
// Keys are downloadId strings from the Rust download manager.
activeDownloads = $state<Record<string, {
    downloadId: string;
    slot: SlotId;
    filename: string;
    bytesDownloaded: number;
    totalBytes: number;
    speedBps: number;
    status: "active" | "complete" | "failed" | "cancelled";
    error?: string;
}>>({});

trackDownload(downloadId: string, slot: SlotId, filename: string): void {
    this.activeDownloads = {
        ...this.activeDownloads,
        [downloadId]: {
            downloadId, slot, filename,
            bytesDownloaded: 0, totalBytes: 0, speedBps: 0,
            status: "active",
        },
    };
}

updateDownloadProgress(downloadId: string, bytesDownloaded: number, totalBytes: number, speedBps: number): void {
    const dl = this.activeDownloads[downloadId];
    if (dl) {
        this.activeDownloads = {
            ...this.activeDownloads,
            [downloadId]: { ...dl, bytesDownloaded, totalBytes, speedBps },
        };
    }
}

completeDownload(downloadId: string): void {
    const dl = this.activeDownloads[downloadId];
    if (dl) {
        this.activeDownloads = {
            ...this.activeDownloads,
            [downloadId]: { ...dl, status: "complete" },
        };
    }
}

failDownload(downloadId: string, error: string): void {
    const dl = this.activeDownloads[downloadId];
    if (dl) {
        this.activeDownloads = {
            ...this.activeDownloads,
            [downloadId]: { ...dl, status: "failed", error },
        };
    }
}

downloadForSlot(slotId: SlotId) {
    return Object.values(this.activeDownloads).find(
        (d) => d.slot === slotId && d.status === "active",
    ) ?? null;
}

get hasActiveDownloads(): boolean {
    return Object.values(this.activeDownloads).some((d) => d.status === "active");
}
```

**WHY spread operator instead of mutation:** Svelte 5 runes need new object references to trigger reactivity on nested record properties. Direct mutation (`dl.bytesDownloaded = x`) won't re-render components reading `activeDownloads`.

---

## FILE 2: `features/setup-wizard/wizard.service.ts`

### Change 1: Add imports

Add to existing imports:
```typescript
import {
    cancelDownload,
    downloadModel,
    onDownloadComplete,
    onDownloadProgress,
} from "../../services/download.service.js";
import { friendlySlotLabel } from "../../types/models.types.js";
```

Remove `downloadModel` and `onDownloadComplete` from any existing import that already has them (avoid duplicates).

### Change 2: REPLACE `downloadAndAssign()`

Replace the entire function (lines 116-149) with:

```typescript
/** Download a model and assign it to its target slot.
 *
 * @throws Error if download fails, times out, or model not found after scan.
 *
 * Side effects:
 * - Registers progress listener (cleaned up on complete/fail/timeout)
 * - Updates wizardState.activeDownloads with real-time progress
 * - Fires toast notifications via svelte-sonner
 * - Calls modelsState.scan() and modelsState.assign() on success
 */
export async function downloadAndAssign(rec: ModelRec): Promise<void> {
    wizardState.error = null;
    const { toast } = await import("svelte-sonner");

    let downloadId: string;
    try {
        downloadId = await downloadModel(rec.repo, rec.file);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        wizardState.error = msg;
        toast.error(`Download failed: ${msg}`);
        throw e;
    }

    wizardState.trackDownload(downloadId, rec.slot, rec.file);
    toast.info(`Downloading ${rec.name}...`);

    // Wire progress events — THE MISSING LINK
    const unsubProgress = onDownloadProgress((progress) => {
        if (progress.downloadId === downloadId) {
            wizardState.updateDownloadProgress(
                downloadId,
                progress.bytesDownloaded,
                progress.totalBytes,
                progress.speedBps,
            );
        }
    });

    try {
        // Wait for completion or timeout
        await new Promise<void>((resolve, reject) => {
            const unsub = onDownloadComplete((data) => {
                if (data.downloadId === downloadId) {
                    unsub();
                    resolve();
                }
            });
            setTimeout(() => {
                unsub();
                reject(new Error("Download timed out after 30 minutes"));
            }, 30 * 60 * 1000);
        });

        unsubProgress();
        wizardState.completeDownload(downloadId);
        toast.success(`${rec.name} downloaded`);

        // Scan to pick up the new file
        await modelsState.scan();
        await modelsState.refresh();

        // Find and assign
        const model = modelsState.models.find((m) => m.filename === rec.file);
        if (!model) {
            throw new Error(`Downloaded ${rec.file} but not found in registry after scan`);
        }
        await modelsState.assign(rec.slot, model.id);
        toast.success(`${rec.name} assigned to ${friendlySlotLabel(rec.slot)}`);
    } catch (e) {
        unsubProgress();
        const msg = e instanceof Error ? e.message : String(e);
        wizardState.failDownload(downloadId, msg);
        wizardState.error = msg;
        toast.error(`Download failed: ${msg}`);
        throw e;
    }
}
```

### Change 3: ADD `cancelActiveDownload()`

```typescript
/** Cancel an in-progress download.
 *
 * @throws Error if download ID not found or cancel IPC fails.
 *
 * Side effects:
 * - Calls Rust cancel_download command
 * - Updates wizardState.activeDownloads status to "cancelled"
 * - Fires toast notification
 */
export async function cancelActiveDownload(downloadId: string): Promise<void> {
    await cancelDownload(downloadId);
    const dl = wizardState.activeDownloads[downloadId];
    if (dl) {
        wizardState.activeDownloads = {
            ...wizardState.activeDownloads,
            [downloadId]: { ...dl, status: "cancelled" },
        };
    }
    const { toast } = await import("svelte-sonner");
    toast.info("Download cancelled");
}
```

### Change 4: ADD `autoAssignAllSlots()`

```typescript
/** Auto-assign compatible models to all unassigned user slots.
 * Picks the smallest-VRAM model that fits (green or yellow fit indicator).
 * This is an OPT-IN action — user clicks "Auto-Configure".
 *
 * Side effects:
 * - Calls modelsState.assign() per slot
 * - Fires toast per assignment
 */
export async function autoAssignAllSlots(): Promise<void> {
    const { toast } = await import("svelte-sonner");
    let assigned = 0;

    for (const slot of modelsState.userSlots) {
        if (slot.assigned_model_id) continue; // Already assigned

        const compatible = modelsState.modelsForCapability(slot.capability);
        if (compatible.length === 0) continue;

        // Sort by VRAM ascending — prefer smallest that fits
        const sorted = [...compatible].sort((a, b) => a.vram_estimate_mb - b.vram_estimate_mb);

        // Pick first model (smallest VRAM)
        const pick = sorted[0];
        try {
            await modelsState.assign(slot.id, pick.id);
            toast.success(`${pick.filename} → ${friendlySlotLabel(slot.id)}`);
            assigned++;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(`Failed to assign ${friendlySlotLabel(slot.id)}: ${msg}`);
        }
    }

    if (assigned === 0) {
        toast.info("No unassigned slots with compatible models found");
    }
}
```

---

## VERIFICATION CHECKLIST

### After editing wizard.runes.svelte.ts:

- [ ] **Re-read the entire WizardState class** — confirm `activeDownloads` uses spread operator for all mutations (trackDownload, updateDownloadProgress, completeDownload, failDownload)
- [ ] **Confirm no duplicate state** — `downloadProgress` (the old number field) should still exist for backwards compat with bulk progress display. `activeDownloads` is the NEW per-download tracker. They are NOT redundant — one is aggregate index, one is per-download detail.
- [ ] **Confirm imports** — `SlotId` imported from `../../types/models.types.js`

### After editing wizard.service.ts:

- [ ] **Re-read `downloadAndAssign()` FULLY** — confirm:
  - `onDownloadProgress` is imported from `../../services/download.service.js`
  - `cancelDownload` is imported from `../../services/download.service.js`
  - `friendlySlotLabel` is imported from `../../types/models.types.js`
  - `unsubProgress()` is called in BOTH success and error paths (no listener leak)
  - Toast import is dynamic `await import("svelte-sonner")` (tree-shaking safe)
- [ ] **Confirm no duplicate imports** — `downloadModel` and `onDownloadComplete` must appear in exactly ONE import statement, not two
- [ ] **Re-read `cancelActiveDownload()`** — confirm it calls `cancelDownload()` (the service function) not `wizardState.cancelDownload()` (which doesn't exist)
- [ ] **Re-read `autoAssignAllSlots()`** — confirm it uses `modelsState.modelsForCapability()` (existing function at line 183) not a reimplementation

### Compilation:

- [ ] `pnpm svelte-check` — **PASTE the COMPLETED line**. Must show `0 ERRORS`. Any error = BLOCKER.
- [ ] **GREP for unused imports** in both files: `grep -n "import.*from" wizard.runes.svelte.ts wizard.service.ts` — paste output, confirm every import is used

### Functional (manual test in running app):

- [ ] Start a download → `console.log(JSON.stringify(wizardState.activeDownloads))` shows entry with updating `bytesDownloaded` — **NOT TESTED until ML-03 adds UI, but state mutation verified via devtools or $inspect**
- [ ] Toast appears on download start ("Downloading...")
- [ ] Toast appears on download complete ("downloaded")
- [ ] If download fails: toast shows raw error message

---

## WHAT THIS SPRINT DOES NOT TOUCH

- SlotAssignmentPanel.svelte (that's ML-03)
- ModelLoaderStep.svelte (that's ML-04)
- Any Rust code (that's ML-01)
- ModelPicker.svelte (deleted in ML-03)
- Any ColdLight components (visual overhaul is ML-03+)
