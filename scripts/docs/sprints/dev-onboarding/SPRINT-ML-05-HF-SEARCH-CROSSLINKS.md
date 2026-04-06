# Sprint ML-05: HuggingFace Search Inline + Cross-Link Readiness

| Field | Value |
|-------|-------|
| **Status** | `PLANNED` |
| **Depends on** | ML-04 (layout in place, Toaster mounted) |
| **Blocks** | ML-06 (compliance pass needs all UI present) |
| **Files** | 1 created, 1 modified |
| **Risk** | LOW — new component + minor panel update |

---

## PROBLEM STATEMENT

1. HuggingFace search is a floating popup (`ModelBrowserPopup.svelte`). Owner wants inline.
2. No cross-link readiness display — user can't see at a glance which subsystems (Chat, Voice, Vision, Search) have all their slots filled.
3. No pagination on HF search results.
4. No download count, likes, or description shown per HF result.

---

## PRE-FLIGHT

1. Read `steps/ModelBrowserPopup.svelte` — understand existing HF search logic (it stays as reference, but rendering moves inline)
2. Read `runes/search.runes.svelte.ts` — FULL FILE. Understand: `setQuery()`, `results`, `searching`, `error`
3. Read `services/search.service.ts` — understand `searchHuggingFace(query, limit)` signature
4. GREP `ModelBrowserPopup` — list all files that reference it (should be 0 after ML-04 removed it from ModelLoaderStep)
5. Read `modelsState.userSubsystems` — understand the Record<string, SlotInfo[]> shape

---

## FILE 1: CREATE `steps/HuggingFaceSearch.svelte`

### Purpose

Inline section rendered below slot cards in SlotAssignmentPanel. NOT a popup. NOT a modal. Renders in the normal document flow.

### Component contract:

```typescript
interface Props {
    onDownload: (repoId: string, filename: string, targetSlot: string) => Promise<void>;
}
```

### Key behavior:

- Search input: text-base, full width, debounced 500ms
- On search: calls `searchState.setQuery(query)` (existing rune)
- Results as ColdLight Cards:
  - Model name + author — text-base font-bold
  - Downloads count + likes — text-sm muted (from `result.downloads`, `result.likes`)
  - Description first 150 chars — text-sm muted
  - GGUF file rows inside card:
    - Filename, quant Badge (from `infer_quant_from_filename` equivalent), size Badge
    - VRAM estimate: `formatMb(fileSizeMb)` (rough: file size ≈ VRAM for GGUF)
    - Fit indicator dot using `hardwareState.fitForModel(fileSizeMb)`
    - "Download" Button per file — on click, shows inline slot picker (which slot?), then calls `onDownload(repoId, filename, selectedSlot)`
- Slot picker for download target: simple inline list of user slots, not a dropdown
- "Load More" button at bottom — calls search with increased limit
- Empty state: "No results — try a different search"
- Loading state: ColdLight Spinner + "Searching..."
- Error state: raw error message in text-sm

### Scoped CSS:

```css
<style>
.hf-result-card {
    transition: border-color 0.2s ease;
}
.hf-result-card:hover {
    border-color: var(--accent-teal-main);
}
.gguf-row:hover {
    background: oklch(0.2 0.01 220 / 0.3);
}
</style>
```

### Text sizes:
- Search input: text-base
- Section header "Search HuggingFace": text-lg font-bold
- Model name: text-base font-bold
- Author, downloads, description: text-sm
- GGUF filename, size, quant: text-sm
- Buttons: text-sm

---

## FILE 2: MODIFY `steps/SlotAssignmentPanel.svelte`

### Change 1: Add cross-link readiness bar

At the TOP of the component, before slot cards, render a readiness summary:

```svelte
<!-- Subsystem Readiness -->
<div class="flex gap-4 items-center flex-wrap mb-4">
    {#each orderedSubsystems as sub (sub.key)}
        {@const allAssigned = sub.slots.every(s => s.assigned_model_id)}
        {@const anyLoaded = sub.slots.some(s => isInferenceReady(modelsState.statuses[s.id] ?? { type: "cold" }))}
        <div class="flex items-center gap-1.5">
            <div
                class="w-2.5 h-2.5 rounded-full"
                style="background: {allAssigned ? (anyLoaded ? 'var(--signal-success)' : 'var(--accent-teal-main)') : 'var(--signal-error)'};"
            ></div>
            <Text size="sm" color={allAssigned ? "primary" : "muted"}>
                {sub.label}
            </Text>
        </div>
    {/each}
</div>
```

Legend:
- Green filled dot = all slots assigned AND at least one loaded
- Teal dot = all slots assigned but none loaded yet
- Red dot = one or more slots unassigned

### Change 2: Add HuggingFaceSearch at bottom

After the bulk actions section, add:

```svelte
<Separator class="my-6" />
<HuggingFaceSearch
    onDownload={async (repoId, filename, targetSlot) => {
        const rec: ModelRec = {
            name: filename.replace(/\.gguf$/i, "").replace(/-/g, " "),
            purpose: "",
            slot: targetSlot as SlotId,
            sizeMb: 0,
            vramMb: 0,
            repo: repoId,
            file: filename,
            device: "any",
        };
        await downloadAndAssign(rec);
    }}
/>
```

### Change 3: Remove any remaining ModelBrowserPopup references

GREP and remove if any survived ML-04.

---

## VERIFICATION CHECKLIST

### After creating HuggingFaceSearch.svelte:

- [ ] **Re-read the FULL file** — confirm:
  - No floating layers (`fixed`, `absolute`, `z-50`, `portal`) — GREP, 0 results
  - No text-xs — GREP, 0 results
  - Search input is text-base
  - ColdLight components used: Card, Badge, Spinner, Text, Button, Separator
  - `renderForge()` used for result cards
  - Slot picker for download target is inline list, not dropdown
  - "Load More" button present
  - Loading/error/empty states all handled
- [ ] **Confirm imports** — `searchState` imported from runes, `hardwareState` imported for fit check

### After modifying SlotAssignmentPanel.svelte:

- [ ] **Re-read readiness bar section** — confirm per-subsystem dot rendering with correct color logic
- [ ] **Re-read HuggingFaceSearch integration** — confirm it's after bulk actions, after Separator
- [ ] **GREP `ModelBrowserPopup`** in entire models domain — 0 results

### Compilation:

- [ ] `pnpm svelte-check` — **PASTE the COMPLETED line**. `0 ERRORS`.
- [ ] **State warning count and reasons**

### Functional:

- [ ] Readiness bar shows per-subsystem status (dots match assigned/loaded state)
- [ ] HF search section visible inline below slot cards (no scroll-to needed on first load)
- [ ] Type search query → results appear after debounce
- [ ] Click Download on a GGUF file → slot picker shows → select slot → download starts with progress
- [ ] "Load More" shows additional results
