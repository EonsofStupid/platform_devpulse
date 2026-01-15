# Master Structural Scaffolding Specification (Final)

> **Status**: PRODUCTION (Ready for Execution)
> **Goal**: Define the "Absolute Law" and **Exact Folder Structure** before code generation.

# **Global Vision: The Meistro Philosophy**
**Founder**: Jesse Hall
**Vision**: "The Intelligent Driver and Quality Gate."
**Philosophy**: "Honest Orchestration."
**Slogan**: "Build. Share. Ship. Harness AI with Devpulse."
**Target Audience**: "Layman First." (Guardrails > Freedom).
**Licensing**: `https://devpulse.app` (The Trust Source).
**Community**: `https://angryviber.com` (The Network).
**Constraint**: "Stop the Learning Tax." (First-Try Success).


## 1. The Workspace Root (The Foundation)
**File**: `Cargo.toml` (Root)
> **Strategy**: Unified Dependencies (D1).
> **Facade Verdict**: **IMPLEMENT NOW**. Injecting a facade later is a refactoring nightmare. We pay the tax of strict boundaries now for infinite scaling later.

```toml
[workspace]
resolver = "2"
members = [
    "kernel/devpulse-maestro",
    "systems/devpulse-engine",
    "systems/*", 
    "interfaces/*",
    "xtask" # The Build Orchestrator
    # EXCLUDED: devpulse_lab (Strictly External)
]

[workspace.dependencies]
# Core
serde = { version = "1.0", features = ["derive"] }
uuid = { version = "1.10", features = ["v7", "serde"] } # 2026 Stable
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.40", features = ["full"] }

# Type Sync (D2)
ts-rs = "10.0" # or specta

# Platform Data (The "Muscle")
libsql = "0.6"
duckdb = "1.1"
moka = "0.12"
fjall = "2.0" # LSM-Tree Storage

# AI & Voice (The "Senses")
candle-core = "0.8"
outlines-core = "0.1"
kokoros = "0.1" # TTS

# Ops (xtask Support)
xshell = "0.2" # Shell scripting in Rust
clap = { version = "4.5", features = ["derive"] } # CLI parsing
cargo_metadata = "0.18" # Project introspection
fs_extra = "1.3" # File manipulation
```

## 2. Backend Architecture (Separation of Concerns)

### 2.1 Kernel: `devpulse-maestro` (The IP)
**Path**: `kernel/devpulse-maestro`
**Role**: Proprietary Logic (The Brain).
**Strictness**: `deny(warnings)` (D3).

### 2.2 Systems: `devpulse-engine` (The Facade)
**Path**: `systems/devpulse-engine`
**Role**: Public Types & Translation Layer (The Muscle).
**Requirement**:
- [ ] **README.md**: Document the `Signal` pattern (Header + Kind).
- [ ] **Type Export**: `#[derive(TS)]` on all public signals.

---

## 3. Desktop Architecture (The World)
**Location**: `interfaces/desktop`

### 3.1 `src-tauri` (Rust Backend)
> **Rule**: Functional Command Contexts. Backend is capability-driven, not UI-driven.
> **Structure**: `src/commands/{context}`.

#### `src/lib.rs` (Entry)
```rust
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Chat & Interactions
            commands::chat::send_message,
            commands::chat::interactions::post_reaction,
            
            // Workspaces
            commands::devmaestro::get_status,
            commands::thinkmaestro::create_canvas,
            
            // Media
            commands::wiredfront::connect_peer,

            // System
            commands::sys::config::get_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### `src/commands/mod.rs`
```rust
pub mod chat;
pub mod devmaestro;
pub mod thinkmaestro;
pub mod wiredfront;
pub mod sys;
```

#### `src/commands/devmaestro/mod.rs`
```rust
// Future: pub mod debugging;
// Future: pub mod execution;
pub fn get_status() {} 
```

#### `src/commands/wiredfront/mod.rs`
```rust
// Future: pub mod broadcasting;
// Future: pub mod capture;
pub fn connect_peer() {}
```

#### `src/commands/thinkmaestro/mod.rs`
```rust
pub fn create_canvas() {}
```

#### `src/commands/chat/mod.rs`
```rust
pub mod interactions; // Reactions, slash commands
pub mod history;
```

#### `src/commands/sys/mod.rs`
```rust
pub mod config;
pub mod logger;
pub mod guard; // Hybrid SaaS Licensing & Feature Gating
```


### 3.2 Frontend (Svelte 5 + Runes)
**Root**: `src/lib`

> **State Strategy (The Law)**:
> 1.  **Global**: `Zustand` (Cross-Domain signals, User Session).
> 2.  **Component/Complex**: `Jotai` (Atoms for the Glass Menu, Animation states).
> 3.  **Local**: `Runes` (Trickle down reactivity).

#### `layouts/app/` (The Glass Shell)
- `Frame.svelte` (Main Container)
- `Sidebar.svelte`
    > **UX Goal**: "GlassHub". No scrollbars.
    > **Behavior**: Click "DevPulse" -> Glass Overlay. Seamless mouse/keyboard nav.
- `TopBar.svelte`

#### `layouts/chat/` (Hub: Communication)
- `Frame.svelte`
- `ChatDashboard.svelte` (Default View)
- `panels/`
    - `ContextPanel.svelte`
    - `HistoryPanel.svelte`
- `overlays/`
    - `CommandPalette.svelte`
    - `ModeSelector.svelte`

#### `layouts/app/` (Standard Shell)
- `Frame.svelte`
- `TopBar.svelte`
- `Sidebar.svelte`

#### `domains/` (Bounded Contexts)
- **`devmaestro/`** (Production IDE View)
    - `DevmaestroFrame.svelte`
    - `DevmaestroDashboard.svelte`
- **`thinkmaestro/`** (planning, research testing, learning, ideations)
    - `ThinkmaestroFrame.svelte`
    - `Canvas.svelte`
- **`wiredfront/`** (Media Command Center)
    > **Role**: All things Image, Video, Broadcast.
    - `WiredfrontFrame.svelte`
    - `ConnectionHub.svelte`
    - `ViziWiziEditor.svelte`
    - `MediaGallery.svelte`
- **`system/`** (Config)

---

## 4. The Lab (The Observer)
**Location**: `../devpulse_lab` (Sister Repository)

**Role**: Pure UI Observer.
**Tech**: Svelte + Tauri Extremely heavy analyzer and observer for tests baseline configuration
**Behavior**:
-   **Dependencies**: Own `libsql`, `duckdb` (for storing analysis).
-   **Observability**: Connects to Platform's `vfs` (embedded DBs) via read-only replication or socket. **It watches the Platform's brain.**

## 5. Migration Strategy (The Translation)
> **Senior Protocol**: We do not just "copy-paste". We **translate** legacy patterns to the new Standard.

| Legacy Source (`alpha`) | New Target (`interfaces/desktop`) | Translation Action |
| :--- | :--- | :--- |
| `bad_desktop/.../wiredfront` | `domains/wiredfront` | **Refactor**: Convert Stores to Runes. Strict Signal I/O. |
| `bad_desktop/.../pixvix` | `domains/wiredfront` (Merged) | **Integrate**: PixVix becomes the "Overlay Mode" of WiredFront. |
| `bad_desktop/.../overmind` | `domains/thinkmaestro` | **Rewrite**: Old canvas logic -> New `ThinkSpace` Canvas. |
| `scripts/` | `systems/xtask` | **Port**: Convert Python/Shell scripts to safe Rust `xtask` binaries. |

## 6. Execution Plan (The "Blank" Scaffold)
> **Senior Protocol**: We generate **ONLY** the folder structure and empty files (0 bytes) first.
> **Why?**: This allows the Architect (You) to review the exact hierarchy in VS Code.

If promoted to `PRODUCTION_PLANNING.md`, I will execute the following **EXACT** file creation:

### 5.1 Backend Skeleton
- [ ] `Cargo.toml` (Root) -> *Content as defined in Section 1.*
- [ ] `kernel/devpulse-maestro/Cargo.toml` -> *Content as defined in Section 2.1.*
- [ ] `systems/devpulse-engine/Cargo.toml` -> *Content as defined in Section 2.2.*
- [ ] `systems/devpulse-engine/Cargo.toml` -> *Content as defined in Section 2.2.*

### 5.2 Build Automation (The Orchestrator)
**Path**: `xtask/` (Root Level)
> **Role**: "Its own thing". Runs the project.
> **Dev Mode**: `cargo xtask run-dev` -> Starts **Platform** + **Lab** (simultaneously).
> **Release Mode**: `cargo xtask test-release` -> Strict testing.

- [ ] `xtask/Cargo.toml` (Package: `xtask`)
- [ ] `xtask/src/main.rs` (The Build Brain)

### 5.3 Desktop Skeleton (0-Byte Files)
> I will creating the following empty files for you to review:
- [ ] `interfaces/desktop/src-tauri/src/main.rs`
- [ ] `interfaces/desktop/src-tauri/src/lib.rs`
- [ ] `interfaces/desktop/src-tauri/src/commands/mod.rs`
- [ ] `interfaces/desktop/src-tauri/src/commands/devmaestro/mod.rs`
- [ ] `interfaces/desktop/src-tauri/src/commands/thinkmaestro/mod.rs`
- [ ] `interfaces/desktop/src-tauri/src/commands/wiredfront/mod.rs`
- [ ] `interfaces/desktop/src-tauri/src/commands/chat/{mod,interactions}.rs`
- [ ] `interfaces/desktop/src-tauri/src/commands/sys/{mod,config,logger,guard}.rs`
- [ ] `interfaces/desktop/src/lib/layouts/chat/ChatDashboard.svelte`
- [ ] `interfaces/desktop/src/lib/layouts/chat/{Frame,TopBar,LeftSidebar,QuickMenu}.svelte`
- [ ] `interfaces/desktop/src/lib/layouts/chat/panels/{ContextPanel,HistoryPanel}.svelte`
- [ ] `interfaces/desktop/src/lib/layouts/chat/overlays/{CommandPalette,ModeSelector}.svelte`
- [ ] `interfaces/desktop/src/lib/domains/devmaestro/{DevmaestroFrame,DevDashboard}.svelte`
- [ ] `interfaces/desktop/src/lib/domains/thinkmaestro/{ThinkmaestroFrame,ThinkDashboard}.svelte`
- [ ] `interfaces/desktop/src/lib/domains/thinkmaestro/Canvas.svelte`
- [ ] `interfaces/desktop/src/lib/domains/wiredfront/{WiredfrontFrame,WiredDashboard}.svelte`
- [ ] `interfaces/desktop/src/lib/domains/wiredfront/ConnectionHub.svelte`
- [ ] `interfaces/desktop/src/lib/domains/wiredfront/ViziWiziEditor.svelte`
- [ ] `interfaces/desktop/src/lib/domains/wiredfront/MediaGallery.svelte`

### 5.3 Lab Skeleton (Sister Repo)
> **Constraint**: `../devpulse_lab` (External Directory).
> **STATUS**: **NOT IN WORKSPACE**. **NOT IN PRODUCT BINARY**.

#### **Lab Backend**
- [ ] `../devpulse_lab/src-tauri/Cargo.toml`
- [ ] `../devpulse_lab/src-tauri/src/main.rs`
- [ ] `../devpulse_lab/src-tauri/src/lib.rs`

#### **Lab Frontend (Svelte 5)**
**Root**: `../devpulse_lab/src`
- [ ] `../devpulse_lab/package.json`
- [ ] `../devpulse_lab/src/app.html`
**Layouts**:
- [ ] `../devpulse_lab/src/lib/layouts/LabFrame.svelte` (Observer UI Shell)
- [ ] `../devpulse_lab/src/lib/layouts/StatusTicker.svelte`
**Analyzers (Heavy Logic)**:
- [ ] `../devpulse_lab/src/lib/analyzers/SignalGraph.svelte`
- [ ] `../devpulse_lab/src/lib/analyzers/PacketInspector.svelte`
- [ ] `../devpulse_lab/src/lib/analyzers/MetricWaterfall.svelte`
**Observers**:
- [ ] `../devpulse_lab/src/lib/observers/PlatformConnection.svelte` (Socket/Pipe)
- [ ] `../devpulse_lab/src/lib/observers/DatabaseWatcher.svelte` (LibSQL/DuckDB)
**Dashboard**:
- [ ] `../devpulse_lab/src/lib/dashboard/LabDashboard.svelte`
