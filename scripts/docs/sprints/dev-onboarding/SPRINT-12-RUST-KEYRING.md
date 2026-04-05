# Sprint 12: Rust — keyring API Key Storage

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2) |
| **Status** | `PLANNED` |
| **Depends on** | Nothing — independent |
| **New dep** | `keyring = "3"` in src-tauri/Cargo.toml |
| **Files** | 1 Cargo.toml, 1 new Rust module, 1 Rust modified (lib.rs) |

---

## CHANGES

### 1. Add `keyring = "3"` to `src-tauri/Cargo.toml`

### 2. Create `src-tauri/src/commands/credentials/mod.rs`

4 commands:
- `store_api_key(provider: ApiProvider, key: String)` — stores via keyring Entry
- `get_api_key(provider: ApiProvider)` → `Option<String>` — retrieves actual key (backend only)
- `delete_api_key(provider: ApiProvider)` — deletes from keychain
- `get_api_key_status()` → `Vec<ApiKeyStatus>` — returns stored/masked for each provider (safe for frontend)

`ApiProvider` enum: Anthropic, OpenAI. `ApiKeyStatus` struct: provider, stored, masked_preview.

All use `keyring::Entry::new("devpulse", &key_name)`. NoEntry → Ok(None) or Ok(()). No panic. No unwrap.

### 3. Register in `lib.rs` collect_commands

---

## MANDATORY EXECUTION CHECKLIST

- [ ] keyring = "3" in Cargo.toml
- [ ] 4 commands with #[tauri::command] + #[specta::specta]
- [ ] API keys NEVER written to filesystem
- [ ] get_api_key_status returns masked preview, NEVER actual key
- [ ] NoEntry handled gracefully (not error)
- [ ] cargo check: 0 errors, 0 warnings
- [ ] Commands registered in lib.rs

**If ANY checkbox unchecked, sprint is NOT done.**
