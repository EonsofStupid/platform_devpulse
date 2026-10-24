# DESKTOP MUST-HAVES CHECKLIST

**Created**: 2026-01-09
**Status**: CRITICAL - DO NOT SKIP ANY ITEM

---

## MOCKUP REFERENCE

From mockups provided:
- 66px Top Frame with Maestro Status badge
- Left Sidebar: icon-only (52px) - Home, Projects, Docs, Gallery
- Persistent Project Dashboard with VRAM/Context gauges
- Detachable Chat Portal (400px width)
- Fixed 52px Status Bar: System Vitals | VRAM Usage | SIGLIP v2 | Guardian

---

## ARCHITECTURE: GLOBAL vs LOCAL

### Global (Platform-wide)
- [ ] Platform config in database (`platform_config` table)
- [ ] User config in database (`user_config` table)
- [ ] Model assignments (which model for each role)
- [ ] System status (all components)
- [ ] Hardware metrics (CPU/RAM/GPU/VRAM)

### Local (Per-Project)
- [ ] Project config in database (`project_config` table)
- [ ] Project-specific context settings
- [ ] Project indexing status
- [ ] Project-local chat history

---

## FEATURE 1: MODEL LOADER (CRITICAL)

### 1.1 Model Assignment Config (Database)

Models must be assignable via database config for:

| Role | Purpose | Config Key |
|------|---------|------------|
| EMBEDDER | Text embeddings for search | `model.embedder` |
| LLM | Language model for chat | `model.llm` |
| LLM | Vision-Language reasoning | `model.llm` |
| RERANKER | Search result ranking | `model.reranker` |
| TTS | Text-to-speech | `model.tts` |
| STT | Speech-to-text | `model.stt` |

**Required Database Operations**:
- [ ] `set_platform_config('model.embedder', 'qwen3-embed-0.6b', 'models')`
- [ ] `set_platform_config('model.llm', 'qwen3-vl-8b-q6k', 'models')`
- [ ] `get_platform_config('model.llm')` → returns assigned model
- [ ] On startup: load models from config

### 1.2 Model Discovery & Download

- [ ] Scan local directory for GGUF files
- [ ] Show available models from HuggingFace Hub
- [ ] Download progress with cancel support
- [ ] Verify downloaded files (checksum)
- [ ] Auto-detect model type from filename/metadata

**Download UI**:
```
┌─────────────────────────────────────────────────┐
│ Download Model                              [X] │
├─────────────────────────────────────────────────┤
│ Qwen3-VL-8B-Instruct-Q6_K.gguf                 │
│ Size: 6.2 GB                                   │
│ ████████████░░░░░░░░ 58% (3.6 GB / 6.2 GB)    │
│ Speed: 45 MB/s  ETA: 58s                       │
│                                                 │
│ [Cancel]                          [Pause]      │
└─────────────────────────────────────────────────┘
```

### 1.3 Model Loading UI (Real Visuals)

**Required Gauges (from mockup)**:
- [ ] VRAM Usage gauge: `6.4/12GB (53%)` - arc style
- [ ] Context Load gauge: percentage arc
- [ ] CPU Load: real percentage
- [ ] RAM Usage: real MB/GB

**Loading States**:
```
NOT_LOADED → LOADING → LOADED
                ↓
              FAILED
```

**Loading Progress Visualization**:
- [ ] Stage indicator: Verifying → Loading weights → Loading projector → Ready
- [ ] Progress percentage (0-100%)
- [ ] Memory being consumed in real-time
- [ ] Estimated time remaining

### 1.4 Model Loader Panel Component

```svelte
<!-- ModelLoaderPanel.svelte -->
┌─────────────────────────────────────────────────────────┐
│ MODEL CONTROL                                     [≡]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   VRAM Usage    │  │   Context Load  │              │
│  │  ╭───────────╮  │  │  ╭───────────╮  │              │
│  │  │   6.4GB   │  │  │  │    66%    │  │              │
│  │  │  /12GB    │  │  │  │           │  │              │
│  │  ╰───────────╯  │  │  ╰───────────╯  │              │
│  │      53%        │  │                 │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  LLM (qwen3-vl-8b-q6k)                    [LOADED]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%       │
│  VRAM: 6.1 GB | Device: CUDA:0 | Latency: 1.2s        │
│                                                         │
│  EMBEDDER (qwen3-embed-0.6b)                [LOADED]   │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%       │
│  RAM: 800 MB | Device: CPU | Latency: 0.3s            │
│                                                         │
│  RERANKER (qwen3-rerank-0.6b-q8)           [NOT LOADED]│
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%          │
│  [Load] [Assign Different Model]                       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [+ Download New Model]     [Scan Directory]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.5 Real Hardware Metrics

**Required Tauri Command**: `get_hardware_metrics`

```rust
#[derive(Serialize)]
pub struct HardwareMetrics {
    // CPU
    pub cpu_usage_percent: f32,
    pub cpu_cores: usize,
    pub cpu_name: String,

    // RAM
    pub ram_total_mb: u64,
    pub ram_used_mb: u64,
    pub ram_available_mb: u64,

    // GPU (NVIDIA)
    pub gpu_name: Option<String>,
    pub gpu_vram_total_mb: Option<u64>,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_vram_free_mb: Option<u64>,
    pub gpu_utilization_percent: Option<f32>,
    pub gpu_temperature_c: Option<f32>,

    // Process-specific
    pub devpulse_ram_mb: u64,
    pub devpulse_vram_mb: u64,
}
```

### 1.6 Safe Loading/Unloading

- [ ] Check available VRAM before loading
- [ ] Unload current model before loading new one (same slot)
- [ ] Graceful error handling if load fails
- [ ] Emit events for UI updates during load
- [ ] Persist load state across restarts

---

## FEATURE 2: CHAT WITH POPUP COMPONENTS

### 2.1 Detachable Chat Portal (400px)

From mockup: "COMMUNITY INTEL" panel with tabs:
- Active Task
- Past Discussions
- Memories

**Structure**:
```
┌─────────────────────────────────────────────┐
│ Chat                               [−] [×]  │
├─────────────────────────────────────────────┤
│ [Active Task] [Past Discussions] [Memories] │
├─────────────────────────────────────────────┤
│                                             │
│  User                              3:22 AM  │
│  Hey can you help with the auth?           │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔒 DECISION LOCKED:                 │   │
│  │ Auth Adapter = Supabase       ✓    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 🔧 EDITING:                         │   │
│  │ Choosing Database Schema...         │   │
│  │ ████████████░░░░░░ Fluxing         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Working Memory                             │
│  Maestro Realignment:                       │
│  Resetting understanding to last            │
│  stable state...                            │
│                                             │
├─────────────────────────────────────────────┤
│ [Type a message...]                    [→]  │
└─────────────────────────────────────────────┘
```

### 2.2 Popup Components (Maestro Controlled)

Maestro can inject components into chat:

| Component | Purpose |
|-----------|---------|
| `DecisionCard` | Show locked decisions with checkmark |
| `EditingCard` | Show current editing status with progress |
| `TaskCard` | Show task with steps/checklist |
| `CodeBlock` | Syntax highlighted code |
| `FileReference` | Link to file with preview |
| `MemoryCard` | Show working memory state |
| `ConfirmDialog` | Ask user to confirm action |
| `InputRequest` | Request specific input from user |

**Component Registry**:
```typescript
interface PopupComponent {
  type: 'decision' | 'editing' | 'task' | 'code' | 'file' | 'memory' | 'confirm' | 'input';
  payload: Record<string, unknown>;
  dismissable: boolean;
  actions?: { label: string; action: string }[];
}
```

### 2.3 Chat Input with Voice

- [ ] Mic button in input area
- [ ] Hold-to-record (spacebar shortcut)
- [ ] Visual recording indicator (pulsing red)
- [ ] Transcription preview before send
- [ ] Voice works globally (taskbar icon)

---

## FEATURE 3: 52px STATUS BAR (Fixed Bottom)

From mockup:
```
┌─────────────────────────────────────────────────────────────────────┐
│ System Vitals: Online │ VRAM: 8.2/12GB │ SIGLIP: Processing │ Guardian: WATCHING │
└─────────────────────────────────────────────────────────────────────┘
```

### Components:
- [ ] System Vitals indicator (Online/Degraded/Offline)
- [ ] VRAM Usage (X.X/YY GB format)
- [ ] Active model status (Processing/Idle/Error)
- [ ] Guardian status (WATCHING/ALERT/OFF)
- [ ] Timestamp

### Real-time Updates:
- [ ] Poll hardware metrics every 2 seconds
- [ ] WebSocket/SSE for instant status changes
- [ ] Color coding: Green=good, Yellow=warning, Red=error

---

## FEATURE 4: DASHBOARD (Persistent Project View)

From mockup - main dashboard shows:

### 4.1 Gauges Section
- [ ] VRAM Usage (arc gauge)
- [ ] Context Load (arc gauge)
- [ ] GPU % utilization

### 4.2 Real-time Graphs
- [ ] Live graph showing activity over time
- [ ] Tokens in/out
- [ ] Response latency

### 4.3 Task Pipeline Visualization
From mockup shows:
```
Optimizing Build → Deploying Microservice → Analyzing Dependencies
```

- [ ] Visual flow of current tasks
- [ ] Status per task (pending/active/complete)
- [ ] Click to expand details

### 4.4 Quick Access / Project Selection
- [ ] Project cards grid
- [ ] Quick switch between projects
- [ ] Recently accessed projects
- [ ] Add new project button

---

## FEATURE 5: SIDEBAR (52px Icon-Only)

From mockup - left sidebar icons:
- [ ] Home (Dashboard)
- [ ] Projects
- [ ] Docs
- [ ] Gallery
- [ ] Settings

### Behavior:
- [ ] Icon-only by default (52px width)
- [ ] Hover tooltip shows label
- [ ] Optional: expand on hover to show labels

---

## FEATURE 6: TOP BAR (66px)

From mockup:
```
┌─────────────────────────────────────────────────────────────────────┐
│ [≡] │ Maestro Status: ACTIVE │ [(•)) PULSE FEED ] │ ⚙ Gold Ring   │
│     │                        │                     │ Level 10 Arch │
└─────────────────────────────────────────────────────────────────────┘
```

### Components:
- [ ] Hamburger menu (≡)
- [ ] Maestro Status badge (ACTIVE/THINKING/OFFLINE)
- [ ] Pulse Feed indicator with notification count
- [ ] User profile badge (name + level/rank)

---

## FEATURE 7: VOICE INTEGRATION

### 7.1 Voice Status Indicators
- [ ] TTS model loaded: Yes/No
- [ ] STT model loaded: Yes/No
- [ ] Microphone access: Granted/Denied
- [ ] Audio output: Configured/Error

### 7.2 Voice in Chat
- [ ] Mic button next to send
- [ ] Press-and-hold recording
- [ ] Voice waveform during recording
- [ ] Auto-transcribe to input field

### 7.3 Global Voice
- [ ] System tray mic icon
- [ ] Global hotkey (Ctrl+Shift+V)
- [ ] Voice commands: "Hey Maestro..."

---

## FEATURE 8: CORTEX VIEWER

Visual representation of AI thinking:

```
┌─────────────────────────────────────────────────────────────────────┐
│ CORTEX VIEWER                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [Signal In] ──► [Embed] ──► [Search] ──► [Rerank] ──► [Generate] │
│       │              │           │            │             │       │
│       ▼              ▼           ▼            ▼             ▼       │
│    "user Q"     1024-dim     50 hits      Top-10       Response     │
│                              ~20ms        ~50ms         ~2000ms     │
│                                                                     │
│   Context Assembly:                                                 │
│   ████████████████████░░░░░░░░ 2048/4096 tokens                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

- [ ] Pipeline stage visualization
- [ ] Latency per stage
- [ ] Token counts
- [ ] Memory usage per stage

---

## FEATURE 9: MINIONS (from mockup)

Dashboard shows "Minions" section with character avatars:
- [ ] Minion cards with avatars
- [ ] Status per minion (active/idle/error)
- [ ] GPU allocation per minion
- [ ] Task assignment view

---

## FEATURE 10: PROJECT MANAGEMENT (MAPP SYSTEM)

### 10.1 MAPP = Managed APP (DevPulse Internal Project)

Each project is a MAPP with its own isolated data:

```
%APPDATA%/DevPulse/projects/
├── {project-uuid}/
│   ├── vectors/           # RRO collection for this project
│   │   └── devpulse_chunks_{uuid}.rro
│   ├── libsql/            # Project-local database
│   │   └── project.db
│   ├── cache/             # Embedding cache, temp files
│   ├── config.json        # Project-specific settings
│   └── manifest.json      # Project metadata
```

### 10.2 Create New MAPP Dialog

**UI Flow**:
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE NEW MAPP                                        [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Project Name: [________________________]                   │
│                                                             │
│  Source Folder: [D:\projects\my-app________] [Browse]       │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  MAPP will create:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📁 vectors/      - Vector embeddings for search     │   │
│  │ 📁 libsql/       - Project database                 │   │
│  │ 📁 cache/        - Temporary files                  │   │
│  │ 📄 config.json   - Project settings                 │   │
│  │ 📄 manifest.json - Metadata                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Storage Location:                                          │
│  %APPDATA%/DevPulse/projects/{uuid}/                       │
│                                                             │
│  Estimated Size: ~50MB (before indexing)                   │
│                                                             │
│                              [Cancel]  [Create MAPP]        │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 Add Existing Folder (with Indexing)

When adding an existing project folder:

**Phase 1: Scanning**
- [ ] Show file tree being discovered
- [ ] Count files by type (code, docs, config)
- [ ] Estimate index size

**Phase 2: Chunking**
- [ ] Split files into semantic chunks
- [ ] Progress: X/Y files chunked

**Phase 3: Embedding**
- [ ] Generate vectors for each chunk
- [ ] Show embedding model working
- [ ] Progress: X/Y chunks embedded

**Phase 4: Uploading**
- [ ] Store vectors in RRO
- [ ] Store metadata in libSQL
- [ ] Progress: X/Y points uploaded

**Phase 5: Attunement**
- [ ] Build search indices
- [ ] Warm up caches
- [ ] Verify integrity

### 10.4 Indexing Screen with Animated Minions

```
┌─────────────────────────────────────────────────────────────────────┐
│ INDEXING PROJECT: my-awesome-app                               [X]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │     🤖        🦊          🐸          🦉                   │   │
│  │    Chunky    Ember       Hoppy       Sage                  │   │
│  │   (Chunking) (Embedding) (Uploading) (Indexing)            │   │
│  │      ⚡         💤          💤         💤                  │   │
│  │                                                             │   │
│  │   [Minions dash around during their active phase]          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Stage: CHUNKING                                                    │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░ 42%                        │
│                                                                     │
│  Files scanned:    1,247                                           │
│  Chunks created:   3,891 / 9,200                                   │
│  Embeddings:       0 / 3,891                                       │
│  Time elapsed:     00:01:34                                        │
│  Est. remaining:   00:02:15                                        │
│                                                                     │
│  Currently processing:                                              │
│  src/components/UserProfile.tsx                                    │
│                                                                     │
│                                              [Cancel]  [Background] │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.5 DevPulse as Project #0 (Dogfooding)

On first run, DevPulse MUST:
- [ ] Auto-detect its own installation path
- [ ] Create MAPP for itself as Project #0
- [ ] Index its own codebase
- [ ] Use itself for context in chat

**Bootstrap Flow**:
```
1. First launch detected (no projects exist)
2. Show "Welcome to DevPulse" screen
3. Offer: "Add DevPulse as your first project?"
4. If yes: Create MAPP, index DevPulse source
5. Project #0 = DevPulse itself
```

### 10.6 Project Data Structure

**manifest.json**:
```json
{
  "id": "uuid-here",
  "name": "my-awesome-app",
  "source_path": "D:\\projects\\my-app",
  "created_at": "2026-01-09T10:00:00Z",
  "last_indexed": "2026-01-09T10:05:00Z",
  "stats": {
    "files_indexed": 1247,
    "chunks_created": 9200,
    "total_tokens": 450000,
    "vector_size_mb": 28.5
  },
  "config": {
    "ignore_patterns": ["node_modules", ".git", "dist"],
    "max_file_size_kb": 500,
    "languages": ["typescript", "rust", "python"]
  }
}
```

**project.db (libSQL) Tables**:
```sql
-- Project-local tables
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  start_line INTEGER,
  end_line INTEGER,
  content TEXT NOT NULL,
  token_count INTEGER,
  chunk_type TEXT, -- 'code' | 'doc' | 'config'
  created_at INTEGER
);

CREATE TABLE file_index (
  path TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  last_modified INTEGER,
  last_indexed INTEGER,
  chunk_count INTEGER
);

CREATE TABLE project_chat (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  role TEXT,
  content TEXT,
  timestamp INTEGER
);
```

### 10.7 Project UI Components

**Files to Create**:
```
desktop/src/lib/features/projects/
├── CreateMappDialog.svelte      # New MAPP creation dialog
├── AddProjectDialog.svelte      # Add existing folder (EXISTS - enhance)
├── IndexingScreen.svelte        # Full-screen indexing with minions
├── ProjectCard.svelte           # Project card in grid (EXISTS - enhance)
├── ProjectsView.svelte          # Projects list/grid view (EXISTS - enhance)
├── MinionAnimation.svelte       # Animated minion characters
└── index.ts
```

### 10.8 Required Backend Commands

```rust
// Project management
create_mapp(name: String, source_path: String) -> MappInfo
delete_mapp(project_id: String)
get_mapp_info(project_id: String) -> MappInfo
list_mapps() -> Vec<MappInfo>

// Indexing
start_indexing(project_id: String) -> IndexingHandle
cancel_indexing(project_id: String)
get_indexing_progress(project_id: String) -> IndexProgress

// Bootstrap
bootstrap_devpulse() -> MappInfo  // Create DevPulse as project #0
is_first_run() -> bool
```

### 10.9 Acceptance Criteria

- [ ] Can create new MAPP from UI
- [ ] Shows what will be created (folders, files)
- [ ] Can add existing folder
- [ ] Indexing shows animated minions
- [ ] Each minion activates during their phase
- [ ] Progress shows files/chunks/embeddings counts
- [ ] Can run indexing in background
- [ ] DevPulse offers to add itself on first run
- [ ] Project data stored in user's AppData
- [ ] Each project has isolated vectors + database

---

## FILES TO CREATE

### Svelte Components:
```
desktop/src/lib/features/models/
├── ModelLoaderPanel.svelte      # Main model control panel
├── ModelCard.svelte             # Individual model card
├── VramGauge.svelte             # Arc gauge for VRAM
├── ContextGauge.svelte          # Arc gauge for context
├── ModelDownloader.svelte       # Download UI
├── ModelAssignDialog.svelte     # Assign model to role
└── index.ts

desktop/src/lib/features/cortex/
├── CortexViewer.svelte          # Pipeline visualization
├── StageNode.svelte             # Single pipeline stage
└── index.ts

desktop/src/lib/components/chat/
├── PopupComponent.svelte        # Generic popup container
├── DecisionCard.svelte          # Decision locked card
├── EditingCard.svelte           # Editing status card
├── TaskCard.svelte              # Task checklist card
├── MemoryCard.svelte            # Working memory card
└── index.ts

desktop/src/lib/components/layout/
├── StatusBar.svelte             # 52px fixed bottom bar
├── TopBar.svelte                # 66px top bar
├── IconSidebar.svelte           # 52px icon-only sidebar
└── index.ts
```

### Tauri Commands to Add:
```rust
get_hardware_metrics()           // Real CPU/RAM/GPU/VRAM
download_model(url, path)        // Download from HuggingFace
cancel_download(download_id)     // Cancel in-progress download
assign_model_role(role, model_id) // Set model for role in DB
get_model_assignments()          // Get all role assignments
```

### API Wrappers:
```typescript
// desktop/src/lib/api/hardware.ts
getHardwareMetrics(): Promise<HardwareMetrics>
subscribeToHardwareMetrics(callback, interval): Unsubscribe

// desktop/src/lib/api/downloads.ts
downloadModel(url: string): Promise<DownloadHandle>
cancelDownload(id: string): Promise<void>
onDownloadProgress(callback): Unsubscribe
```

---

## IMPLEMENTATION ORDER

| Phase | Features | Priority |
|-------|----------|----------|
| 1 | Hardware metrics + Model Loader UI | CRITICAL |
| 2 | Status Bar (52px) | CRITICAL |
| 3 | Chat popup components | HIGH |
| 4 | Voice in chat | HIGH |
| 5 | Top Bar + Icon Sidebar | MEDIUM |
| 6 | Cortex Viewer | MEDIUM |
| 7 | Model Download | MEDIUM |
| 8 | Dashboard gauges | MEDIUM |

---

## ACCEPTANCE CRITERIA

### Phase 1 Complete When:
- [ ] Can see real VRAM/RAM/CPU usage
- [ ] Can load/unload VL model with visual feedback
- [ ] Can assign models to roles via UI
- [ ] Model assignments persist in database
- [ ] Loading shows real progress stages

### Phase 2 Complete When:
- [ ] 52px status bar visible at bottom
- [ ] Shows real VRAM usage
- [ ] Updates every 2 seconds
- [ ] Color-coded status indicators

### Phase 3 Complete When:
- [ ] Chat can render DecisionCard
- [ ] Chat can render EditingCard
- [ ] Chat can render TaskCard
- [ ] Maestro can inject components via signal

---

## DO NOT SHIP WITHOUT:

1. ✗ Real hardware metrics (not mock)
2. ✗ Model loader with real progress
3. ✗ Model role assignment in database
4. ✗ Status bar with VRAM display
5. ✗ Voice button in chat input
6. ✗ Chat popup component system

---

*This checklist is the source of truth. Every checkbox must be completed.*
