# DevPulse Master Implementation Plan

**Date:** 2026-01-07
**Status:** AWAITING APPROVAL

---

## Build Configuration

| Build | Crates | Ships to Users | DuckDB |
|-------|--------|----------------|--------|
| **Public** | desktop, engine, shared, orchestrator | Yes | NO |
| **Internal** | + lab, mission-control | Never | YES (Lab owns) |

---

## Phase 1: DuckDB - Lab Only

**Current Problem:** Engine initializes Analytics, so Desktop opens DuckDB and locks it.

**Solution:** Wrong.  DuckDB is installed in both lab and engine. Libpsql is also to be installed and configured for user data.  Kernel maestro is sensitive ip and we have devtools featureflagged that will be able to process the actual signals.  We have a one to one mapping to engine that is our facade so it still provides useful just not our exact IP methods and unique ideas and designs.  

### 1.1 Engine::init() takes mode parameter

```rust
// engine/src/lib.rs - MODIFY

pub enum EngineMode {
    Desktop,  // No analytics, ships to users
    Lab,      // Full analytics, internal only
}

impl Engine {
    pub async fn init(mode: EngineMode) -> Result<Self, EngineError> {
        // Only init analytics in Lab mode
        let analytics = match mode {
            EngineMode::Lab => Some(Arc::new(Analytics::open()?)),
            EngineMode::Desktop => None,
        };

        // SignalProcessor gets Option<Arc<Analytics>>
        let processor = SignalProcessor::new(
            cache,
            Arc::clone(&db),
            Arc::clone(&stores),
            analytics,
        );
        // ...
    }
}
```

### 1.2 Desktop calls Engine::init(Desktop)

```rust
// desktop/src-tauri/src/lib.rs
Engine::init(EngineMode::Desktop).await
```

### 1.3 Lab calls Engine::init(Lab)

```rust
// lab/src/state.rs
Engine::init(EngineMode::Lab).await
```

### 1.4 Update SignalProcessor

```rust
// engine/src/signals/processor.rs

pub struct SignalProcessor {
    analytics: Option<Arc<Analytics>>,  // Optional
    // ...
}

impl SignalProcessor {
    fn route_to_analytics(&self, signal: &Signal) {
        if let Some(ref analytics) = self.analytics {
            // write to duckdb
        }
        // No-op for Desktop
    }
}
```

**Files changed:** 4
- `engine/src/lib.rs`
- `engine/src/signals/processor.rs`
- `desktop/src-tauri/src/lib.rs`
- `lab/src/state.rs`

---

## Phase 2: Lefthook Setup

**Current State:** Not installed, no config.

### 2.1 Create config

```yaml
# alpha/lefthook.yml

pre-commit:
  parallel: true
  commands:
    fmt:
      glob: "*.rs"
      run: cargo fmt --check
    clippy:
      glob: "*.rs"
      run: cargo clippy --workspace -- -D warnings

pre-push:
  commands:
    test:
      run: cargo test --workspace
```

### 2.2 Install

```bash
scoop install lefthook  # or cargo install lefthook
cd alpha && lefthook install
```

**Files changed:** 1 new file

---

## Phase 3: Chat System (MissionControl)

### 3.1 Store (from your code)

```typescript
// desktop/src/lib/stores/missionControl.svelte.ts

export type ChatMode = 'chat' | 'dev' | 'image' | 'training' | 'planning' | 'costar';

class MissionControl {
    isMinimised = $state(false);
    isOpen = $state(true);
    currentMode = $state<ChatMode>('chat');
    activeTools = $state<string[]>([]);
    features = $state({
        streaming: true,
        codeHighlight: true,
        autoScroll: true,
        driftGuard: false,
        voiceInput: false,
        voiceOutput: false,
    });
}
```

### 3.2 Components

```
desktop/src/lib/components/chat/
├── ChatOverlay.svelte     # Parent panel
├── ModeSelector.svelte    # Mode switching
├── MessageList.svelte     # Messages
├── CostarRecipe.svelte    # COSTAR prompt builder
├── DriftGuard.svelte      # Drift monitoring
└── index.ts
```

### 3.3 Tauri Child Window

```json
// desktop/src-tauri/tauri.conf.json

{
  "label": "chat",
  "title": "Maestro",
  "width": 420,
  "height": 700,
  "visible": false,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "url": "chat-window"
}
```

### 3.4 Rust Window Commands

```rust
// desktop/src-tauri/src/windows.rs

#[tauri::command]
pub async fn open_chat(app: tauri::AppHandle) -> Result<(), String>;

#[tauri::command]
pub async fn close_chat(app: tauri::AppHandle) -> Result<(), String>;

#[tauri::command]
pub async fn dock_chat(app: tauri::AppHandle, side: String) -> Result<(), String>;
```

**Files changed:** 5+

---

## Phase 4: Voice (Sherpa-ONNX)

**Stack:** Whisper (STT) + Kokoro (TTS) via sherpa-onnx

### 4.1 VoiceFacade

```rust
// engine/src/facade/voice.rs

pub struct VoiceFacade {
    stt: Option<sherpa_onnx::OnlineRecognizer>,  // Whisper
    tts: Option<sherpa_onnx::OfflineTts>,        // Kokoro
}

impl VoiceFacade {
    pub async fn transcribe(&self, audio: &[f32]) -> Result<String, EngineError>;
    pub async fn speak(&self, text: &str) -> Result<Vec<f32>, EngineError>;
}
```

### 4.2 Tauri Voice Commands

```rust
#[tauri::command]
pub async fn start_listening(state: State<'_, AppState>) -> Result<(), String>;

#[tauri::command]
pub async fn stop_listening(state: State<'_, AppState>) -> Result<String, String>;

#[tauri::command]
pub async fn speak(text: String, state: State<'_, AppState>) -> Result<(), String>;
```

**Files changed:** 3

---

## Phase 5: Glass Visuals

```css
:root {
    --neon-cyan: #00f3ff;
    --neon-purple: #bc13fe;
    --glass-bg: rgba(10, 10, 15, 0.95);
    --grid-line: rgba(0, 243, 255, 0.1);
}

.mission-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
```

Plus `window-vibrancy` for native glass on Windows/macOS.

---

## Execution Order

1. **Phase 1:** DuckDB fix → UNBLOCKS LAB
2. **Phase 2:** Lefthook → PREVENTS REGRESSIONS
3. **Phase 3:** Chat scaffold → CORE FEATURE
4. **Phase 4:** Voice → STT/TTS
5. **Phase 5:** Glass → VISUALS

---

## Verification

After Phase 1:
- [ ] Desktop builds without DuckDB
- [ ] Lab builds with DuckDB
- [ ] Both run simultaneously (no lock)

---

**AWAITING APPROVAL**
