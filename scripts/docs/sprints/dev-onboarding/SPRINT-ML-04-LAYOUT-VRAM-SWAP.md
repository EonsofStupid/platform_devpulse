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

# Sprint ML-04: Layout + VRAM Bar + SwapOverlay + Toaster

| Field | Value |
|-------|-------|
| **Status** | `PLANNED` |
| **Depends on** | ML-03 (SlotAssignmentPanel rewritten) |
| **Blocks** | ML-05 (HF search needs layout in place) |
| **Files** | 3 Svelte modified |
| **Risk** | MEDIUM — layout changes + SwapOverlay rewrite |

---

## PROBLEM STATEMENT

1. **ModelLoaderStep** doesn't mount Toaster — toasts from ML-02 have no render target
2. **ModelLoaderStep** doesn't scan on Phase 2 entry — user's models aren't discovered until manual action
3. **ResourceAllocationPanel** is text-only — no visual VRAM bar
4. **SwapOverlay** uses emoji, raw divs, no retry, no Try CPU fallback
5. **ModelLoaderStep** still references deleted ModelBrowserPopup and ImportPrompt

---

## PRE-FLIGHT

1. Read `steps/ModelLoaderStep.svelte` — FULL FILE, note all imports and what it renders
2. Read `steps/ResourceAllocationPanel.svelte` — FULL FILE
3. Read `components/SwapOverlay.svelte` — FULL FILE
4. Read `$lib/design/components/toaster/Toaster.svelte` — confirm it mounts without a provider
5. GREP `ModelBrowserPopup|ImportPrompt` in ModelLoaderStep.svelte — list references to remove
6. Read `runes/swap.runes.svelte.ts` — understand swapState shape (active, operation, slotId, stage, progress, error)

---

## FILE 1: MODIFY `steps/ModelLoaderStep.svelte`

### Changes:

1. **Add Toaster** — `import { Toaster } from "$lib/design/components/toaster/index.js"` and render `<Toaster position="bottom-right" />` inside the component
2. **Scan on mount** — add `$effect` that runs once:
   ```typescript
   let scanned = $state(false);
   $effect(() => {
       if (!scanned) {
           scanned = true;
           modelsState.scan().then(() => modelsState.refresh());
       }
   });
   ```
3. **Remove ModelBrowserPopup** — delete import, delete `{#if wizardState.showModelBrowser}` block
4. **Remove ImportPrompt** — delete import, delete `{#if wizardState.showImportPrompt}` block (import is now per-slot inline in SlotAssignmentPanel)
5. **Layout** — two-column: `grid grid-cols-[1fr_22rem] gap-6`
   - Left: SlotAssignmentPanel in scroll container (`overflow-y-auto flex-1`)
   - Right: VramGauge (top, prominent) + ResourceAllocationPanel (below) in sticky column
6. **Fluid padding** — outer container uses standard padding
7. **Remove unused imports** — any import no longer referenced after cleanup

### Updated SlotAssignmentPanel props:

```svelte
<SlotAssignmentPanel
    onBrowseModels={() => { /* scroll to HF section - wired in ML-05 */ }}
    onImport={(slotId) => { importLocalModel(slotId); }}
/>
```

---

## FILE 2: MODIFY `steps/ResourceAllocationPanel.svelte`

### Changes:

1. **VRAM stacked bar** — horizontal bar showing per-GPU-slot segments:
   ```svelte
   {#if hardwareState.hasGpu}
   <div class="vram-bar" style="height: 1.5rem;">
       {#each gpuSlots as slot (slot.id)}
           {@const model = modelsState.assignedModel(slot.id)}
           {@const vram = model?.vram_estimate_mb ?? 0}
           {@const pct = hardwareState.vramTotalMb > 0 ? (vram / hardwareState.vramTotalMb) * 100 : 0}
           {@const loaded = isInferenceReady(modelsState.statuses[slot.id] ?? { type: "cold" })}
           {#if vram > 0}
           <div
               class="vram-segment"
               style="width: {pct}%; background: {loaded ? 'var(--accent-teal-main)' : 'oklch(0.4 0.08 190 / 0.5)'};"
               title="{friendlySlotLabel(slot.id)}: {formatMb(vram)}"
           ></div>
           {/if}
       {/each}
       <!-- Free segment -->
       <div class="vram-free" style="flex: 1; background: oklch(0.2 0.01 220 / 0.3);"></div>
   </div>
   {/if}
   ```
2. **Overflow indicator** — if `gpuUsedEstimate > hardwareState.vramTotalMb`:
   ```svelte
   <Text size="sm" style="color: var(--signal-error);">
       Over budget by {formatMb(gpuUsedEstimate - hardwareState.vramTotalMb)} —
       some models will fall back to CPU
   </Text>
   ```
3. **All text-sm minimum** — replace every `text-xs` with `text-sm`
4. **Import `isInferenceReady`, `formatContext`** from types

### Scoped CSS:
```css
<style>
.vram-bar {
    display: flex;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
}
.vram-segment {
    transition: width 0.3s ease;
    min-width: 2px;
}
</style>
```

---

## FILE 3: MODIFY `components/SwapOverlay.svelte`

### Changes:

1. **Replace emoji with lucide icons**:
   - Loading: `<LoaderCircle size={32} class="animate-spin" />`
   - Error: `<AlertTriangle size={32} />`
   - Success: `<CheckCircle size={32} />`

2. **Use ColdLight Card for center panel**:
   ```typescript
   const cardM = $derived(renderForge({ kind: "card", preset: "glass" }));
   ```
   ```svelte
   <div {...cardM.dataAttrs} style={cssVarString(cardM.cssVars)} class="...">
   ```

3. **Use ColdLight Progress**:
   ```svelte
   <Progress value={swapState.progress} max={100} size="lg" />
   ```

4. **Multi-step stage indicator** — 5 dots:
   ```svelte
   {@const stages = ["Verifying", "Allocating", "Loading Weights", "Tokenizer", "Warming Up"]}
   {@const currentIdx = stages.findIndex(s => stageLabel(swapState.stage) === s)}
   <div class="flex gap-3 items-center">
       {#each stages as stage, i (stage)}
           <div class="flex items-center gap-1">
               <div
                   class="w-3 h-3 rounded-full transition-colors"
                   style="background: {i < currentIdx ? 'var(--signal-success)' : i === currentIdx ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
               ></div>
               <Text size="sm" color={i === currentIdx ? "primary" : "muted"}>{stage}</Text>
           </div>
       {/each}
   </div>
   ```

5. **Error state — Retry + Try CPU**:
   ```svelte
   {#if swapState.error}
       <Text size="sm" color="primary">{swapState.error}</Text>
       <div class="flex gap-3 mt-4">
           <Button onclick={() => { swapState.dismiss(); modelsState.load(swapState.slotId); }}>
               Retry
           </Button>
           {#if swapState.error.toLowerCase().match(/vram|memory|out of/)}
               <Button variant="outline" onclick={() => { /* TODO: CPU fallback needs engine support */ }}>
                   Try CPU Mode
               </Button>
           {/if}
           <Button variant="ghost" onclick={() => swapState.dismiss()}>
               Dismiss
           </Button>
       </div>
   {/if}
   ```

6. **All text minimum text-sm** — no text-xs

---

## VERIFICATION CHECKLIST

### After editing ModelLoaderStep.svelte:

- [ ] **Re-read full file** — confirm Toaster rendered, scan-on-mount effect present
- [ ] **GREP `ModelBrowserPopup|ImportPrompt` in file** — 0 results
- [ ] **Confirm two-column grid** — `grid-cols-[1fr_22rem]` or similar ratio
- [ ] **Confirm no unused imports** — every import used in template

### After editing ResourceAllocationPanel.svelte:

- [ ] **Re-read full file** — confirm VRAM bar renders with per-slot segments
- [ ] **GREP `text-xs` in file** — 0 results
- [ ] **Confirm overflow indicator** — conditional render when over budget

### After editing SwapOverlay.svelte:

- [ ] **Re-read full file** — confirm emoji removed, lucide icons imported and used
- [ ] **Confirm renderForge** — Card uses `renderForge({ kind: "card", preset: "glass" })`
- [ ] **Confirm ColdLight Progress** — `<Progress value={...} max={100} size="lg" />`
- [ ] **Confirm Retry button** — calls `modelsState.load()` after dismiss
- [ ] **Confirm Try CPU** — only shown for VRAM-related errors (regex match)
- [ ] **GREP `text-xs` in file** — 0 results

### Compilation:

- [ ] `pnpm svelte-check` — **PASTE the COMPLETED line**. `0 ERRORS` required.
- [ ] **State warning count and reasons**

### Functional:

- [ ] Toast appears when download completes (requires test download)
- [ ] VRAM bar shows colored segments matching assigned models
- [ ] Loading a model → SwapOverlay shows stage dots + progress bar (not emoji)
- [ ] Load failure → Retry and Try CPU buttons visible

---

## WHAT THIS SPRINT DOES NOT TOUCH

- SlotAssignmentPanel.svelte (done in ML-03)
- wizard.runes.svelte.ts (done in ML-02)
- wizard.service.ts (done in ML-02, updated in ML-06)
- HuggingFaceSearch.svelte (ML-05)
- Any Rust code (done in ML-01)
