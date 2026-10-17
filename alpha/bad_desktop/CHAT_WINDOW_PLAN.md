# Chat Window Architecture Plan

**Date:** 2026-01-07
**Status:** APPROVED FOR IMPLEMENTATION

---

## Goal

Chat is a **SEPARATE CHILD WINDOW** that can:
1. Attach to main window (docked mode, like Steam overlay)
2. Detach as floating window (independent mode)
3. Support multiple panels/components that can be rearranged
4. Support AI-driven dynamic rich UI popups
5. Deep glass visuals with transparency and blur

---

## Architecture

### Window Hierarchy

```
DevPulse Main Window (parent)
    |
    +-- Chat Window (child, can attach/detach)
    |       |
    |       +-- Message Panel
    |       +-- Input Panel
    |       +-- Voice Controls
    |       +-- AI Popup Panels (dynamic)
    |
    +-- Future: Other tool windows
```

### Key Crates

| Crate | Purpose |
|-------|---------|
| `tauri-plugin-decorum` | Transparent titlebar, traffic lights, overlay style |
| `window-vibrancy` | Blur/vibrancy effects (Windows Mica, macOS vibrancy) |
| `tauri` 2.0 | Multi-window with `WebviewWindow`, parent-child |

---

## Implementation Steps

### Step 1: Add Chat Window to tauri.conf.json

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "DevPulse",
        "width": 1200,
        "height": 800
      },
      {
        "label": "chat",
        "title": "Maestro",
        "width": 420,
        "height": 700,
        "visible": false,
        "decorations": false,
        "transparent": true,
        "resizable": true,
        "alwaysOnTop": true,
        "url": "/chat-window"
      }
    ]
  }
}
```

### Step 2: Add Dependencies

```toml
# desktop/src-tauri/Cargo.toml
[dependencies]
tauri-plugin-decorum = "0.1"
window-vibrancy = "0.5"
```

### Step 3: Rust Window Management Commands

```rust
// desktop/src-tauri/src/lib.rs

use tauri::{Manager, WebviewWindow};
use window_vibrancy::{apply_mica, apply_vibrancy, NSVisualEffectMaterial};

#[tauri::command]
async fn open_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    let chat_window = app.get_webview_window("chat")
        .ok_or("Chat window not found")?;

    // Apply glass effect
    #[cfg(target_os = "windows")]
    apply_mica(&chat_window, Some(true)).map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    apply_vibrancy(&chat_window, NSVisualEffectMaterial::HudWindow, None, None)
        .map_err(|e| e.to_string())?;

    chat_window.show().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn close_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(chat_window) = app.get_webview_window("chat") {
        chat_window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn dock_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("Main window not found")?;
    let chat = app.get_webview_window("chat").ok_or("Chat window not found")?;

    // Position chat to right edge of main window
    let main_pos = main.outer_position().map_err(|e| e.to_string())?;
    let main_size = main.outer_size().map_err(|e| e.to_string())?;

    let chat_x = main_pos.x + main_size.width as i32;
    let chat_y = main_pos.y;

    chat.set_position(tauri::PhysicalPosition::new(chat_x, chat_y))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn undock_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    let chat = app.get_webview_window("chat").ok_or("Chat window not found")?;
    // Center on screen
    chat.center().map_err(|e| e.to_string())?;
    Ok(())
}
```

### Step 4: Chat Window SvelteKit Route

Create `/chat-window` route for the standalone chat window:

```
desktop/src/routes/
  +page.svelte         <- Main app
  chat/+page.svelte    <- Embedded chat (legacy overlay)
  chat-window/+page.svelte  <- NEW: Standalone window content
```

### Step 5: Glass CSS Variables

```css
/* app.css - Deep glass theme */
:root {
  --glass-bg: rgba(36, 3, 54, 0.7);
  --glass-border: rgba(130, 111, 214, 0.3);
  --glass-blur: 20px;
  --glass-intense-bg: rgba(46, 13, 74, 0.85);
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.glass-intense {
  background: var(--glass-intense-bg);
  backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Step 6: Voice Integration

```rust
// Add to chat command
#[tauri::command]
async fn chat_with_voice(
    message: String,
    use_voice: bool,
    state: State<'_, AppState>
) -> Result<ChatResult, String> {
    let engine = state.engine().await?;
    let session_id = state.get_or_create_session(engine).await?;

    // Get response
    let response = engine.chat.send(&message, &session_id).await
        .map_err(|e| e.to_string())?;

    // TTS if voice enabled
    if use_voice && !response.is_stub {
        if let Err(e) = engine.voice.speak(&response.message).await {
            tracing::warn!("Voice TTS failed: {}", e);
        }
    }

    Ok(ChatResult {
        message: response.message,
        tokens_used: response.tokens_used,
        is_stub: response.is_stub,
    })
}
```

---

## DuckDB Fix

The file lock error happens because Lab and Desktop both try to open the same DuckDB file.

**Solution:** Use connection pooling or separate analytics per process.

```rust
// orchestrator/src/infra/duckdb.rs
impl Analytics {
    pub fn open() -> Result<Self> {
        let paths = get_paths();
        let db_path = paths.analytics_db();

        // Use exclusive mode check
        let conn = duckdb::Connection::open_with_flags(
            &db_path,
            duckdb::Config::default()
                .access_mode(duckdb::AccessMode::ReadWrite)?
        )?;

        // ... rest
    }
}
```

Or: Each process gets unique analytics file based on PID.

---

## Lab Dashboards

Lab UI routes that need to work:
- `/` - Main dashboard (signals overview, system health)
- `/signals` - Live signal stream
- `/chat` - Test chat (Lab's version)
- `/voice` - Voice profile management
- `/analytics` - Inference/hop stats
- `/models` - Model registry
- `/persona` - Persona config
- `/rumination` - Thought tree visualization
- `/background` - Background process status

---

## Verification Checklist

- [ ] `cargo build -p devpulse-desktop` compiles
- [ ] Chat window opens with Ctrl+G
- [ ] Glass effect visible (transparent blur)
- [ ] Chat window can dock to main
- [ ] Chat window can undock (floating)
- [ ] Voice TTS works in chat
- [ ] Lab loads without DuckDB error
- [ ] Lab dashboards show real data

---

## Sources

- [Tauri Multi-Window Best Practices](https://github.com/tauri-apps/tauri/discussions/9423)
- [tauri-plugin-decorum](https://github.com/clearlysid/tauri-plugin-decorum)
- [window-vibrancy crate](https://crates.io/crates/window-vibrancy)
- [Tauri Window Customization](https://v2.tauri.app/learn/window-customization/)
