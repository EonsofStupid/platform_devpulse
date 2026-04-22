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

# Sprint 5: Rust — Import Router + Symlink Support

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 1 Rust modified, 2 TS modified |
| **Depends on** | Sprint 3 (ImportPrompt UI exists) |

---

## PRE-FLIGHT

1. Read the FULL `import_local_model` function in `src-tauri/src/commands/models/mod.rs` (lines 582-632)
2. Confirm current signature: `fn(state: State<'_, PlatformState>) -> Result<String, String>`
3. Confirm current behavior: hardcodes `data_dir.join("models").join("chat")` (line 613)
4. Read `download.service.ts` — confirm `importLocalModel()` calls `commands.importLocalModel()` with no args
5. Read the specta macro usage — `#[tauri::command]` + `#[specta::specta]` on the function

---

## FILE 1 (MODIFY): `src-tauri/src/commands/models/mod.rs`

**Current function (lines 582-632):**
```rust
#[tauri::command]
#[specta::specta]
pub async fn import_local_model(
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    // ... opens file dialog, copies to models/chat/
}
```

**New signature:**
```rust
#[tauri::command]
#[specta::specta]
pub async fn import_local_model(
    state: State<'_, PlatformState>,
    target_slot: Option<String>,
    import_mode: Option<String>,
) -> Result<String, String> {
```

**Changes to function body:**

### 1. Routing (replace hardcoded `models/chat/`)

Replace line 613:
```rust
let dest_dir = data_dir.join("models").join("chat");
```

With:
```rust
// Route to correct subdirectory based on target slot
let subdir = match target_slot.as_deref() {
    Some(slot) => {
        let prefix = slot.split('.').next().unwrap_or("chat");
        match prefix {
            "chat" | "minion" => "chat",
            "voice" => "voice",
            "rag" => "rag",
            "vision" => "vision",
            _ => "chat",
        }
    }
    None => "chat",
};
let dest_dir = data_dir.join("models").join(subdir);
```

### 2. Import mode (replace hardcoded `std::fs::copy`)

Replace lines 623-625:
```rust
std::fs::copy(&source_path, &dest_path)
    .map_err(|e| format!("Failed to copy model: {e}"))?;
```

With:
```rust
let mode = import_mode.as_deref().unwrap_or("copy");
match mode {
    "symlink" => {
        #[cfg(target_os = "windows")]
        {
            std::os::windows::fs::symlink_file(&source_path, &dest_path)
                .map_err(|e| format!(
                    "Failed to create symlink (Windows may require admin privileges): {e}"
                ))?;
        }
        #[cfg(not(target_os = "windows"))]
        {
            std::os::unix::fs::symlink(&source_path, &dest_path)
                .map_err(|e| format!("Failed to create symlink: {e}"))?;
        }
        tracing::info!(
            source = %source_path.display(),
            dest = %dest_path.display(),
            "Created symlink for model"
        );
    }
    _ => {
        // Default: copy
        std::fs::copy(&source_path, &dest_path)
            .map_err(|e| format!("Failed to copy model: {e}"))?;
        tracing::info!(
            source = %source_path.display(),
            dest = %dest_path.display(),
            "Copied model file"
        );
    }
}
```

### 3. Update error message for existing file

Replace line 620-621:
```rust
return Err(format!("Model '{filename}' already exists in models/chat/"));
```

With:
```rust
return Err(format!("Model '{filename}' already exists in models/{subdir}/"));
```

### 4. Update create_dir_all

Replace line 616:
```rust
std::fs::create_dir_all(&dest_dir).map_err(|e| format!("Failed to create models/chat/: {e}"))?;
```

With:
```rust
std::fs::create_dir_all(&dest_dir)
    .map_err(|e| format!("Failed to create models/{subdir}/: {e}"))?;
```

**Full diff summary:**
- Line 584: Add `target_slot: Option<String>, import_mode: Option<String>` params
- Line 613: Replace hardcoded "chat" with slot-routed subdir
- Line 616: Update error message
- Line 620-621: Update error message  
- Lines 623-625: Replace `std::fs::copy` with mode-dependent copy/symlink
- Tracing: update log messages to include subdir and mode

**Verification:**
- [ ] Owner runs: `cargo check -p devpulse_desktop_backend` — 0 errors
- [ ] New params are `Option<String>` — backwards compatible (existing callers pass nothing)
- [ ] Slot routing matches TS-side `slotToSubdir()` EXACTLY:
  - chat/minion → "chat"
  - voice → "voice"
  - rag → "rag"
  - vision → "vision"
  - unknown → "chat"
- [ ] Symlink uses correct OS-specific API: `symlink_file` on Windows, `symlink` on Unix
- [ ] Symlink error message mentions admin privileges on Windows
- [ ] Copy error preserves the OS error (disk full, permission denied, etc.)
- [ ] `create_dir_all` called BEFORE copy/symlink — creates subdir if it doesn't exist
- [ ] Re-read the FULL function after editing to confirm all changes applied correctly
- [ ] No `unwrap()` anywhere — all errors use `?` or explicit `map_err`

---

## FILE 2 (MODIFY): `services/download.service.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/services/download.service.ts`

**Current function (line 63-74):**
```typescript
export async function importLocalModel(): Promise<string> {
    logInfo("models.download", "Opening file picker for local model import...");
    try {
        const filename = unwrap(await commands.importLocalModel());
        // ...
```

**New signature:**
```typescript
export async function importLocalModel(
    targetSlot?: string,
    importMode?: string,
): Promise<string> {
```

**Change body:**
The specta bindings won't have the new params until `cargo build` runs. Use raw `invoke` until then:

```typescript
export async function importLocalModel(
    targetSlot?: string,
    importMode?: string,
): Promise<string> {
    logInfo("models.download", `Importing model for slot=${targetSlot ?? "chat"} mode=${importMode ?? "copy"}`);
    try {
        // Use raw invoke until specta bindings regenerate with new params
        const { invoke } = await import("@tauri-apps/api/core");
        const filename = await invoke<string>("import_local_model", {
            targetSlot: targetSlot ?? null,
            importMode: importMode ?? null,
        });
        logInfo("models.download", `Local model imported: ${filename}`);
        return filename;
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logError("models.download", `Import FAILED: ${msg}`);
        throw new Error(`Import failed: ${msg}`);
    }
}
```

**Verification:**
- [ ] Function still works when called with NO args (backwards compatible)
- [ ] `invoke` parameter names match Rust: `targetSlot` → `target_slot` (Tauri auto-converts camelCase to snake_case for specta commands)
  - **WAIT:** Tauri v2 invoke does NOT auto-convert. Parameter names must match Rust exactly. Use `target_slot` and `import_mode` in the invoke call.
  
**CORRECTED:**
```typescript
const filename = await invoke<string>("import_local_model", {
    target_slot: targetSlot ?? null,
    import_mode: importMode ?? null,
});
```

- [ ] Owner runs: `pnpm svelte-check` — 0 errors
- [ ] Existing callers of `importLocalModel()` still work (no args = defaults)

---

## FILE 3 (MODIFY): `features/setup-wizard/steps/ImportPrompt.svelte`

**Update the `handleImport` function to pass real params:**

Replace the TODO workaround from Sprint 3:
```typescript
async function handleImport(): Promise<void> {
    importing = true;
    error = null;
    try {
        const { importLocalModel } = await import("../../../services/download.service.js");
        const filename = await importLocalModel(targetSlot, importMode);
        onComplete(filename);
    } catch (e) {
        error = e instanceof Error ? e.message : String(e);
    } finally {
        importing = false;
    }
}
```

**Remove the TODO comment** — Sprint 5 is now complete.

**Verification:**
- [ ] `importLocalModel(targetSlot, importMode)` passes both params
- [ ] `targetSlot` comes from the `targetSlot` prop
- [ ] `importMode` comes from the `$state` radio selection
- [ ] Error displayed raw in UI

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions.

### Phase A: Rust File Verification

- [ ] **Re-read the FULL import_local_model function after editing** — not just the changed lines, the ENTIRE function from `pub async fn` to closing `}`
- [ ] **New params are Option<String>** — `target_slot: Option<String>`, `import_mode: Option<String>`. Confirm specta derives work with Option.
- [ ] **Slot routing matches TS exactly** — chat/minion→"chat", voice→"voice", rag→"rag", vision→"vision", unknown→"chat". Compare against import-router.ts line by line.
- [ ] **Symlink uses correct OS API** — `#[cfg(target_os = "windows")]` uses `std::os::windows::fs::symlink_file`. `#[cfg(not(target_os = "windows"))]` uses `std::os::unix::fs::symlink`.
- [ ] **Error messages include context** — symlink failure on Windows mentions "admin privileges". Copy failure includes the OS error. Existing file error includes the subdirectory name.
- [ ] **create_dir_all before copy/symlink** — subdirectory created if not exists
- [ ] **No unwrap()** — grep for `.unwrap()` in the modified function. Must be zero.
- [ ] **Tracing updated** — log messages include subdirectory and mode

### Phase B: TypeScript File Verification

- [ ] **download.service.ts** — `importLocalModel` accepts optional `targetSlot` and `importMode` params
- [ ] **invoke param names match Rust** — uses `target_slot` and `import_mode` (snake_case, matching Rust). NOT camelCase.
- [ ] **Backwards compatible** — calling `importLocalModel()` with no args still works (defaults to null→"chat" + null→"copy")
- [ ] **ImportPrompt.svelte** — `handleImport` passes `targetSlot` and `importMode` to `importLocalModel`. TODO comment REMOVED.

### Phase C: Cross-Language Consistency

- [ ] **Routing map identical** — Rust `match prefix` and TS `slotToSubdir` produce the SAME output for every input. Test mentally: "voice.stt" → Rust gets "voice", TS gets "voice". "minion.shared" → Rust gets "chat", TS gets "chat". ALL 5 prefixes checked.

### Phase D: Cargo Check (MANDATORY)

```bash
cargo check -p devpulse_desktop_backend
```

- [ ] **Zero errors** — if specta derive fails with Option<String>, check if `#[specta(optional)]` is needed
- [ ] **Zero warnings from our code** — filter for models/mod.rs warnings
- [ ] **Read FULL output** — do not assume clean from exit code alone

### Phase E: Biome + svelte-check (MANDATORY)

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/ --diagnostic-level=warn
```

- [ ] **Zero errors, zero warnings**

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors from our files**

### Phase F: Faithfulness Check

- [ ] **Import to voice.stt slot** — mentally trace: `importLocalModel("voice.stt", "copy")` → invoke sends `target_slot: "voice.stt"` → Rust splits to prefix "voice" → joins to `models/voice/` → copies file there. Correct?
- [ ] **Import with symlink on Windows** — `importLocalModel("chat.brain", "symlink")` → Rust calls `std::os::windows::fs::symlink_file`. If no admin → error message mentions admin. Correct?
- [ ] **Default behavior preserved** — `importLocalModel()` with no args → `target_slot: null` → Rust defaults to "chat" → `models/chat/`. Same as before.

### Phase G: Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **Sprint 3 ImportPrompt TODO removed** — confirm no TODO comments remain referencing Sprint 5

**If ANY checkbox unchecked, do NOT proceed to Sprint 6.**
