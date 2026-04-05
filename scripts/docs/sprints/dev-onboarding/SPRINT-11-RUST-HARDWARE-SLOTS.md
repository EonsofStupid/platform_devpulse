# Sprint 11: Rust — HardwareInfo Fields + SlotInfo Enrichment + voice.brain

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2) |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 10 (SSOT alignment — TS types corrected) |
| **Files** | 1 TOML, 2 Rust modified, 1 Svelte modified |

---

## PRE-FLIGHT

1. Confirm Sprint 10 is complete — `SlotId`, `ModelStatus`, `AllocationMode` types aligned
2. Read `src-tauri/src/commands/models/mod.rs` — HardwareInfo struct (line 72) and get_hardware_metrics command
3. Read `kernel/model-loader/Cargo.toml` — confirm nvml-wrapper dep
4. Read `platform.default.toml` — current slot list

---

## CHANGES

### 1. `platform.default.toml` — Add voice.brain slot

```toml
[[services.system.model_loader.slots]]
id = "voice.brain"
label = "Voice Conversation"
capability = "TextGeneration"
preferred_device = "Cpu"
loading = "Hot"
fallback = "minion.escalation"
source_tier = "UserManaged"
```

### 2. `HardwareInfo` struct — Add 5 fields

```rust
pub cpu_threads: Option<u32>,
pub disk_free_mb: Option<u64>,
pub cuda_version: Option<String>,
pub nvml_available: bool,
pub model_dir: String,
```

Populate using sysinfo (cpu_threads, disk_free_mb) and nvml-wrapper (cuda_version, nvml_available). model_dir from platform data_dir.

### 3. `SlotInfo` struct — Add 3 view fields

```rust
pub architecture: Option<String>,
pub context_length: Option<u32>,
pub backend: Option<String>,
```

Assembled in get_slots from assigned model's registry entry.

### 4. `HardwareDetectionStep.svelte` — Display new fields

Add rows for cpu_threads, disk_free_mb, cuda_version, nvml_available, model_dir. Fields that don't exist in the response show nothing (not faked).

---

## MANDATORY EXECUTION CHECKLIST

### Phase A: TOML
- [ ] voice.brain slot added, no duplicate IDs
- [ ] Fallback chain: voice.brain → minion.escalation → chat.brain

### Phase B: Rust Structs
- [ ] HardwareInfo has 5 new fields, all Option except nvml_available (bool) and model_dir (String)
- [ ] SlotInfo has 3 new fields, all Option
- [ ] No unwrap() — all nvml/sysinfo calls use match/map_err
- [ ] nvml-wrapper init handles missing NVIDIA gracefully

### Phase C: Compilation
```bash
cargo check -p devpulse_desktop_backend
```
- [ ] Zero errors, zero warnings from our code

### Phase D: Frontend
- [ ] HardwareDetectionStep displays all available fields
- [ ] Missing fields (null from Rust) → not shown (not faked)
- [ ] biome: 0 errors, 0 warnings
- [ ] svelte-check: 0 errors, 0 warnings

### Phase E: Sprint Done Gate
- [ ] ALL above checked
- [ ] Sprint doc status → COMPLETE

**If ANY checkbox unchecked, sprint is NOT done.**
