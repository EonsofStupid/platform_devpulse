# Sprint 1: The Foundation (Workspace & Init)

> **Status:** READY FOR EXECUTION
> **Goal:** A Compilable Rust Workspace and an Installable Frontend (Fixing the `ENOENT` error).
> **Verification Criteria:**
> 1. `cargo build` succeeds (Root + Members).
> 2. `cd interfaces/desktop/src && npm install` succeeds.

## 1. The Workspace Root (Rust)
**File:** `d:/localdev/platform_devpulse/Cargo.toml`
> **Action:** Write the Root Manifest with strict dependencies.

```toml
[workspace]
resolver = "2"
members = [
    "kernel/devpulse-maestro",
    "systems/devpulse-engine",
    "systems/*", 
    "interfaces/*",
    "xtask"
]

[workspace.dependencies]
# Core
serde = { version = "1.0", features = ["derive"] }
uuid = { version = "1.10", features = ["v7", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.40", features = ["full"] }

# Type Sync
ts-rs = "10.0"

# Platform Data (The "Muscle")
libsql = "0.6"
duckdb = "1.1"
moka = "0.12"
fjall = "2.0" 
wal = { git = "https://github.com/EonsofStupid/wal" }
rro = { git = "https://github.com/EonsofStupid/rro" }
tar-rs = { git = "https://github.com/EonsofStupid/tar-rs" }

# AI & Voice (The "Senses")
candle-core = "0.8"
candle-transformers = "0.8" 
outlines-core = "0.1"
kokoros = { git = "https://github.com/EonsofStupid/Kokoros" }
ort = "2.0" 

# Ops
xshell = "0.2"
clap = { version = "4.5", features = ["derive"] }
cargo_metadata = "0.18"
fs_extra = "1.3"
```

## 2. The Frontend Initialization (Node/Svelte)
**Path:** `d:/localdev/platform_devpulse/interfaces/desktop/src`
> **CRITICAL FIX**: This creates the missing `package.json` so `npm install` works.

**File:** `d:/localdev/platform_devpulse/interfaces/desktop/src/package.json`
```json
{
  "name": "devpulse-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@tsconfig/svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^3.6.0",
    "tslib": "^2.4.1",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0-rc",
    "@tauri-apps/plugin-shell": "^2.0.0-rc",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0" 
  }
}
```

## 3. The Backend Structure (0-Byte Skeleton)
> **Action:** Create the required skeleton Cargo.toml files to make the workspace valid.
- `kernel/devpulse-maestro/Cargo.toml`
- `systems/devpulse-engine/Cargo.toml`
- `xtask/Cargo.toml`
