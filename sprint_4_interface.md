# Sprint 4: The Interface (Layer 4)

**Status:** PROPOSED (Review Needed)
**Goal:** Implement the "Skin" - User Interaction and Screen Capture.

## Layer 4: INTERFACE
**Apps:** `desktop` (Product), `lab` (Dev Tools)
**Modules:** `wired_front` (Capture)

### App: `desktop`
**Crate:** `desktop`
**Dependencies:** `engine`, `orchestrator` (optional/lightweight), `tauri`
**Philosophy:** "Dumb Terminal". Emits Signals, renders View Models.

**Proposed Structure:**
- `src/main.rs`: Setup Tauri, init `engine`.
- `src/commands.rs`: expose `emit_signal` to frontend.
- `src/view_models`: Structs for UI state (derived from Signals).

### App: `lab`
**Crate:** `lab`
**Dependencies:** `engine`, `orchestrator` (full), `duckdb` (enabled)
**Philosophy:** Full introspection.

**Proposed Features:**
- `SignalInspector`: View live signal bus.
- `DbExplorer`: Direct query to LibSQL/DuckDB.
- `TraceViewer`: Embedded Tracy/Tracing UI.

### Module: `wired_front` (Capture)
**Location:** `crates/wired_front` (or inside `desktop`?) -> *Need User Decision*
**Proposed Types:**
```rust
pub struct CaptureSession {
    pub sources: Vec<Monitor>,
    pub region: Option<Rect>,
}

pub struct CaptureEngine {
    // Wraps `scap`
    recorder: scap::Recorder,
}

impl CaptureEngine {
    pub fn start_monitor(&self, monitor_id: usize) -> Result<Stream>;
    pub fn snap_region(&self, rect: Rect) -> Result<DynamicImage>;
}
```

## Review Checklist
- [ ] Where should `wired_front` live? A separate crate or part of desktop?
- [ ] Does `desktop` need direct access to `orchestrator` or only via `engine`?
- [ ] Are the Capture struct names (`CaptureSession`) aligned with vision?
