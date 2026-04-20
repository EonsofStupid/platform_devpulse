# SPRINT: Smoke Test — Onboarding + Knowledge

> **Goal**: Prove every authored system actually works by running it.
> **Owner**: EonsofStupid
> **Date**: 2026-04-19
> **Status**: READY FOR EXECUTION

---

## What This Sprint Proves

Every test below is a real executable check — not a manual "open the app and look."
Each test either passes or fails with a clear error. No ambiguity.

---

## Test 1: Knowledge JSON Parses Clean

**What**: All 5 embedded JSON artifacts parse into valid `KnowledgeEntry` structs.
**Where**: `kernel/devpulse-clyffy/src/cortex/knowledge/loader.rs`
**Type**: Rust unit test

```
cargo test -p devpulse-clyffy knowledge
```

### Assertions
- `load_manifest()` returns Ok with version "0.1.0"
- `load_all()` returns Ok with 32 entries (8 dyk + 6 kdrop + 5 frust + 5 insight + 8 gloss)
- Every entry has non-empty `id`, `category`, `added`
- Every entry's `entry_type` matches its id prefix (dyk-* = Dyk, gloss-* = Gloss, etc.)
- `content_hash()` returns non-empty string for every entry
- No duplicate IDs across all files

---

## Test 2: Knowledge Sync Upserts to LibSQL

**What**: `sync_to_libsql` writes entries and respects version fast-path.
**Where**: `kernel/devpulse-clyffy/src/cortex/knowledge/sync.rs`
**Type**: Rust integration test (needs libSQL adapter)

### Assertions
- First call: upserts all entries, returns count > 0
- Second call (same version): returns 0 (fast path)
- After sync: `SELECT COUNT(*) FROM knowledge_entries` matches entry count
- After sync: `SELECT config_json FROM knowledge_config WHERE user_id = 'system'` contains version "0.1.0"
- `knowledge_seen` table exists and is empty (no user interactions yet)

---

## Test 3: Knowledge Selector Returns Entries

**What**: `select_entry` returns a valid entry and records it in `knowledge_seen`.
**Where**: `kernel/devpulse-clyffy/src/cortex/knowledge/selector.rs`
**Type**: Rust integration test (needs synced libSQL)

### Assertions
- `select_entry(adapter, params)` with type=Dyk returns Some
- Returned entry has non-empty id, entry_type = "dyk", non-empty payload_json
- `SELECT COUNT(*) FROM knowledge_seen WHERE user_id = 'default'` is 1 after selection
- Calling again with 0s cooldown returns a different entry (random selection)
- `record_reaction(adapter, entry_id, "default", NotHelpful)` succeeds
- Next `select_entry` skips the not_helpful entry

---

## Test 4: Profile CRUD Against User DB

**What**: Profile commands create, read, update against the user relational store.
**Where**: `interfaces/desktop/src-tauri/src/commands/devpulse/profile.rs`
**Type**: Rust integration test (needs user libSQL with USER_SCHEMA)

### Assertions
- `ensure_profile(adapter)` on empty DB creates a row with display_name = "Developer"
- `ensure_profile(adapter)` on second call returns the same row (no duplicate)
- UPDATE with `display_name = "Jesse"` persists
- Re-read shows `display_name = "Jesse"`
- UPDATE with `email = ""` writes NULL (NULLIF behavior)
- `ensure_prefs(adapter, profile_id)` creates default preferences
- Preferences round-trip: update theme to "light", re-read shows "light"

---

## Test 5: Tauri Command Layer Compiles

**What**: The Tauri backend crate compiles with all new commands registered.
**Where**: `interfaces/desktop/src-tauri/`
**Type**: Compile check

```
cargo check -p devpulse_desktop_backend
```

### Assertions
- Zero errors
- Knowledge commands registered (get_knowledge_entry, record_knowledge_reaction)
- Profile commands registered (fetch_user_profile, update_user_profile, fetch_user_preferences, update_user_preferences)

---

## Test 6: Frontend TypeScript Compiles

**What**: All new Svelte/TS files pass type checking.
**Where**: `interfaces/desktop/`
**Type**: Type check

```
cd interfaces/desktop && pnpm check
```

### Assertions
- Zero errors from knowledge domain (util, data-access, index)
- Zero errors from settings page
- Zero errors from wizard overlay changes
- Zero errors from knowledge.types.ts type guards

---

## Test 7: Boot Sync Fires

**What**: The knowledge sync stage runs during platform boot.
**Where**: `systems/devpulse-engine/src/platform/boot/mod.rs`
**Type**: Integration test (boot the platform, check logs)

### Assertions
- Boot log contains "Knowledge sync" entry
- If user DB is fresh: log shows "synced N entries"
- If user DB already has version 0.1.0: log shows "up to date"
- No crash, no error — non-critical failure is logged but doesn't block boot

---

## Test 8: Wizard Draft State

**What**: Profile data entered in the wizard does NOT persist until Apply.
**Where**: `SetupWizardOverlay.svelte`
**Type**: Manual smoke test (or Playwright if wired)

### Steps
1. Fresh boot → wizard opens
2. Enter name "TestUser", email "test@test.com", level Intermediate
3. Click "Let's Go" → config view opens
4. DO NOT click "Apply and Launch Clyffy"
5. Close wizard (X button)
6. Check DB: profiles table should have default "Developer", NOT "TestUser"
7. Reopen wizard → enter same info → click "Apply and Launch Clyffy"
8. Check DB: profiles table now has "TestUser"

### Assertions
- Step 6: display_name = "Developer" (draft was not persisted)
- Step 8: display_name = "TestUser" (apply committed)

---

## Execution Order

1. Write Rust tests for Tests 1-4 (kernel + profile)
2. Run `cargo test -p devpulse-clyffy knowledge` (Tests 1-3)
3. Run `cargo check -p devpulse_desktop_backend` (Test 5)
4. Run `pnpm check` (Test 6)
5. Run integration boot test (Test 7)
6. Manual wizard draft test (Test 8)

Tests 1-4 are the priority. If they pass, the system is structurally sound.

---

## Files to Create

| File | Contains |
|------|----------|
| `kernel/devpulse-clyffy/src/cortex/knowledge/tests.rs` | Tests 1-3 (loader, sync, selector) |
| `interfaces/desktop/src-tauri/tests/profile_smoke.rs` | Test 4 (profile CRUD) |

---

## Pass Criteria

All 8 tests pass. No exceptions. No "it mostly works." Green or red.
