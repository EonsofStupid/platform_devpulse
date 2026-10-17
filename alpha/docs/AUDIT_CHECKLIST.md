# DevPulse UI/UX Audit Checklist

## Executive Summary

**Problem**: `alpha/` has a broken, flat structure that doesn't match the original vision.
**Solution**: Port the domain-based architecture from `desktop/` (non-alpha) to `alpha/desktop/`.

---

## Architecture Comparison

### Non-Alpha Desktop (ORIGINAL VISION) - `desktop/src/lib/`
```
domains/
  chat/
    components/   Chat.svelte, ContactList.svelte, RuminationPanel.svelte, MessageBubble.svelte
    stores/       messages.ts, session.ts, contacts.ts
    services/     chat.ts
    types/        index.ts
  dashboard/
    components/   Dashboard.svelte, SystemStatus.svelte, ProjectsOverview.svelte, QuickActions.svelte, ActivityFeed.svelte, RotiDisplay.svelte, MinionStatus.svelte
    stores/       metrics.ts
    types/        index.ts
  settings/
    components/   Settings.svelte, GlobalSettings.svelte, AISettings.svelte, MemorySettings.svelte, ProjectSettings.svelte
    stores/       settings.ts
    services/     settings.ts
    types/        index.ts
  voice/
    components/   VoiceTools.svelte, TextToSpeech.svelte, VoiceCloning.svelte, VoiceUpload.svelte
    stores/       voice.ts
    services/     voice.ts
    types/        index.ts
  gallery/
    components/   Gallery.svelte, ScreenshotGrid.svelte, ScreenshotCard.svelte
    stores/       gallery.ts
    services/     gallery.ts
    types/        index.ts
  friends/
    components/   Friends.svelte, FriendsList.svelte, FriendCard.svelte
    stores/       friends.ts
    services/     friends.ts
    types/        index.ts
components/
  ui/             Button, Card, Input, Panel, Toggle, Badge, Modal, Tabs
  layout/         Navigation, Header, Sidebar
  chat/           ChatOverlay
stores/           app.ts, user.ts, theme.ts, notifications.ts, rumination.ts, chat.ts
services/         tauri.ts, config.ts
```

### Alpha Desktop (CURRENT BROKEN) - `alpha/desktop/src/lib/`
```
features/                 # FLAT! No domain separation
  dashboard/              DashboardView.svelte ONLY
  friends/                FriendsView.svelte ONLY (STUB)
  gallery/                GalleryView.svelte ONLY (STUB)
  howto/                  HowToView.svelte (NOT IN ORIGINAL)
  media/                  MediaView.svelte (NOT IN ORIGINAL)
  news/                   NewsView.svelte (NOT IN ORIGINAL)
  projects/               ProjectsView.svelte, AddProjectDialog, IndexingProgress, ProjectCard
  pulse/                  PulseView.svelte (NOT IN ORIGINAL)
  settings/               SettingsView.svelte ONLY
  thinkspace/             ThinkspaceView.svelte (NOT IN ORIGINAL)
  voice/                  VoiceView.svelte (BROKEN - TODO stub)
components/
  chat/                   ChatOverlay, ChatView, ChatInput, MessageList
  layout/                 Header, Shell, Sidebar
  ui/                     Button, Card, Input, Panel, Toggle, Badge, Modal, Tabs
stores/                   SOME exist but scattered
```

---

## Component-by-Component Audit

### Dashboard

| Component | Non-Alpha (Original) | Alpha (Current) | Status |
|-----------|---------------------|-----------------|--------|
| Main Dashboard | Dashboard.svelte - Hero + 2-column grid | DashboardView.svelte - System status focus | DIFFERENT |
| SystemStatus | FULL - Engine/RRO/Models/Database grid, P50/P95/P99 latency, Minion list | PARTIAL - System components only | MISSING LATENCY + MINIONS |
| ProjectsOverview | EXISTS - Recent projects panel | EXISTS - but inline in DashboardView | OK |
| QuickActions | EXISTS - Quick action buttons | MISSING | **MISSING** |
| ActivityFeed | EXISTS - Recent activity list | MISSING | **MISSING** |
| RotiDisplay | EXISTS - Return on Time Invested score | MISSING | **MISSING** |
| MinionStatus | EXISTS - Sub-agent status list | MISSING | **MISSING** |

### Chat

| Component | Non-Alpha (Original) | Alpha (Current) | Status |
|-----------|---------------------|-----------------|--------|
| Main Chat | Chat.svelte - 3-panel (contacts, messages, rumination) | ChatView.svelte - Simple 2-panel | **MISSING RUMINATION PANEL** |
| ContactList | EXISTS - Sidebar with contacts | MISSING - No contact concept | **MISSING** |
| MessageList | EXISTS | EXISTS | OK |
| Input | EXISTS - Dedicated component | ChatInput.svelte | OK |
| RuminationPanel | EXISTS - Shows AI thinking | MISSING | **MISSING** |
| ConversationHeader | EXISTS | MISSING | **MISSING** |
| Two Tabs (Social/Default) | NOT IN ORIGINAL | **REQUIRED** | **NEEDS DESIGN** |

### Settings

| Component | Non-Alpha (Original) | Alpha (Current) | Status |
|-----------|---------------------|-----------------|--------|
| Settings Container | Settings.svelte - Left nav + content | SettingsView.svelte - Similar layout | OK |
| GlobalSettings | EXISTS - Start on boot, minimize to tray | EXISTS - inline | OK |
| AISettings | EXISTS - FULL - Rumination mode, Pipeline toggles (RRO, Embedder, Reranker, CAG), Sub-agent toggles (8 minions), Models | PARTIAL - Only model selection | **MISSING PIPELINE/MINION TOGGLES** |
| MemorySettings | EXISTS | MISSING | **MISSING** |
| ProjectSettings | EXISTS | MISSING | **MISSING** |
| SSOT Backend Sync | EXISTS - invoke('get_pipeline_settings'), invoke('set_feature') | PARTIAL - Model loading only | **INCOMPLETE** |

### Voice

| Component | Non-Alpha (Original) | Alpha (Current) | Status |
|-----------|---------------------|-----------------|--------|
| VoiceTools | EXISTS - 3-tab (TTS, STT, Clone) | MISSING | **MISSING** |
| TextToSpeech | EXISTS | MISSING | **MISSING** |
| VoiceCloning | EXISTS | MISSING | **MISSING** |
| VoiceUpload | EXISTS - File upload for cloning | MISSING | **MISSING** |
| VoiceView | N/A | EXISTS - Broken TODO stub | **BROKEN** |

### Gallery

| Component | Non-Alpha (Original) | Alpha (Current) | Status |
|-----------|---------------------|-----------------|--------|
| Gallery | EXISTS | GalleryView.svelte | LIKELY STUB |
| ScreenshotGrid | EXISTS | MISSING | **MISSING** |
| ScreenshotCard | EXISTS | MISSING | **MISSING** |

### Friends

| Component | Non-Alpha (Original) | Alpha (Current) | Status |
|-----------|---------------------|-----------------|--------|
| Friends | EXISTS | FriendsView.svelte | LIKELY STUB |
| FriendsList | EXISTS | MISSING | **MISSING** |
| FriendCard | EXISTS - With avatar, status, onlineStatus | MISSING | **MISSING** |

---

## Lab UI Audit

### Reference (React Lab) vs Current (Svelte Lab)

| Page | Reference Features | Current Status |
|------|-------------------|----------------|
| Dashboard | ROTI score, Sessions count, Time saved, SignalStream | MISSING: ROTI, Sessions, Time saved |
| Pipeline | Hot→Cold data flow (Moka→libSQL→RRO→DuckDB), ML Models (Embedder, Reranker, Llm), Retrieval latency (P50/P99) | **PAGE MISSING** |
| Analytics | Events chart, Query volume, Model performance | **PAGE MISSING** |
| Signals | Real-time signal stream, Layer indicators | PARTIAL - Has SignalStream, LayerIndicator |
| Rumination | Layer visualization, Active thoughts | PARTIAL - LayerIndicator |
| Voice | Upload zone (50MB), Multi-select, Profile list, Sample list, Sherpa training | PARTIAL - Missing upload zone, Sherpa |

---

## Backend Integration Audit

### Tauri Commands Required (alpha/desktop)

| Command | Non-Alpha Has | Alpha Has | Status |
|---------|---------------|-----------|--------|
| get_system_health | YES | YES (get_system_status) | OK |
| get_minion_metrics | YES | MISSING | **MISSING** |
| get_latency_metrics | YES | MISSING | **MISSING** |
| get_pipeline_settings | YES | MISSING | **MISSING** |
| set_feature | YES | MISSING | **MISSING** |
| list_models | N/A | YES | OK |
| load_model | N/A | YES | OK |

### Lab Backend Routes Required

| Route | Status | Notes |
|-------|--------|-------|
| /api/pipeline/status | MISSING | Need Hot→Cold flow data |
| /api/pipeline/metrics | MISSING | Need retrieval latency |
| /api/analytics/* | MISSING | Need DuckDB queries |
| /api/signals/stream | PARTIAL | WebSocket needed |
| /api/voice/upload | PARTIAL | 50MB support needed |

---

## Critical Fixes Required

### Priority 1: Structure
1. Port domain-based architecture from `desktop/` to `alpha/desktop/`
2. Each domain gets: components/, stores/, services/, types/, index.ts
3. Remove features/ flat structure

### Priority 2: Missing Components
1. **Dashboard**: RotiDisplay, MinionStatus, ActivityFeed, QuickActions
2. **Chat**: RuminationPanel, ContactList, ConversationHeader, TWO TABS (Social + Default)
3. **Settings**: AISettings (pipeline toggles, minion toggles), MemorySettings, ProjectSettings
4. **Voice**: VoiceTools with 3 tabs (TTS, STT, Clone), actual STT/TTS implementation

### Priority 3: Backend Wiring
1. Add Tauri commands: get_minion_metrics, get_latency_metrics, get_pipeline_settings, set_feature
2. Wire SSOT configuration to libSQL persistence
3. Add Lab routes for Pipeline and Analytics

### Priority 4: Lab
1. Create Pipeline page with data flow visualization
2. Create Analytics page with DuckDB charts
3. Add WebSocket for real-time signals
4. Add 50MB upload support for voice

---

## Files to Create

### In alpha/desktop/src/lib/domains/

```
chat/
  components/
    Chat.svelte
    ContactList.svelte
    ContactItem.svelte
    ConversationHeader.svelte
    MessageList.svelte
    MessageBubble.svelte
    Input.svelte
    RuminationPanel.svelte
  stores/
    messages.ts
    session.ts
    contacts.ts
  services/
    chat.ts
  types/
    index.ts
  index.ts

dashboard/
  components/
    Dashboard.svelte
    SystemStatus.svelte
    ProjectsOverview.svelte
    QuickActions.svelte
    ActivityFeed.svelte
    RotiDisplay.svelte
    MinionStatus.svelte
  stores/
    metrics.ts
  types/
    index.ts
  index.ts

settings/
  components/
    Settings.svelte
    GlobalSettings.svelte
    AISettings.svelte
    MemorySettings.svelte
    ProjectSettings.svelte
  stores/
    settings.ts
  services/
    settings.ts
  types/
    index.ts
  index.ts

voice/
  components/
    VoiceTools.svelte
    TextToSpeech.svelte
    SpeechToText.svelte
    VoiceCloning.svelte
    VoiceUpload.svelte
  stores/
    voice.ts
  services/
    voice.ts
  types/
    index.ts
  index.ts
```

---

## Data Capture Audit (libSQL + DuckDB)

### libSQL - SSOT Data Layer (`orchestrator/src/infra/libsql.rs`)

| Table | Status | Purpose | Used By |
|-------|--------|---------|---------|
| projects | IMPLEMENTED | Global project registry with UUID | Desktop, Lab |
| sessions | IMPLEMENTED | Per-project conversation sessions | Desktop |
| messages | IMPLEMENTED | Clean rendered conversation history | Desktop Chat |
| decisions | IMPLEMENTED | Locked choices from parking lot | RAG system |
| chunks | IMPLEMENTED | RAG chunks with embedding metadata | RRO/RAG |
| lane_runs | IMPLEMENTED | Trace correlation for multi-hop execution | Analytics |
| llm_calls | IMPLEMENTED | Token usage and latency tracking | Analytics |
| governance_violations | IMPLEMENTED | 9 Umbrellas safety tracking | Governance |
| voice_profiles | IMPLEMENTED | Custom voice profiles for TTS | Voice system |
| voice_samples | IMPLEMENTED | Uploaded samples for cloning | Voice system |
| personas | IMPLEMENTED | Maestro personality configs | Chat |
| active_models | IMPLEMENTED | Persisted model selection per family | Model switching |

**libSQL Methods Status:**
- Projects: create, get, list, delete, touch, find_by_path - ALL IMPLEMENTED
- Sessions: create, end, list, delete, touch - ALL IMPLEMENTED
- Messages: record, get - IMPLEMENTED
- Decisions: create, get - IMPLEMENTED
- Chunks: store, get_for_source, delete_for_source - IMPLEMENTED
- Voice: create_profile, list_profiles, get_profile, set_active, delete, samples CRUD - ALL IMPLEMENTED
- Personas: save, get, get_active, list, set_active, delete, ensure_default - ALL IMPLEMENTED
- Active Models: set, get, get_all, clear - ALL IMPLEMENTED

### DuckDB - Analytics Layer (`orchestrator/src/infra/duckdb.rs`)

| Table | Status | Purpose | Notes |
|-------|--------|---------|-------|
| events | IMPLEMENTED | Generic telemetry events | Working |
| inference_metrics | IMPLEMENTED | Model token usage + latency | Working |
| hop_metrics | IMPLEMENTED | Multi-hop confidence tracking | Working |

**DuckDB Methods Status:**
- `record_event(event_type, data)` - IMPLEMENTED
- `record_inference(model_id, tokens_in, tokens_out, latency_ms)` - IMPLEMENTED
- `record_hop(session_id, hop_number, confidence, latency_ms)` - IMPLEMENTED
- `get_inference_stats()` - IMPLEMENTED (returns InferenceStats)
- `get_event_count()` - IMPLEMENTED
- `get_hop_stats()` - IMPLEMENTED (returns HopStats)

**DuckDB Features:**
- Concurrent access handling with fallback to in-memory mode
- Separate `open_with_path()` for Lab's dedicated database
- IS fallback detection via `is_fallback_mode()`

### What's MISSING for Full Data Capture

| Missing | Impact | Priority |
|---------|--------|----------|
| ROTI metrics table | Can't show Time Saved score | HIGH |
| Query latency (P50/P95/P99) aggregation | Lab can't show retrieval latency | HIGH |
| Signal event recording | No signal history for replay | MEDIUM |
| DuckDB time-series queries | No charts in Lab Analytics | HIGH |

### Lab API Routes Needed

| Route | Backend | Status |
|-------|---------|--------|
| GET /api/analytics/events | DuckDB get_event_count | NEEDS ROUTE |
| GET /api/analytics/inference | DuckDB get_inference_stats | NEEDS ROUTE |
| GET /api/analytics/hops | DuckDB get_hop_stats | NEEDS ROUTE |
| GET /api/analytics/roti | DuckDB (not implemented) | NEEDS TABLE + ROUTE |
| GET /api/pipeline/status | libSQL + memory state | NEEDS ROUTE |
| GET /api/pipeline/metrics | DuckDB P50/P95/P99 | NEEDS AGGREGATION + ROUTE |

---

## Verification Checklist

Before marking "done":

- [ ] Domain-based structure in place (chat/, dashboard/, settings/, voice/, gallery/, friends/)
- [ ] Each domain has: components/, stores/, services/, types/, index.ts
- [ ] Dashboard shows: SystemStatus, RotiDisplay, MinionStatus, ActivityFeed, QuickActions
- [ ] Chat has TWO tabs: Social and Default
- [ ] Chat has RuminationPanel visible
- [ ] Settings has AISettings with pipeline toggles and minion toggles
- [ ] Settings SSOT syncs with backend (invoke get_pipeline_settings, set_feature)
- [ ] Voice has 3 tabs: TTS, STT, Clone
- [ ] Voice TTS actually speaks (not TODO stub)
- [ ] Lab Pipeline page shows Hot→Cold data flow
- [ ] Lab Analytics page shows DuckDB charts
- [ ] Lab signals use WebSocket (not polling)
- [ ] Lab voice upload supports 50MB files
