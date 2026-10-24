# DevPulse Platform Architecture

## What DevPulse Actually Is

**NOT an MVP. NOT a chat wrapper.**

DevPulse is a **middleware development platform** for:
- AI-assisted project management
- Multi-project organization and context
- Documentation and knowledge capture
- Gallery/media asset management
- Voice interaction layer
- Learning and growth tracking (ROTI)

---

## Scope: GLOBAL vs PROJECT

```
GLOBAL (User Level)                     PROJECT (Workspace Level)
================================        ================================
User preferences                        Project settings
Maestro personas                        Project-specific decisions
Voice profiles                          RAG chunks & embeddings
Friends list                            Sessions & conversations
Gallery (cross-project)                 Project files index
Learning history                        Project-specific context
ROTI lifetime metrics                   Project ROTI metrics
Model preferences                       Project model overrides
Global keybindings                      Project-specific commands
```

### Data Storage Map

```
GLOBAL DATA (libSQL: ~/.devpulse/global.db)
├── personas           → Maestro personalities (shared across all projects)
├── voice_profiles     → TTS voices (shared)
├── voice_samples      → Cloning samples (shared)
├── friends            → Social contacts (shared)
├── user_settings      → Theme, keybindings, preferences
├── active_models      → Current model selections
├── gallery_items      → Screenshots, media (can link to projects)
└── learning_events    → What user learned, time saved

PROJECT DATA (libSQL: ~/.devpulse/projects/{uuid}/project.db)
├── sessions           → Conversation sessions
├── messages           → Chat history
├── decisions          → Locked architectural choices
├── chunks             → RAG chunks for this project
├── lane_runs          → Trace correlation
├── llm_calls          → Token usage per project
└── project_settings   → Project-specific overrides

ANALYTICS (DuckDB: ~/.devpulse/analytics.duckdb)
├── events             → All telemetry events
├── inference_metrics  → Model performance
├── hop_metrics        → Multi-hop confidence
├── roti_events        → Time saved calculations
└── query_latency      → P50/P95/P99 retrieval times
```

---

## Desktop UI Architecture

### Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Maestro Status | Project Selector | Search | Settings  │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│  SIDEBAR   │                    MAIN CONTENT                    │
│            │                                                    │
│  ┌──────┐  │  ┌─────────────────────────────────────────────┐  │
│  │ Home │  │  │                                             │  │
│  ├──────┤  │  │     Content changes based on selection      │  │
│  │ Chat │  │  │                                             │  │
│  ├──────┤  │  │                                             │  │
│  │ Proj │  │  │                                             │  │
│  ├──────┤  │  └─────────────────────────────────────────────┘  │
│  │ Docs │  │                                                    │
│  ├──────┤  │  ┌─────────────────────────────────────────────┐  │
│  │ Gall │  │  │              RUMINATION PANEL               │  │
│  ├──────┤  │  │         (collapsible, always available)     │  │
│  │ Voice│  │  └─────────────────────────────────────────────┘  │
│  ├──────┤  │                                                    │
│  │Social│  │                                                    │
│  └──────┘  │                                                    │
│            │                                                    │
│  ────────  │                                                    │
│  QUICK     │                                                    │
│  ACTIONS   │                                                    │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

### Sidebar Groups

```
GROUP 1: CORE (Always visible)
├── Home/Dashboard     → System status, ROTI, quick stats
├── Chat               → Two tabs: DEFAULT (Maestro) | SOCIAL (Friends)
└── Projects           → Project list, switching, management

GROUP 2: WORKSPACE (Context-aware)
├── Docs               → Project documentation, decisions, notes
├── Gallery            → Screenshots, diagrams, media
└── Files              → Project file browser with AI context

GROUP 3: TOOLS
├── Voice              → TTS/STT/Cloning tools
├── Models             → Model management, loading, testing
└── Learn              → Learning history, tutorials, growth

GROUP 4: SOCIAL
├── Friends            → Contact list, online status
├── Share              → Share snippets, projects, decisions
└── Community          → (Future) DevPulse community

GROUP 5: SYSTEM (Bottom)
├── Settings           → Full settings panel
├── Lab                → Opens Lab in browser
└── Help               → Documentation, support
```

---

## Page Specifications

### 1. HOME/DASHBOARD

**Purpose**: At-a-glance system health and productivity metrics

```
┌─────────────────────────────────────────────────────────────────┐
│                         WELCOME HERO                            │
│   "Welcome back, [User]"    |    [AI Status: Online/Offline]   │
├─────────────────────────────┴───────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │    ROTI     │  │   SESSIONS  │  │   PROJECTS  │  │ MODELS │ │
│  │   Score     │  │    Today    │  │    Active   │  │ Loaded │ │
│  │    2.4x     │  │      12     │  │      5      │  │   3    │ │
│  │  time saved │  │             │  │             │  │        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘ │
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │      SYSTEM STATUS          │  │     RECENT ACTIVITY     │  │
│  │  ● Engine      Online       │  │  - Indexed project X    │  │
│  │  ● RRO      Online       │  │  - Chat session ended   │  │
│  │  ● Llm (4B)  Loaded       │  │  - Decision locked      │  │
│  │  ● Embedder    Loaded       │  │  - Voice sample added   │  │
│  │  ● Database    Connected    │  │                         │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │     QUICK ACTIONS           │  │    RECENT PROJECTS      │  │
│  │  [New Chat] [New Project]   │  │  > alpha_devpulse       │  │
│  │  [Voice] [Settings]         │  │  > my-rust-app          │  │
│  │                             │  │  > frontend-redesign    │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- ROTI Score: DuckDB `roti_events` aggregate
- Sessions: libSQL `sessions` count today
- Projects: libSQL `projects` count
- Models: Engine state
- System Status: Tauri `get_system_status`
- Activity: libSQL recent events
- Quick Actions: Static buttons
- Recent Projects: libSQL `projects` ORDER BY last_accessed

---

### 2. CHAT

**Purpose**: Primary interaction with Maestro and social contacts

```
┌─────────────────────────────────────────────────────────────────┐
│  [DEFAULT TAB]  |  [SOCIAL TAB]                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DEFAULT TAB CONTENT:                                           │
│  ┌───────────────────────────────────┬─────────────────────┐   │
│  │                                   │   RUMINATION        │   │
│  │         MESSAGE AREA              │   PANEL             │   │
│  │                                   │                     │   │
│  │  [User message]                   │   Layer: Reflex     │   │
│  │  [Maestro response]               │   Thinking about... │   │
│  │  [User message]                   │                     │   │
│  │                                   │   Context:          │   │
│  │                                   │   - project files   │   │
│  │                                   │   - recent decisions│   │
│  │                                   │                     │   │
│  ├───────────────────────────────────┤   Sources:          │   │
│  │  [Input area with attachments]    │   - file1.rs:42     │   │
│  │  [Send] [Voice] [Attach]          │   - file2.ts:100    │   │
│  └───────────────────────────────────┴─────────────────────┘   │
│                                                                 │
│  SOCIAL TAB CONTENT:                                            │
│  ┌─────────────┬─────────────────────────────────────────────┐ │
│  │  CONTACTS   │              CHAT WITH [Friend]             │ │
│  │             │                                             │ │
│  │  > Alice    │  [Messages...]                              │ │
│  │    Online   │                                             │ │
│  │  > Bob      │                                             │ │
│  │    Away     │                                             │ │
│  │  > Carol    │  ┌─────────────────────────────────────────┐│ │
│  │    Offline  │  │ [Input] [Send]                          ││ │
│  └─────────────┴──┴─────────────────────────────────────────┴┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- DEFAULT: libSQL `messages`, `sessions`, engine rumination state
- SOCIAL: libSQL `friends`, `social_messages` (NEW TABLE NEEDED)

---

### 3. PROJECTS

**Purpose**: Project management and organization

```
┌─────────────────────────────────────────────────────────────────┐
│  PROJECTS                                    [+ New Project]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FILTER: [All] [Recent] [Favorites] [By Type]    [Search...]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROJECT CARD                                           │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ [Icon] alpha_devpulse                    [★] [⋮]  │ │   │
│  │  │        Rust + TypeScript                          │ │   │
│  │  │        d:\localdev\alpha_devpulse                 │ │   │
│  │  │                                                    │ │   │
│  │  │  Sessions: 45  │  Decisions: 12  │  Last: 2h ago  │ │   │
│  │  │  ████████░░░░ Indexed 78%                         │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ [Icon] my-rust-app                       [★] [⋮]  │ │   │
│  │  │        Rust                                        │ │   │
│  │  │        ...                                         │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  SELECTED PROJECT DETAILS (Expandable):                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Open Chat] [View Decisions] [Browse Files] [Settings] │   │
│  │                                                         │   │
│  │  Recent Sessions:                                       │   │
│  │  - Session #45: "Implementing VL model hot-swap" 2h ago │   │
│  │  - Session #44: "Fixing build errors" yesterday        │   │
│  │                                                         │   │
│  │  Locked Decisions:                                      │   │
│  │  - Architecture: "Use domains/ pattern for UI"          │   │
│  │  - Library: "Svelte 5 with runes"                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- libSQL `projects` table
- libSQL `sessions` count per project
- libSQL `decisions` count per project
- RRO indexing status

---

### 4. DOCS

**Purpose**: Project documentation, decisions, and knowledge capture

```
┌─────────────────────────────────────────────────────────────────┐
│  DOCS: alpha_devpulse                           [+ New Doc]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┬─────────────────────────────────────────┐   │
│  │  TREE VIEW    │            DOCUMENT VIEWER              │   │
│  │               │                                         │   │
│  │  > Decisions  │  # Architecture Decision: UI Structure  │   │
│  │    > Arch     │                                         │   │
│  │    > Libs     │  **Status**: Locked                     │   │
│  │    > Patterns │  **Date**: 2026-01-09                   │   │
│  │  > Notes      │                                         │   │
│  │    > Sprint 1 │  ## Decision                            │   │
│  │    > Ideas    │  Use domain-based architecture with     │   │
│  │  > Generated  │  components/, stores/, services/, types/│   │
│  │    > API Docs │  per domain.                            │   │
│  │    > Schemas  │                                         │   │
│  │               │  ## Rationale                           │   │
│  │               │  Better separation of concerns...       │   │
│  │               │                                         │   │
│  │               │  [Edit] [Delete] [Share]                │   │
│  └───────────────┴─────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- libSQL `decisions` table
- Markdown files in project (auto-discovered)
- Generated docs from AI analysis

---

### 5. GALLERY

**Purpose**: Visual assets, screenshots, diagrams

```
┌─────────────────────────────────────────────────────────────────┐
│  GALLERY                              [Upload] [Screenshot]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCOPE: [Global] [This Project]         FILTER: [All] [Type]  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │          │  │          │  │          │  │          │       │
│  │  [img]   │  │  [img]   │  │  [img]   │  │  [img]   │       │
│  │          │  │          │  │          │  │          │       │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤       │
│  │ UI Mock  │  │ Arch Dia │  │ Error SS │  │ Flow     │       │
│  │ Jan 9    │  │ Jan 8    │  │ Jan 8    │  │ Jan 7    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  SELECTED IMAGE:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Large preview]                                        │   │
│  │                                                         │   │
│  │  Tags: [ui] [mockup] [dashboard]                        │   │
│  │  Project: alpha_devpulse                                │   │
│  │  Added: 2026-01-09                                      │   │
│  │                                                         │   │
│  │  [Ask Maestro about this] [Copy] [Delete]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- libSQL `gallery_items` (NEW TABLE NEEDED)
- File system for actual images
- AI-generated tags

---

### 6. VOICE

**Purpose**: TTS, STT, and voice cloning tools

```
┌─────────────────────────────────────────────────────────────────┐
│  VOICE TOOLS                                                    │
├─────────────────────────────────────────────────────────────────┤
│  [TTS Tab] | [STT Tab] | [Clone Tab]                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TTS TAB:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Profile: [Maestro Default ▼]                           │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │ Enter text to speak...                          │   │   │
│  │  │                                                 │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  [▶ Speak] [⏹ Stop]                                    │   │
│  │                                                         │   │
│  │  Speed: [========●==]  Pitch: [=====●=====]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  CLONE TAB:                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │                                                 │   │   │
│  │  │          DROP AUDIO FILES HERE                  │   │   │
│  │  │          (up to 50MB per file)                  │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  Uploaded Samples:                                      │   │
│  │  [x] sample1.wav  2.3MB  00:45                         │   │
│  │  [x] sample2.mp3  1.8MB  00:30                         │   │
│  │                                                         │   │
│  │  [Train Voice Profile]                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- libSQL `voice_profiles`
- libSQL `voice_samples`
- Kokoro TTS backend
- Sherpa STT backend

---

### 7. MODELS

**Purpose**: Model management, loading, testing

```
┌─────────────────────────────────────────────────────────────────┐
│  MODELS                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VRAM BUDGET: [████████░░░░░░] 8.2 / 12.0 GB                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VISION-LANGUAGE (Llm)                      [Active]  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │ Qwen3-VL-4B │  │ Qwen3-VL-8B │  │ Custom...   │     │   │
│  │  │ ████ 4.2GB  │  │ ████ 8.1GB  │  │             │     │   │
│  │  │  [LOADED]   │  │  [Ready]    │  │  [Add]      │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  EMBEDDER                                               │   │
│  │  Qwen3-0.6B-Embed                           [LOADED]    │   │
│  │  Memory: 0.8GB                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RERANKER                                               │   │
│  │  Qwen3-0.6B-Rerank                          [LOADED]    │   │
│  │  Memory: 0.6GB                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MODEL TESTING:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Test prompt: [________________________] [Run Test]     │   │
│  │                                                         │   │
│  │  Results:                                               │   │
│  │  - 4B: 245ms, 142 tokens                                │   │
│  │  - 8B: 380ms, 156 tokens (not loaded)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Data Sources**:
- libSQL `active_models`
- Engine model registry
- VRAM monitoring

---

### 8. SETTINGS

**Purpose**: Global and project-specific configuration

```
┌─────────────────────────────────────────────────────────────────┐
│  SETTINGS                                                       │
├───────────────────┬─────────────────────────────────────────────┤
│                   │                                             │
│  GLOBAL           │  GENERAL SETTINGS                           │
│  ├─ General       │  ┌─────────────────────────────────────┐   │
│  ├─ Appearance    │  │ Start on boot         [  Toggle  ]  │   │
│  ├─ AI/Pipeline   │  │ Minimize to tray      [  Toggle  ]  │   │
│  ├─ Voice         │  │ Check for updates     [  Toggle  ]  │   │
│  ├─ Keybindings   │  │ Default project       [Dropdown ▼]  │   │
│  └─ About         │  └─────────────────────────────────────┘   │
│                   │                                             │
│  PROJECT          │  AI PIPELINE SETTINGS                       │
│  ├─ General       │  ┌─────────────────────────────────────┐   │
│  ├─ AI Overrides  │  │ RRO               [  Toggle  ]   │   │
│  ├─ Decisions     │  │ Embedder             [  Toggle  ]   │   │
│  └─ Indexing      │  │ Reranker             [  Toggle  ]   │   │
│                   │  │ CAG Mode             [  Toggle  ]   │   │
│                   │  │ Show Reasoning       [  Toggle  ]   │   │
│                   │  └─────────────────────────────────────┘   │
│                   │                                             │
│                   │  SUB-AGENTS (Minions)                       │
│                   │  ┌─────────────────────────────────────┐   │
│                   │  │ PSYCH     [Always]  VISION  [  ]    │   │
│                   │  │ GUARDIAN  [Always]  VOICE   [  ]    │   │
│                   │  │ SCRIBE    [Always]  TEACHER [  ]    │   │
│                   │  │ DIARY     [Always]  RESEARCH[  ]    │   │
│                   │  └─────────────────────────────────────┘   │
│                   │                                             │
└───────────────────┴─────────────────────────────────────────────┘
```

**Data Sources**:
- libSQL `user_settings` (NEW - global settings)
- libSQL `project_settings` (NEW - per-project overrides)
- Tauri commands for backend sync

---

## New Tables Needed

### libSQL Additions

```sql
-- Global user settings (not per-project)
CREATE TABLE user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Project-specific settings/overrides
CREATE TABLE project_settings (
    project_id TEXT NOT NULL REFERENCES projects(id),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (project_id, key)
);

-- Friends/contacts for social features
CREATE TABLE friends (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline',  -- online, away, offline
    last_seen INTEGER,
    created_at INTEGER NOT NULL
);

-- Social messages (separate from AI chat)
CREATE TABLE social_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    friend_id TEXT NOT NULL REFERENCES friends(id),
    direction TEXT NOT NULL,  -- sent, received
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Gallery items (screenshots, diagrams)
CREATE TABLE gallery_items (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),  -- NULL = global
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    tags TEXT,  -- JSON array
    description TEXT,
    created_at INTEGER NOT NULL
);

-- Learning events for ROTI tracking
CREATE TABLE learning_events (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    event_type TEXT NOT NULL,  -- task_completed, time_saved, skill_gained
    description TEXT NOT NULL,
    time_saved_seconds INTEGER,  -- for ROTI calculation
    metadata TEXT,  -- JSON
    created_at INTEGER NOT NULL
);
```

### DuckDB Additions

```sql
-- ROTI (Return on Time Invested) metrics
CREATE TABLE roti_events (
    id INTEGER PRIMARY KEY,
    project_id VARCHAR,
    event_type VARCHAR NOT NULL,  -- assist, generate, refactor, debug
    time_saved_ms INTEGER NOT NULL,
    actual_time_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Query latency for P50/P95/P99 display
CREATE TABLE query_latency (
    id INTEGER PRIMARY KEY,
    query_type VARCHAR NOT NULL,  -- embed, retrieve, rerank, generate
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
```

---

## Tauri Commands Needed

### Global Commands
```rust
// Settings
get_user_settings() -> HashMap<String, String>
set_user_setting(key: String, value: String)

// Friends
list_friends() -> Vec<Friend>
add_friend(display_name: String) -> Friend
remove_friend(id: String)

// Gallery
list_gallery_items(project_id: Option<String>) -> Vec<GalleryItem>
add_gallery_item(file_path: String, project_id: Option<String>, tags: Vec<String>)
delete_gallery_item(id: String)

// ROTI
get_roti_summary() -> RotiSummary
get_roti_history(days: u32) -> Vec<RotiEvent>
```

### Pipeline Commands
```rust
get_pipeline_settings() -> PipelineSettings
set_pipeline_feature(feature: String, enabled: bool)
get_minion_status() -> Vec<MinionStatus>
toggle_minion(name: String, enabled: bool)
```

### Analytics Commands
```rust
get_latency_metrics() -> LatencyMetrics  // P50/P95/P99
get_inference_stats() -> InferenceStats
get_query_volume(hours: u32) -> Vec<QueryVolumePoint>
```

---

## Implementation Priority

### Phase 1: Core Structure
1. Create `domains/` folder structure in alpha/desktop
2. Port basic components from non-alpha desktop
3. Implement sidebar navigation with groups
4. Wire up routing

### Phase 2: Data Layer
1. Add new libSQL tables (user_settings, project_settings, friends, gallery_items, learning_events)
2. Add new DuckDB tables (roti_events, query_latency)
3. Create Tauri commands for all new data

### Phase 3: Pages
1. Dashboard with ROTI, system status, quick actions
2. Chat with two tabs (DEFAULT + SOCIAL)
3. Projects with management UI
4. Settings with full SSOT sync

### Phase 4: Advanced Features
1. Voice tools (TTS, STT, Clone)
2. Gallery with tagging
3. Docs with decision tracking
4. Models with testing

### Phase 5: Polish
1. ROTI visualization
2. Learning history
3. Social features
4. Community integration

---

## File Structure Target

```
alpha/desktop/src/lib/
├── domains/
│   ├── chat/
│   │   ├── components/
│   │   │   ├── Chat.svelte
│   │   │   ├── DefaultChat.svelte
│   │   │   ├── SocialChat.svelte
│   │   │   ├── MessageList.svelte
│   │   │   ├── MessageBubble.svelte
│   │   │   ├── Input.svelte
│   │   │   ├── RuminationPanel.svelte
│   │   │   └── ContactList.svelte
│   │   ├── stores/
│   │   │   ├── messages.svelte.ts
│   │   │   ├── session.svelte.ts
│   │   │   └── contacts.svelte.ts
│   │   ├── services/
│   │   │   └── chat.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── Dashboard.svelte
│   │   │   ├── WelcomeHero.svelte
│   │   │   ├── RotiCard.svelte
│   │   │   ├── StatsRow.svelte
│   │   │   ├── SystemStatus.svelte
│   │   │   ├── ActivityFeed.svelte
│   │   │   ├── QuickActions.svelte
│   │   │   └── RecentProjects.svelte
│   │   ├── stores/
│   │   │   └── dashboard.svelte.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── projects/
│   │   ├── components/
│   │   │   ├── Projects.svelte
│   │   │   ├── ProjectCard.svelte
│   │   │   ├── ProjectDetails.svelte
│   │   │   ├── NewProjectDialog.svelte
│   │   │   └── ProjectFilters.svelte
│   │   ├── stores/
│   │   │   └── projects.svelte.ts
│   │   ├── services/
│   │   │   └── projects.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── docs/
│   │   ├── components/
│   │   │   ├── Docs.svelte
│   │   │   ├── DocTree.svelte
│   │   │   ├── DocViewer.svelte
│   │   │   ├── DecisionCard.svelte
│   │   │   └── NoteEditor.svelte
│   │   ├── stores/
│   │   │   └── docs.svelte.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── gallery/
│   │   ├── components/
│   │   │   ├── Gallery.svelte
│   │   │   ├── GalleryGrid.svelte
│   │   │   ├── GalleryCard.svelte
│   │   │   ├── ImageViewer.svelte
│   │   │   └── UploadZone.svelte
│   │   ├── stores/
│   │   │   └── gallery.svelte.ts
│   │   ├── services/
│   │   │   └── gallery.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── voice/
│   │   ├── components/
│   │   │   ├── Voice.svelte
│   │   │   ├── TTSPanel.svelte
│   │   │   ├── STTPanel.svelte
│   │   │   ├── ClonePanel.svelte
│   │   │   ├── ProfileSelector.svelte
│   │   │   └── SampleUploader.svelte
│   │   ├── stores/
│   │   │   └── voice.svelte.ts
│   │   ├── services/
│   │   │   └── voice.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── components/
│   │   │   ├── Models.svelte
│   │   │   ├── ModelCard.svelte
│   │   │   ├── VRAMBudget.svelte
│   │   │   └── ModelTester.svelte
│   │   ├── stores/
│   │   │   └── models.svelte.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── settings/
│   │   ├── components/
│   │   │   ├── Settings.svelte
│   │   │   ├── GeneralSettings.svelte
│   │   │   ├── AppearanceSettings.svelte
│   │   │   ├── AISettings.svelte
│   │   │   ├── VoiceSettings.svelte
│   │   │   ├── KeybindSettings.svelte
│   │   │   └── AboutSection.svelte
│   │   ├── stores/
│   │   │   └── settings.svelte.ts
│   │   ├── services/
│   │   │   └── settings.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   └── social/
│       ├── components/
│       │   ├── Social.svelte
│       │   ├── FriendsList.svelte
│       │   ├── FriendCard.svelte
│       │   └── AddFriendDialog.svelte
│       ├── stores/
│       │   └── friends.svelte.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
├── components/
│   ├── ui/           # Shared UI primitives
│   └── layout/       # Shell, Sidebar, Header
├── stores/           # Global stores (app, theme, notifications)
├── services/         # Global services (tauri, config)
└── types/            # Global types
```

---

This is the ACTUAL architecture plan for DevPulse as a real platform, not an MVP.
