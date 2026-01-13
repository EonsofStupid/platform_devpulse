# DevPulse Implementation Plan

**Date:** 2026-01-07
**Status:** AWAITING APPROVAL

---

## Current State (What Actually Exists)

### Rust Backend
| Component | File | Status |
|-----------|------|--------|
| VoiceFacade | `engine/src/facade/voice.rs` | DONE - has `transcribe()`, `speak()`, `synthesize()` |
| ChatFacade | `engine/src/facade/chat.rs` | DONE - has `send()`, emits signals |
| Analytics | `orchestrator/src/infra/duckdb.rs` | DONE but locks when both apps run |
| Tauri commands | `desktop/src-tauri/src/lib.rs` | MISSING voice commands |

### SvelteKit Frontend
| Component | File | Status |
|-----------|------|--------|
| chatStore | `desktop/src/lib/stores/chat.svelte.ts` | DONE - messages, loading, error, modes |
| ChatOverlay | `desktop/src/lib/components/chat/ChatOverlay.svelte` | DONE - overlay panel with FAB |
| ChatView | `desktop/src/lib/features/chat/ChatView.svelte` | DONE - basic chat UI |
| Voice API | - | MISSING |

---

## Phase 1: DuckDB Fix

**Problem:** `Engine::init()` always opens Analytics. Desktop doesn't need it.

**Solution:** Add `EngineConfig` struct.

### 1.1 Create EngineConfig

```rust
// engine/src/lib.rs - ADD

/// Engine configuration
#[derive(Default)]
pub struct EngineConfig {
    /// Enable analytics (DuckDB). Only Lab needs this.
    pub with_analytics: bool,
}

impl EngineConfig {
    pub fn desktop() -> Self {
        Self { with_analytics: false }
    }

    pub fn lab() -> Self {
        Self { with_analytics: true }
    }
}
```

### 1.2 Modify Engine::init()

```rust
// engine/src/lib.rs - MODIFY

impl Engine {
    pub async fn init(config: EngineConfig) -> Result<Self, EngineError> {
        // ... existing init code ...

        // Only open analytics if configured
        let analytics = if config.with_analytics {
            Some(Arc::new(Analytics::open()?))
        } else {
            None
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

### 1.3 Update Desktop

```rust
// desktop/src-tauri/src/lib.rs:33 - MODIFY

Engine::init(EngineConfig::desktop()).await
```

### 1.4 Update Lab

```rust
// lab/src/state.rs:34 - MODIFY

Engine::init(EngineConfig::lab()).await
```

### 1.5 Update SignalProcessor

```rust
// engine/src/signals/processor.rs - MODIFY

pub struct SignalProcessor {
    analytics: Option<Arc<Analytics>>,  // Now optional
    // ...
}
```

**Files:** 4 modified

---

## Phase 2: Voice Tauri Commands

**Problem:** VoiceFacade exists but no Tauri commands expose it.

**Dependency:** Add `hound = "3"` to desktop/src-tauri/Cargo.toml for WAV conversion (already in Cargo.lock via sherpa-rs).

### 2.1 Add Voice Commands

```rust
// desktop/src-tauri/src/lib.rs - ADD after line 180

/// Get voice status
#[tauri::command]
async fn get_voice_status(state: State<'_, AppState>) -> Result<VoiceStatus, String> {
    let engine = state.engine().await?;
    let model_status = engine.voice.model_status();

    Ok(VoiceStatus {
        stt_ready: model_status.whisper_ready,
        tts_ready: model_status.kokoro_ready,
        stt_missing: model_status.whisper_missing.clone(),
        tts_missing: model_status.kokoro_missing.clone(),
    })
}

/// Speak text (TTS)
#[tauri::command]
async fn speak(text: String, state: State<'_, AppState>) -> Result<Vec<u8>, String> {
    let engine = state.engine().await?;
    let result = engine.voice.speak(&text).map_err(|e| e.to_string())?;

    // Convert f32 samples to WAV bytes for playback
    let wav_bytes = samples_to_wav(&result.audio, result.sample_rate);
    Ok(wav_bytes)
}

/// Transcribe audio (STT)
#[tauri::command]
async fn transcribe(audio_bytes: Vec<u8>, state: State<'_, AppState>) -> Result<String, String> {
    let engine = state.engine().await?;

    // Convert WAV bytes to f32 samples
    let samples = wav_to_samples(&audio_bytes)?;

    engine.voice.transcribe(&samples).map_err(|e| e.to_string())
}

#[derive(Debug, Clone, Serialize)]
pub struct VoiceStatus {
    pub stt_ready: bool,
    pub tts_ready: bool,
    pub stt_missing: Vec<String>,
    pub tts_missing: Vec<String>,
}

// WAV conversion using hound crate
fn samples_to_wav(samples: &[f32], sample_rate: u32) -> Vec<u8> {
    use hound::{WavSpec, WavWriter};
    use std::io::Cursor;

    let spec = WavSpec {
        channels: 1,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    let mut writer = WavWriter::new(&mut cursor, spec).unwrap();
    for &sample in samples {
        let s = (sample * 32767.0).clamp(-32768.0, 32767.0) as i16;
        writer.write_sample(s).unwrap();
    }
    writer.finalize().unwrap();
    cursor.into_inner()
}

fn wav_to_samples(wav_bytes: &[u8]) -> Result<Vec<f32>, String> {
    use hound::WavReader;
    use std::io::Cursor;

    let cursor = Cursor::new(wav_bytes);
    let mut reader = WavReader::new(cursor).map_err(|e| e.to_string())?;

    let samples: Vec<f32> = reader.samples::<i16>()
        .filter_map(|s| s.ok())
        .map(|s| s as f32 / 32768.0)
        .collect();

    Ok(samples)
}
```

### 2.2 Register Commands

```rust
// desktop/src-tauri/src/lib.rs:190 - MODIFY invoke_handler

.invoke_handler(tauri::generate_handler![
    chat,
    list_projects,
    add_project,
    remove_project,
    select_project,
    get_selected_project,
    browse_folder,
    get_status,
    get_adapters,
    set_adapter,
    get_analytics,
    // Voice commands - NEW
    get_voice_status,
    speak,
    transcribe,
])
```

**Files:** 1 modified

---

## Phase 3: Chat Child Window (Parent/Child Architecture)

**Research findings:**
- Tauri 2.0 `WebviewWindow` supports parent/child
- `window-vibrancy` for Mica (Windows) / vibrancy (macOS)
- Child window can be positioned relative to parent

### 3.1 Add Dependencies

```toml
# desktop/src-tauri/Cargo.toml - ADD
# NOTE: Both already in Cargo.lock as transitive deps, just making explicit

[dependencies]
window-vibrancy = "0.7"  # via tauri transitive
```

### 3.2 Add Chat Window Config

```json
// desktop/src-tauri/tauri.conf.json - ADD to app.windows array

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
  "url": "chat-window"
}
```

### 3.3 Add Window Commands

```rust
// desktop/src-tauri/src/lib.rs - ADD

use window_vibrancy::{apply_mica, apply_vibrancy, NSVisualEffectMaterial};
use tauri::Manager;

/// Open chat as child window
#[tauri::command]
async fn open_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    let chat = app.get_webview_window("chat").ok_or("Chat window not configured")?;

    // Apply platform glass effect
    #[cfg(target_os = "windows")]
    apply_mica(&chat, Some(true)).ok();

    #[cfg(target_os = "macos")]
    apply_vibrancy(&chat, NSVisualEffectMaterial::HudWindow, None, None).ok();

    chat.show().map_err(|e| e.to_string())
}

/// Close chat window
#[tauri::command]
async fn close_chat_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(chat) = app.get_webview_window("chat") {
        chat.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Dock chat to main window edge
#[tauri::command]
async fn dock_chat_window(app: tauri::AppHandle, edge: String) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("No main window")?;
    let chat = app.get_webview_window("chat").ok_or("No chat window")?;

    let main_pos = main.outer_position().map_err(|e| e.to_string())?;
    let main_size = main.outer_size().map_err(|e| e.to_string())?;
    let chat_size = chat.outer_size().map_err(|e| e.to_string())?;

    let (x, y) = match edge.as_str() {
        "right" => (main_pos.x + main_size.width as i32, main_pos.y),
        "left" => (main_pos.x - chat_size.width as i32, main_pos.y),
        _ => (main_pos.x + main_size.width as i32, main_pos.y),
    };

    chat.set_position(tauri::PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}
```

### 3.4 Create Chat Window Route

```svelte
<!-- desktop/src/routes/chat-window/+page.svelte - NEW FILE -->
<script lang="ts">
  import ChatView from '$lib/features/chat/ChatView.svelte';
  import { invoke } from '@tauri-apps/api/core';

  async function close() {
    await invoke('close_chat_window');
  }
</script>

<div class="chat-window">
  <header class="window-header">
    <span class="title">Maestro</span>
    <button onclick={close}>×</button>
  </header>
  <ChatView />
</div>

<style>
  .chat-window {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: transparent;
  }

  .window-header {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.5);
    -webkit-app-region: drag;
  }

  .window-header button {
    -webkit-app-region: no-drag;
  }
</style>
```

**Files:** 3 modified, 1 new

---

## Phase 4: Voice UI Integration

### 4.1 Add Voice API

```typescript
// desktop/src/lib/api/voice.ts - NEW FILE

import { invoke } from '@tauri-apps/api/core';

export interface VoiceStatus {
  stt_ready: boolean;
  tts_ready: boolean;
  stt_missing: string[];
  tts_missing: string[];
}

export async function getVoiceStatus(): Promise<VoiceStatus> {
  return invoke<VoiceStatus>('get_voice_status');
}

export async function speak(text: string): Promise<Uint8Array> {
  return invoke<number[]>('speak', { text }).then(arr => new Uint8Array(arr));
}

export async function transcribe(audioBytes: Uint8Array): Promise<string> {
  return invoke<string>('transcribe', { audioBytes: Array.from(audioBytes) });
}
```

### 4.2 Add Voice Store

```typescript
// desktop/src/lib/stores/voice.svelte.ts - NEW FILE

import { getVoiceStatus, speak, transcribe, type VoiceStatus } from '$lib/api/voice';

class VoiceStore {
  status = $state<VoiceStatus | null>(null);
  isRecording = $state(false);
  isSpeaking = $state(false);
  error = $state<string | null>(null);

  // Audio context for playback
  private audioContext: AudioContext | null = null;

  async init() {
    try {
      this.status = await getVoiceStatus();
    } catch (e) {
      this.error = String(e);
    }
  }

  async speakText(text: string) {
    if (!this.status?.tts_ready) {
      this.error = 'TTS not available';
      return;
    }

    this.isSpeaking = true;
    try {
      const wavBytes = await speak(text);
      await this.playAudio(wavBytes);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.isSpeaking = false;
    }
  }

  private async playAudio(wavBytes: Uint8Array) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    const buffer = await this.audioContext.decodeAudioData(wavBytes.buffer);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }
}

export const voiceStore = new VoiceStore();
```

### 4.3 Add Voice Toggle to ChatOverlay

Add microphone button to existing ChatOverlay.svelte header.

**Files:** 2 new, 1 modified

---

## Phase 5: Extend Store for Panels (Your Architecture)

Based on your code, extend chatStore to support:
- Panel/window management
- Mode switching (chat/dev/image/training/planning/costar)
- Feature flags

```typescript
// desktop/src/lib/stores/chat.svelte.ts - EXTEND

export type ChatMode = 'chat' | 'dev' | 'image' | 'thinkspace' | 'planning' | 'promptrecipe';
export type PanelType = 'dev' | 'plan' | 'training' | 'personality' | 'gallery';

class ChatStore {
  // Existing
  messages = $state<Message[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  sessionId = $state<string>('default');
  mode = $state<ChatMode>('closed');
  hasUnread = $state(false);

  // NEW: Panel management
  activePanels = $state<PanelType[]>([]);
  currentMode = $state<ChatMode>('chat');

  // NEW: Feature flags
  features = $state({
    streaming: true,
    voiceInput: false,
    voiceOutput: false,
    driftGuard: false,
  });

  // NEW: Panel controls
  openPanel(type: PanelType) {
    if (!this.activePanels.includes(type)) {
      this.activePanels = [...this.activePanels, type];
    }
  }

  closePanel(type: PanelType) {
    this.activePanels = this.activePanels.filter(p => p !== type);
  }

  setMode(mode: ChatMode) {
    this.currentMode = mode;
    // Auto-spawn panels based on mode
    if (mode === 'dev') this.openPanel('dev');
    if (mode === 'training') this.openPanel('training');
  }

  // ... existing methods ...
}
```

**Files:** 1 modified

---

## Execution Order

1. **Phase 1: DuckDB** - Unblocks Lab
2. **Phase 2: Voice Commands** - Enables TTS/STT testing
3. **Phase 4: Voice UI** - Frontend integration
4. **Phase 3: Child Window** - Chat as separate window
5. **Phase 5: Panel System** - Full architecture

---

## Verification Checklist

After Phase 1:
- [ ] `cargo run -p lab` starts without DuckDB error
- [ ] Desktop and Lab can run simultaneously

After Phase 2:
- [ ] `get_voice_status` returns model availability
- [ ] `speak` returns WAV bytes
- [ ] `transcribe` returns text

After Phase 3:
- [ ] Ctrl+G opens chat child window
- [ ] Window has glass effect (Windows Mica / macOS vibrancy)
- [ ] Can dock to main window edge

After Phase 4:
- [ ] Voice toggle in chat UI
- [ ] TTS plays audio on response
- [ ] STT captures speech input

---

**APPROVE TO PROCEED**
