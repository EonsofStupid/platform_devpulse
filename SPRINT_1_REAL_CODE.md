# Sprint 1: Real Code Definition (Backend Fix)

> **Goal**: Replace 0-byte skeleton files with **Compilable, Functional Rust**.
> **Reason**: 0-byte files cause build failures. We need a working binary.

## 1. Entry Points

### `src-tauri/src/main.rs`
```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    devpulse_desktop_lib::run();
}
```

### `src-tauri/src/lib.rs`
```rust
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            // Chat
            commands::chat::send_message,
            
            // Sys
            commands::sys::config::get_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### `interfaces/desktop/src-tauri/Cargo.toml`
```toml
[package]
name = "devpulse-desktop-lib"
version = "0.0.0"
description = "DevPulse Desktop"
authors = ["you"]
edition = "2021"

[lib]
name = "devpulse_desktop_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0.0-rc", features = [] }

[dependencies]
tauri = { version = "2.0.0-rc", features = ["shell-all"] }
tauri-plugin-shell = "2.0.0-rc"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

## 2. Command Module Hierarchy

### `src-tauri/src/commands/mod.rs`
```rust
pub mod chat;
pub mod devmaestro;
pub mod thinkmaestro;
pub mod wiredfront;
pub mod sys;
```

### `src-tauri/src/commands/chat/mod.rs`
```rust
pub mod interactions;

#[tauri::command]
pub fn send_message(content: String) -> String {
    format!("Echo: {}", content)
}
```

### `src-tauri/src/commands/sys/mod.rs`
```rust
pub mod config;
pub mod guard;
pub mod logger;
```

### `src-tauri/src/commands/sys/config.rs`
```rust
#[tauri::command]
pub fn get_settings() -> String {
    "{}".to_string()
}
```

## 3. Empty Stubs (To be filled in later sprints, but must compile)
*   `commands/chat/interactions.rs`: `pub fn post_reaction() {}`
*   `commands/devmaestro/mod.rs`: `pub fn get_status() {}`
*   `commands/thinkmaestro/mod.rs`: `pub fn create_canvas() {}`
*   `commands/wiredfront/mod.rs`: `pub fn connect_peer() {}`
## 4. Frontend Configuration (Required for `npm run dev`)

### `src/vite.config.ts`
```typescript
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
});
```

### `src/tsconfig.json`
```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.d.ts", "src/**/*.ts", "src/**/*.js", "src/**/*.svelte"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `src/tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["vite.config.ts"]
}
```

### `src/index.html`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevPulse</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## 5. Kernel: `devpulse-maestro` (The Brain)

### `kernel/devpulse-maestro/src/lib.rs`
```rust
pub mod memory;
pub mod reasoning;

pub struct Brain {
    // Proprietary State
}

impl Brain {
    pub fn new() -> Self {
        Self {}
    }
}
```

## 6. Systems: `devpulse-engine` (The Facade)

### `systems/devpulse-engine/src/lib.rs`
```rust
pub mod signals;

use devpulse_maestro::Brain;

pub struct Engine {
    brain: Brain,
}

impl Engine {
    pub fn boot() -> Self {
        Self { brain: Brain::new() }
    }
}
```

### `systems/devpulse-engine/src/signals.rs`
```rust
use serde::{Serialize, Deserialize};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SignalEnvelope {
    pub id: Uuid,
    pub kind: String,
    pub payload: String,
}
```

## 7. The Lab (Sister Repo)

### `../devpulse_lab/Cargo.toml`
```toml
[package]
name = "devpulse-lab"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0.0-rc", features = [] }
serde = { version = "1.0", features = ["derive"] }
```

