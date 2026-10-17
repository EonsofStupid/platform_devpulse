# COMPLETE IMPLEMENTATION PLAN - DEVPULSE DESKTOP

**Date**: 2026-01-09
**Status**: MANDATORY - EVERY ITEM MUST BE COMPLETED

---

## PHASE 0: CRITICAL FIXES (DO FIRST)

### 0.1 Add Project Functionality
- [ ] `AddProjectDialog.svelte` - MUST WORK to add ANY folder
- [ ] Add DevPulse itself as Project #0 (dogfooding)
- [ ] Project list persists to database
- [ ] Selected project shows in UI
- [ ] Project indexing with progress

**Backend Commands (MUST EXIST)**:
```rust
add_project(path: String) -> Project
remove_project(id: String)
list_projects() -> Vec<Project>
select_project(id: String)
get_selected_project() -> Option<Project>
index_project(id: String) -> IndexingResult
```

**Acceptance**:
- [ ] Can click "Add Project" button
- [ ] Can browse to folder
- [ ] Project appears in list
- [ ] Can add `D:\localdev\alpha_devpulse` as a project
- [ ] Project persists after restart

---

## PHASE 1: MODEL LOADER (CRITICAL)

### 1.1 Model Loader Panel
**File**: `desktop/src/lib/features/models/ModelLoaderPanel.svelte`

```
┌─────────────────────────────────────────────────────────────┐
│ MODEL CONTROL                                         [≡]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  CPU USAGE   │  │  RAM USAGE   │  │  GPU VRAM    │      │
│  │   ╭─────╮    │  │   ╭─────╮    │  │   ╭─────╮    │      │
│  │   │ 23% │    │  │   │12.4 │    │  │   │ 6.4 │    │      │
│  │   ╰─────╯    │  │   │/32GB│    │  │   │/12GB│    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  ROLE: LLM                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ qwen3-vl-8b-q6k                      [LOADED] ✓     │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%          │   │
│  │ VRAM: 6.1GB | Device: CUDA:0 | Load: 1.2s          │   │
│  │                                                     │   │
│  │ [Unload] [Switch Model ▼]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ROLE: EMBEDDER                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ qwen3-embed-0.6b                     [LOADED] ✓     │   │
│  │ RAM: 800MB | Device: CPU | Load: 0.3s              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ROLE: RERANKER                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ (not assigned)                       [EMPTY]        │   │
│  │ [Assign Model]                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [+ Download New Model]  [Scan Directory]  [Settings]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Hardware Metrics (REAL DATA)
**Tauri Command**: `get_hardware_metrics`

```rust
#[derive(Serialize)]
pub struct HardwareMetrics {
    pub cpu_usage_pct: f32,      // 0-100
    pub ram_total_gb: f32,
    pub ram_used_gb: f32,
    pub ram_usage_pct: f32,      // 0-100
    pub gpu: Option<GpuMetrics>,
}

#[derive(Serialize)]
pub struct GpuMetrics {
    pub name: String,
    pub vram_total_gb: f32,
    pub vram_used_gb: f32,
    pub vram_usage_pct: f32,
    pub utilization_pct: Option<f32>,
    pub temperature_c: Option<f32>,
}
```

**Implementation**:
- [ ] Use `sysinfo` crate for CPU/RAM
- [ ] Use `nvml-wrapper` for NVIDIA GPU (optional feature)
- [ ] Use Windows DXGI for GPU on Windows
- [ ] Poll every 1 second
- [ ] Emit to frontend via events

### 1.3 Model Role Assignment (Database Config)

**Database Table**: `platform_config`
```sql
-- Model assignments stored as config
INSERT INTO platform_config (key, value, category) VALUES
('model.llm', 'qwen3-vl-8b-q6k', 'models'),
('model.embedder', 'qwen3-embed-0.6b', 'models'),
('model.reranker', 'qwen3-rerank-0.6b', 'models'),
('model.tts', 'kokoro-v1', 'models'),
('model.stt', 'whisper-large-v3', 'models');
```

**Tauri Commands**:
```rust
assign_model_role(role: String, model_id: String)
get_model_for_role(role: String) -> Option<String>
list_model_assignments() -> HashMap<String, String>
```

### 1.4 Model Loading (Candle-based, Feature Flags)

**Cargo.toml Features**:
```toml
[features]
default = ["cpu"]
cpu = []
cuda = ["candle-core/cuda"]
metal = ["candle-core/metal"]
```

**Safe Loading Protocol**:
1. Check available VRAM/RAM
2. Unload existing model in same slot (if any)
3. Load weights with progress callback
4. Verify model loaded correctly
5. Update database with loaded state
6. Emit completion event

**Progress Stages**:
```
IDLE -> CHECKING -> LOADING_WEIGHTS -> LOADING_PROJECTOR -> WARMING_UP -> READY
                         |
                         v
                      FAILED (with error message)
```

### 1.5 Model Download from HuggingFace

**UI Component**: `ModelDownloader.svelte`

```
┌─────────────────────────────────────────────────────────────┐
│ DOWNLOAD MODEL                                          [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Search HuggingFace: [_________________________] [Search]   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  RECOMMENDED MODELS:                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Qwen/Qwen3-VL-8B-Instruct-GGUF                      │   │
│  │ Q6_K • 6.2 GB • Vision-Language                     │   │
│  │ [Download]                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Qwen/Qwen3-VL-4B-Instruct-GGUF                      │   │
│  │ Q6_K • 3.1 GB • Vision-Language                     │   │
│  │ [Download]                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DOWNLOADING:                                               │
│  qwen3-vl-8b-q6k.gguf                                      │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░ 42%                │
│  2.6 GB / 6.2 GB • 45 MB/s • ETA: 1:20                     │
│                                                             │
│  [Cancel]                                      [Pause]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tauri Commands**:
```rust
search_hf_models(query: String) -> Vec<HfModel>
download_model(repo_id: String, filename: String) -> DownloadHandle
cancel_download(handle: String)
get_download_progress(handle: String) -> DownloadProgress
```

### 1.6 Files to Create

```
desktop/src/lib/features/models/
├── ModelLoaderPanel.svelte      # Main panel
├── ModelCard.svelte             # Single model display
├── ModelRoleAssigner.svelte     # Role assignment dropdown
├── HardwareGauges.svelte        # CPU/RAM/GPU gauges
├── ModelDownloader.svelte       # HF download UI
├── ModelProgressBar.svelte      # Loading progress
└── index.ts                     # Exports
```

### 1.7 Acceptance Criteria
- [ ] Can see CPU/RAM/GPU usage in real-time (not mock)
- [ ] Can see which model assigned to each role
- [ ] Can load a model and see progress
- [ ] Can unload a model
- [ ] Can switch models per role
- [ ] Can download models from HuggingFace
- [ ] Model assignments persist in database
- [ ] Works on fresh install (no models = prompts to download)

---

## PHASE 2: STATUS BAR (52px Fixed Bottom)

### 2.1 Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚡ System OK │ VRAM 6.4/12GB │ Llm: qwen3-vl-8b │ Guardian: Active │ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Components
**File**: `desktop/src/lib/components/layout/StatusBar.svelte`

Sections:
- [ ] System vitals indicator (green/yellow/red)
- [ ] VRAM usage (from hardware metrics)
- [ ] Active llm model name
- [ ] Guardian/monitoring status
- [ ] Network status indicator

### 2.3 Implementation
- [ ] Fixed position bottom: 0
- [ ] Height: 52px exactly
- [ ] Glass morphism styling
- [ ] Updates from hardware metrics store
- [ ] Clickable sections expand details

---

## PHASE 3: CHAT POPUP COMPONENTS

### 3.1 Component System for AI Control

The chat must support popup components that Maestro can trigger:

**Component Types**:
```typescript
type PopupComponent =
  | { type: 'decision', options: string[], callback: (choice: number) => void }
  | { type: 'editing', content: string, onSave: (text: string) => void }
  | { type: 'code_review', diff: string, onApprove: () => void }
  | { type: 'file_preview', path: string, content: string }
  | { type: 'task_list', tasks: Task[], onComplete: (id: string) => void }
  | { type: 'confirmation', message: string, onConfirm: () => void }
  | { type: 'minion_status', minions: MinionState[] }
```

### 3.2 Files to Create

```
desktop/src/lib/components/chat/popups/
├── DecisionCard.svelte         # Multiple choice decision
├── EditingCard.svelte          # Text editing panel
├── CodeReviewCard.svelte       # Diff review with approve/reject
├── FilePreviewCard.svelte      # File content preview
├── TaskListCard.svelte         # Task checklist
├── ConfirmationCard.svelte     # Yes/No confirmation
├── MinionStatusCard.svelte     # Minion status display
└── index.ts
```

### 3.3 Chat Component Registry

```typescript
// chatComponentRegistry.ts
const componentRegistry = new Map<string, SvelteComponent>();

export function registerChatComponent(type: string, component: SvelteComponent) {
  componentRegistry.set(type, component);
}

export function getChatComponent(type: string): SvelteComponent | undefined {
  return componentRegistry.get(type);
}
```

### 3.4 AI Control Interface

```typescript
// Maestro can emit these to show UI components
interface MaestroUICommand {
  action: 'show_popup' | 'hide_popup' | 'update_popup';
  component_type: string;
  props: Record<string, unknown>;
  callback_id?: string;
}
```

---

## PHASE 4: VOICE IN CHAT INPUT

### 4.1 ChatInput Enhancement

**File**: `desktop/src/lib/components/chat/ChatInput.svelte`

```svelte
<div class="chat-input">
  <textarea bind:value={message} placeholder="Ask Maestro..."></textarea>

  <div class="input-actions">
    <!-- Voice button -->
    <button
      class="voice-btn"
      class:recording={isRecording}
      onmousedown={startRecording}
      onmouseup={stopRecording}
      onmouseleave={stopRecording}
    >
      {#if isRecording}
        <span class="recording-indicator"></span>
      {/if}
      <MicIcon />
    </button>

    <!-- Send button -->
    <button class="send-btn" onclick={send} disabled={!message.trim()}>
      <SendIcon />
    </button>
  </div>
</div>
```

### 4.2 Voice Recording Flow

1. User presses and holds mic button
2. Recording indicator appears (pulsing red)
3. Audio captured via MediaRecorder
4. User releases button
5. Audio sent to Whisper (STT)
6. Transcription populates input field
7. User can edit before sending

### 4.3 Voice Status Integration

```typescript
// Check voice models are loaded
const voiceReady = $derived(
  voiceStore.status?.stt_ready && voiceStore.status?.tts_ready
);

// Show voice button only if models ready
{#if voiceReady}
  <VoiceButton />
{/if}
```

---

## PHASE 5: TOP BAR (66px) + ICON SIDEBAR (52px)

### 5.1 Top Bar Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [≡]  DevPulse                    │ Maestro ● Ready │ [🔔] [👤] [⚙️]    │
└─────────────────────────────────────────────────────────────────────────┘
  66px height
```

**Components**:
- [ ] Menu toggle button
- [ ] App title/logo
- [ ] Maestro status badge (pulsing when thinking)
- [ ] Notification bell
- [ ] User avatar
- [ ] Settings gear

### 5.2 Icon Sidebar (52px width)

```
┌────┐
│ 🏠 │  Home/Dashboard
├────┤
│ 📁 │  Projects
├────┤
│ 📚 │  Docs
├────┤
│ 🖼️ │  Gallery
├────┤
│ 🎙️ │  Voice
├────┤
│ ⚙️ │  Settings
├────┤
│    │
│    │
│    │
├────┤
│ 💬 │  Open Chat
└────┘
  52px width
```

### 5.3 Files to Create/Modify

```
desktop/src/lib/components/layout/
├── TopBar.svelte            # 66px top bar
├── IconSidebar.svelte       # 52px icon sidebar
├── StatusBar.svelte         # 52px bottom status
└── Shell.svelte             # Main layout wrapper (modify)
```

---

## PHASE 6: CORTEX VIEWER

### 6.1 Visualization Component

**File**: `desktop/src/lib/features/cortex/CortexViewer.svelte`

Visual representation of Maestro's thinking process:

```
┌─────────────────────────────────────────────────────────────┐
│ CORTEX VIEWER                                         [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         ┌───────────┐                                       │
│         │  INPUT    │                                       │
│         │  "How do  │                                       │
│         │   I..."   │                                       │
│         └─────┬─────┘                                       │
│               │                                             │
│         ┌─────▼─────┐                                       │
│         │ RETRIEVAL │◄─── Searching 3,247 chunks            │
│         │  ████░░░  │     Found 12 relevant                 │
│         └─────┬─────┘                                       │
│               │                                             │
│         ┌─────▼─────┐                                       │
│         │ RERANKING │◄─── Scoring relevance                 │
│         │  ██░░░░░  │     Top 5 selected                    │
│         └─────┬─────┘                                       │
│               │                                             │
│         ┌─────▼─────┐                                       │
│         │ REASONING │◄─── Llm processing                  │
│         │  ░░░░░░░  │     Layer: Cortex                     │
│         └─────┬─────┘                                       │
│               │                                             │
│         ┌─────▼─────┐                                       │
│         │  OUTPUT   │                                       │
│         └───────────┘                                       │
│                                                             │
│  Tokens: 1,247 | Latency: 1.2s | Context: 4,096            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow

```typescript
interface CortexState {
  stage: 'idle' | 'input' | 'retrieval' | 'reranking' | 'reasoning' | 'output';
  retrieval: {
    total_chunks: number;
    searched: number;
    found: number;
  };
  reranking: {
    candidates: number;
    selected: number;
  };
  reasoning: {
    layer: string;
    tokens_generated: number;
    tokens_total: number;
  };
  metrics: {
    latency_ms: number;
    context_tokens: number;
  };
}
```

---

## PHASE 7: DASHBOARD WITH ANIMATIONS

### 7.1 Animated Background

**File**: `desktop/src/lib/components/layout/AnimatedBackground.svelte`

Subtle animated elements in dashboard background:
- [ ] Floating particles
- [ ] Neural network connections
- [ ] Pulse waves on activity
- [ ] Gradient shifts

```svelte
<div class="animated-bg">
  <canvas bind:this={canvas}></canvas>
  <!-- Particle system rendered via canvas -->
</div>
```

### 7.2 Dashboard Gauges

**File**: `desktop/src/lib/features/dashboard/DashboardGauges.svelte`

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM OVERVIEW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │    VRAM     │  │   CONTEXT   │  │    TOKENS   │        │
│   │   ╭─────╮   │  │   ╭─────╮   │  │   ╭─────╮   │        │
│   │   │6.4GB│   │  │   │ 66% │   │  │   │1.2k │   │        │
│   │   │/12GB│   │  │   │     │   │  │   │/sec │   │        │
│   │   ╰─────╯   │  │   ╰─────╯   │  │   ╰─────╯   │        │
│   │    53%      │  │   2.7k/4k   │  │   Speed     │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 8: MINIONS UI

### 8.1 Minion Characters

Based on your references, minions are visual representations of background processes:

**Minion Types**:
- **Chunky** - Indexing/chunking worker
- **Ember** - Embedding generator
- **Hoppy** - Search/retrieval
- **Sage** - Reranking wisdom

### 8.2 Minion Status Panel

**File**: `desktop/src/lib/features/minions/MinionPanel.svelte`

```
┌─────────────────────────────────────────────────────────────┐
│ MINIONS                                               [≡]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  🤖      │  │  🦊      │  │  🐸      │  │  🦉      │   │
│  │ Chunky   │  │ Ember    │  │ Hoppy    │  │ Sage     │   │
│  │ ████░░░  │  │ ░░░░░░░  │  │ ░░░░░░░  │  │ ░░░░░░░  │   │
│  │ WORKING  │  │ IDLE     │  │ IDLE     │  │ IDLE     │   │
│  │          │  │          │  │          │  │          │   │
│  │ 1.2k/3k  │  │          │  │          │  │          │   │
│  │ chunks   │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  Active Tasks: 1 | Queue: 0 | Completed Today: 47          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Minion Animation States

```typescript
type MinionState = 'idle' | 'working' | 'success' | 'error' | 'sleeping';

interface Minion {
  id: string;
  name: string;
  avatar: string;  // emoji or image path
  state: MinionState;
  task?: string;
  progress?: number;  // 0-100
  stats: {
    completed_today: number;
    errors_today: number;
  };
}
```

---

## EXPANDABLE UI COMPONENT SYSTEM

### Architecture for Growth

```typescript
// Component Registration System
interface UIComponent {
  id: string;
  name: string;
  category: 'dashboard' | 'chat' | 'settings' | 'tools';
  component: SvelteComponent;
  icon: string;
  enabled: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

// Component Store
class ComponentRegistry {
  private components = new Map<string, UIComponent>();

  register(component: UIComponent): void;
  unregister(id: string): void;
  get(id: string): UIComponent | undefined;
  list(category?: string): UIComponent[];
  enable(id: string): void;
  disable(id: string): void;
}

// AI Control Interface
interface AIUIController {
  showComponent(id: string, props?: Record<string, unknown>): void;
  hideComponent(id: string): void;
  updateComponent(id: string, props: Record<string, unknown>): void;
  arrangeComponents(layout: ComponentLayout): void;
}
```

---

## FILES TO CREATE - COMPLETE LIST

```
desktop/src/lib/
├── features/
│   ├── models/
│   │   ├── ModelLoaderPanel.svelte
│   │   ├── ModelCard.svelte
│   │   ├── ModelRoleAssigner.svelte
│   │   ├── HardwareGauges.svelte
│   │   ├── ModelDownloader.svelte
│   │   ├── ModelProgressBar.svelte
│   │   └── index.ts
│   │
│   ├── cortex/
│   │   ├── CortexViewer.svelte
│   │   ├── CortexNode.svelte
│   │   ├── CortexConnection.svelte
│   │   └── index.ts
│   │
│   ├── minions/
│   │   ├── MinionPanel.svelte
│   │   ├── MinionCard.svelte
│   │   ├── MinionAvatar.svelte
│   │   └── index.ts
│   │
│   └── dashboard/
│       ├── DashboardGauges.svelte
│       ├── AnimatedBackground.svelte
│       └── index.ts
│
├── components/
│   ├── layout/
│   │   ├── TopBar.svelte
│   │   ├── IconSidebar.svelte
│   │   ├── StatusBar.svelte
│   │   └── Shell.svelte (modify)
│   │
│   └── chat/
│       └── popups/
│           ├── DecisionCard.svelte
│           ├── EditingCard.svelte
│           ├── CodeReviewCard.svelte
│           ├── FilePreviewCard.svelte
│           ├── TaskListCard.svelte
│           ├── ConfirmationCard.svelte
│           ├── MinionStatusCard.svelte
│           └── index.ts
│
└── stores/
    ├── hardware.svelte.ts      # Hardware metrics store
    ├── components.svelte.ts    # UI component registry
    └── minions.svelte.ts       # Minion state store
```

---

## TAURI COMMANDS TO ADD

```rust
// Hardware metrics
get_hardware_metrics() -> HardwareMetrics

// Model management
assign_model_role(role: String, model_id: String) -> Result<()>
get_model_for_role(role: String) -> Option<String>
list_model_assignments() -> HashMap<String, String>
load_model_for_role(role: String) -> Result<()>
unload_model_for_role(role: String) -> Result<()>

// Model download
search_hf_models(query: String) -> Vec<HfModel>
download_model(repo_id: String, filename: String) -> String  // returns handle
cancel_download(handle: String) -> Result<()>
get_download_progress(handle: String) -> DownloadProgress

// Project management (verify these work)
add_project(path: String) -> Result<Project>
remove_project(id: String) -> Result<()>
list_projects() -> Vec<Project>
select_project(id: String) -> Result<()>
get_selected_project() -> Option<Project>
index_project(id: String) -> Result<IndexingResult>

// Minion status
get_minion_states() -> Vec<Minion>
```

---

## ACCEPTANCE CHECKLIST

### Phase 0: Critical
- [ ] Can add a project folder
- [ ] Can add DevPulse itself as project
- [ ] Projects persist in database
- [ ] Selected project visible in UI

### Phase 1: Model Loader
- [ ] Real CPU/RAM/GPU metrics (not mock)
- [ ] Model role assignment working
- [ ] Can load/unload models
- [ ] Can download from HuggingFace
- [ ] Progress visualization real

### Phase 2: Status Bar
- [ ] 52px fixed bottom
- [ ] Shows VRAM usage
- [ ] Shows active model
- [ ] Shows system health

### Phase 3: Chat Popups
- [ ] DecisionCard works
- [ ] EditingCard works
- [ ] AI can trigger popups

### Phase 4: Voice in Chat
- [ ] Mic button in chat input
- [ ] Hold to record
- [ ] Transcription to input
- [ ] Voice status visible

### Phase 5: Top Bar + Sidebar
- [ ] 66px top bar
- [ ] 52px icon sidebar
- [ ] Navigation works

### Phase 6: Cortex Viewer
- [ ] Shows processing stages
- [ ] Animates during inference
- [ ] Shows metrics

### Phase 7: Dashboard
- [ ] Animated background
- [ ] VRAM/Context gauges
- [ ] Real data

### Phase 8: Minions
- [ ] Minion cards visible
- [ ] State updates
- [ ] Progress tracking

---

**THIS IS THE COMPLETE PLAN. EVERY CHECKBOX MUST BE COMPLETED.**
