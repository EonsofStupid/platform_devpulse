# Lab Verification Checklist - REAL Status

**Date**: 2026-01-09
**Purpose**: Verify Lab is production-ready, not scaffolded bullshit
**Method**: Check every line of code against requirements

---

## Q1: Is Lab Real or Stub?

### Backend Routes (alpha/lab/src/routes/)

#### health.rs (119 lines)
- [ ] Line 64-79: Database check uses REAL libSQL method (`list_voice_profiles`)
- [ ] Line 81-90: Analytics check uses REAL DuckDB method (`get_event_count`)
- [ ] Line 45-62: AI pipeline check calls real `is_ai_ready()`
- [ ] Line 92-100: RRO check (correctly marked as stub)
- [ ] Line 102-112: Models check uses real `list_all()`
- [ ] Verdict: **REAL** (fixed broken execute_query calls)

#### chat.rs (140 lines)
- [x] Line 39: GET /history calls `engine.chat.history()` - **REAL** (ChatFacade.history exists)
- [x] Line 44: POST /send calls `engine.chat.send()` - **REAL** (ChatFacade.send exists Line 105)
- [x] Line 88: GET /sessions calls `engine.sessions.list()` - **REAL** (SessionRegistry)
- [x] Line 108: POST /sessions calls `engine.sessions.create()` - **REAL** (SessionRegistry)
- [x] Verdict: **100% REAL** - all methods verified in engine

#### analytics.rs (61 lines)
- [ ] Line 16: GET /summary calls Analytics (DuckDB) - **VERIFY METHOD EXISTS**
- [ ] Line 31: GET /inference calls Analytics - **VERIFY METHOD EXISTS**
- [ ] Line 44: GET /hops calls Analytics - **VERIFY METHOD EXISTS**
- [ ] Line 57: GET /events calls `analytics.get_event_count()` - **CONFIRMED REAL** (used in health check)
- [ ] Verdict: **MOSTLY REAL** - DuckDB backend exists, verify methods

#### signals.rs (98 lines)
- [x] Line 26: SSE stream subscribes to `engine.router.subscribe()` - **CONFIRMED REAL**
- [x] Line 54: WebSocket subscribes to router - **CONFIRMED REAL**
- [x] Line 70: POST /trigger emits to router - **CONFIRMED REAL**
- [x] Verdict: **100% REAL** - SignalRouter exists, emit() calls verified in engine

#### rumination.rs (135 lines)
- [ ] Line 28: GET /state returns HARDCODED mock data - **CONFIRMED STUB**
- [ ] Line 50: GET /tree returns null - **CONFIRMED STUB**
- [ ] Line 68: GET /layers returns static descriptions - **CONFIRMED STUB**
- [x] Verdict: **100% STUB** - needs wiring to orchestrator cortex (CAG/Router/Rumination)

#### voice.rs (389 lines)
- [ ] Line 46: GET /status calls real DB methods - **CONFIRMED REAL**
- [ ] Line 66: GET /profiles calls `db.list_voice_profiles()` - **CONFIRMED REAL**
- [ ] Line 105: POST /profiles calls `db.create_voice_profile()` - **CONFIRMED REAL**
- [ ] Line 128: DELETE /profiles calls `db.delete_voice_profile()` - **CONFIRMED REAL**
- [ ] Line 145: POST /active calls `db.set_active_voice_profile()` - **CONFIRMED REAL**
- [ ] Line 166: GET /samples calls `db.list_voice_samples()` - **CONFIRMED REAL**
- [ ] Line 200: POST /samples/upload saves to disk + DB - **CONFIRMED REAL**
- [ ] Line 263: DELETE /samples calls `db.delete_voice_sample()` - **CONFIRMED REAL**
- [ ] Line 292: POST /test calls `engine.voice.synthesize()` - **CONFIRMED REAL**
- [ ] Line 334: GET /model-status calls `engine.voice.verify_models()` - **CONFIRMED REAL**
- [ ] Verdict: **100% REAL**

#### background.rs (256 lines)
- [ ] Line 38: GET /system calls `engine.system_status.get_snapshot()` - check if real
- [ ] Line 55: GET /status calls `engine.status()` - check if real
- [ ] Line 78: GET /minions returns PLACEHOLDER - **CONFIRMED STUB**
- [ ] Line 101: GET /models calls `engine.models.list_all()` - check if real
- [ ] Verdict: **MIXED** - system/models real, minions stub

#### models.rs (132 lines)
- [x] Line 17: GET / calls `engine.models.list_all()` - **REAL** (ModelRegistry verified in engine)
- [x] Line 35: GET /summary calls `engine.models.get_summary()` - **REAL**
- [x] Line 53: GET /:id calls `engine.models.get()` - **REAL**
- [x] Line 76: GET /:id/verify calls file existence checks - **REAL**
- [x] Line 93: POST /:id/active calls `engine.models.set_active()` - **REAL**
- [x] Line 113: GET /family/:family calls `engine.models.list_by_family()` - **REAL**
- [x] Verdict: **100% REAL** - ModelRegistry fully implemented

#### persona.rs (233 lines)
- [ ] Line 19: GET / calls `engine.persona.list()` - check if real
- [ ] Line 38: GET /active calls `engine.persona.get_active()` - check if real
- [ ] Line 56: GET /defaults returns HARDCODED - **STUB**
- [ ] Line 87: GET /:id calls `engine.persona.get()` - check if real
- [ ] Line 108: POST / calls `engine.persona.create()` - check if real
- [ ] Line 146: PUT /:id calls `engine.persona.update()` - check if real
- [ ] Line 184: POST /:id/active calls `engine.persona.set_active()` - check if real
- [ ] Line 203: DELETE /:id calls `engine.persona.delete()` - check if real
- [ ] Verdict: **MOSTLY REAL** (except defaults endpoint)

### Frontend Pages (alpha/lab/ui/src/routes/)

#### agents/+page.svelte (237 lines)
- [ ] Line 18-67: HARDCODED static array of 8 agents - **CONFIRMED STUB**
- [ ] Line 115-118: Buttons all disabled - **CONFIRMED STUB**
- [ ] Verdict: **100% STUB**

#### roti/+page.svelte (223 lines)
- [ ] Line 10-13: All values hardcoded to 0 - **CONFIRMED STUB**
- [ ] Line 45-93: Placeholder charts and metrics - **CONFIRMED STUB**
- [ ] Verdict: **100% STUB**

#### pipeline/+page.svelte (310 lines)
- [ ] Line 17-60: Static layer definitions - **CONFIRMED STUB**
- [ ] Line 26: All throughput = 0 - **CONFIRMED STUB**
- [ ] Line 96-143: No real metrics queries - **CONFIRMED STUB**
- [ ] Verdict: **100% STUB**

#### config/+page.svelte (252 lines)
- [ ] Line 8-43: Hardcoded TOML string - **CONFIRMED STUB**
- [ ] Line 59-60: Buttons disabled - **CONFIRMED STUB**
- [ ] Line 63: Textarea disabled - **CONFIRMED STUB**
- [ ] Verdict: **100% STUB**

#### voice/+page.svelte (97 lines)
- [ ] Line 13: onMount loads from API - **REAL**
- [ ] Line 17: createProfile calls backend - **REAL**
- [ ] Line 51-56: GenderSelector, ProfileList, SampleList, VoiceTester - **REAL COMPONENTS**
- [ ] Verdict: **100% REAL**

#### dashboard/+page.svelte (119 lines)
- [ ] Line 12: Loads analytics, signals - check if real
- [ ] Line 34-51: MetricsCard with real data? - check API calls
- [ ] Verdict: **REAL or STUB?** - verify data sources

#### signals/+page.svelte (62 lines)
- [ ] Line 9: Uses signalStore - check if real
- [ ] Line 18-26: SignalStream, SignalFilter - check if wired
- [ ] Verdict: **REAL or STUB?** - verify SSE connection

#### background/+page.svelte (89 lines)
- [ ] Line 12-13: Loads from backgroundStore - check if real
- [ ] Line 29-42: ProcessList, MinionGrid, ModelStatus - check data
- [ ] Verdict: **REAL or STUB?** - verify backend wiring

#### models/+page.svelte (290 lines)
- [ ] Line 15: Loads from modelsStore - check if real
- [ ] Line 33-37: Set active, verify calls backend - check if real
- [ ] Verdict: **REAL or STUB?** - verify API integration

#### chat/+page.svelte (68 lines)
- [ ] Line 11: Uses chatStore - check if real
- [ ] Line 22-31: Session list, ChatStream - check if wired
- [ ] Verdict: **REAL or STUB?** - verify message sending

#### rumination/+page.svelte (51 lines)
- [ ] Line 9: Uses ruminationStore - **GETS MOCK DATA**
- [ ] Line 18-25: ThoughtTree, LayerIndicator - **DISPLAYS MOCK**
- [ ] Verdict: **100% STUB** (backend returns mock)

#### analytics/+page.svelte (129 lines)
- [ ] Line 11: Uses analyticsStore - check if real
- [ ] Line 27-45: Event count, inference stats, hop stats - check data
- [ ] Verdict: **REAL or STUB?** - verify DuckDB queries

#### persona/+page.svelte (276 lines)
- [ ] Line 15-16: Loads from personaStore - check if real
- [ ] Line 37-42: Create, edit, delete calls backend - check if real
- [ ] Verdict: **REAL or STUB?** - verify libSQL persistence

---

## Q2: Can Lab Work as Mission Control?

### Required Features from REAL_STATUS_AUDIT.md

#### [ ] Startup system check with visual display
- **Current**: health.rs endpoint exists (Line 27-119)
- **UI**: HealthSplash.svelte exists - check if wired to route
- **Status**: IMPLEMENTED or NOT WIRED?
- **Verify**: Does +page.svelte call /api/health on mount?

#### [ ] Real-time signal stream (WebSocket, not polling)
- **Current**: signals.rs has WebSocket (Line 54-85)
- **UI**: SignalStream component - check if uses WS or polls
- **Status**: WS EXISTS or POLLING?
- **Verify**: Check signalStore connection method

#### [ ] Model status with load/unload controls
- **Current**: models.rs has endpoints
- **UI**: models/+page.svelte exists
- **Status**: LOAD/UNLOAD IMPLEMENTED?
- **Verify**: Check if buttons call backend or disabled

#### [ ] Sub-agent status display
- **Current**: agents/+page.svelte HARDCODED static data
- **Backend**: background.rs /minions returns PLACEHOLDER
- **Status**: **100% STUB**

#### [ ] ROTI dashboard
- **Current**: roti/+page.svelte all metrics = 0
- **Backend**: NO BACKEND
- **Status**: **100% STUB**

#### [ ] Lanes visualization (Hot→Cold)
- **Current**: pipeline/+page.svelte static layers
- **Backend**: NO METRICS COLLECTION
- **Status**: **100% STUB**

#### [ ] Configuration SSOT editor
- **Current**: config/+page.svelte textarea disabled
- **Backend**: NO CONFIG TABLE
- **Status**: **100% STUB**

### Verdict Q2
- [x] Health check: **REAL** (backend works, HealthSplash.svelte calls API, redirects to dashboard)
- [x] Signal stream: **REAL** (SSE backend works, signalStore uses EventSource not polling)
- [x] Model controls: **REAL** (backend fully implemented, need to verify UI wiring)
- [x] Sub-agents: **MOSTLY MISSING** (1/8 exists: GUARDIAN skeleton needs real implementation, 7 others TODO)
- [x] ROTI: **100% STUB** (no backend, no calculation)
- [x] Lanes viz: **100% STUB** (no metrics collection, UI shows static L1-L6)
- [x] Config: **100% STUB** (no libSQL tables, no backend)

**Answer**: PARTIAL - 3/7 real, 3/7 stub, 1/7 barely exists

---

## Q3: Does Lab Do Startup Health Check?

### Required Behavior
1. Check engine connection
2. Verify libSQL accessible
3. Verify DuckDB accessible
4. Check RRO connection
5. List available models
6. Check voice models
7. Display in UI before proceeding

### Current Implementation

#### Backend health.rs
- [x] Engine connection: Line 45 `state.engine.is_ai_ready()`
- [x] libSQL check: Line 64 `db.list_voice_profiles()`
- [x] DuckDB check: Line 81 `analytics.get_event_count()`
- [x] RRO: Line 92 (correctly marked as stub)
- [x] Models: Line 102 `models.list_all()`
- [x] Voice: Included in libSQL check

#### Frontend HealthSplash.svelte
- [ ] Component exists at: `alpha/lab/ui/src/lib/components/HealthSplash.svelte`
- [ ] Calls /api/health on mount? **VERIFY**
- [ ] Blocks navigation until pass? **VERIFY**
- [ ] Shows animated checks? **VERIFY**

#### Route +page.svelte
- [ ] Does root route show HealthSplash? **VERIFY**
- [ ] Or does it redirect immediately? **VERIFY**

### Verdict Q3
- Backend: **REAL** (health.rs fully implemented)
- UI Component: **REAL** (HealthSplash.svelte exists)
- Integration: **REAL** (+page.svelte calls HealthSplash, auto-redirects to /dashboard)

**Answer**: YES - complete startup health check with visual display

---

## Q4: Is Lab SSOT Configuration Store Established?

### Required Tables in libSQL

#### Pipeline Settings
```rust
struct PipelineSettings {
    rro_enabled: bool,
    embedder_enabled: bool,
    reranker_enabled: bool,
    cag_enabled: bool,
}
```
- [ ] Table exists: **CHECK orchestrator/src/infra/libsql.rs**
- [ ] API endpoint: **CHECK lab/src/routes/config.rs (DOESN'T EXIST)**
- [ ] UI wired: config/+page.svelte disabled

#### Minion Settings
```rust
struct MinionSettings {
    enforcer: bool,
    guardian: bool,
    vision: bool,
    diary: bool,
    psych: bool,
    teacher: bool,
    scribe: bool,
    researcher: bool,
}
```
- [ ] Table exists: **CHECK libsql.rs**
- [ ] API endpoint: **DOESN'T EXIST**
- [ ] UI wired: config/+page.svelte disabled

#### Model Preferences
- [x] Table exists: `active_models` table (CONFIRMED in libsql.rs)
- [x] API endpoint: models.rs Line 93 `set_active`
- [x] UI wired: models/+page.svelte

#### Voice Settings
- [x] Stored in voice_profiles table (CONFIRMED)
- [x] API endpoints: voice.rs
- [x] UI wired: voice/+page.svelte

### Verdict Q4
- Model preferences: **REAL**
- Voice settings: **REAL**
- Pipeline settings: **MISSING TABLE + API + UI**
- Minion settings: **MISSING TABLE + API + UI**

**Answer**: NO - 2/4 configuration areas missing

---

## Q5: Does App Provide Clear Model Interchange/Testing?

### User Requirement
> "the first test is the fucking 4BVL then I load the 8BVL and test to see how it performs"

### Current Implementation

#### Model Loading
- [ ] orchestrator/src/infra/models.rs has `load_vl_model()` - **VERIFY EXISTS**
- [ ] orchestrator/src/infra/models.rs has `unload_vl_model()` - **VERIFY EXISTS**
- [ ] Engine exposes these methods? **VERIFY**

#### Model Testing UI
- [ ] models/+page.svelte has test input? **CHECK**
- [ ] Can send test prompt to model? **CHECK**
- [ ] Shows latency/results? **CHECK**
- [ ] Can compare 4B vs 8B side-by-side? **CHECK**

#### VRAM Check
- [ ] Can detect if 8B fits in VRAM? **CHECK**
- [ ] Shows VRAM usage per model? **CHECK**

### Verdict Q5
**Answer**: PARTIAL - load/unload exists, NO testing UI

---

## Q6: Does It Test Sub-Agents/Cortex/Reasoning?

### Sub-Agents

#### ENFORCER
- [x] Exists in orchestrator/src/sub_agents/? **NO** - not implemented
- [x] Has UI to enable/disable? **NO** (agents/+page.svelte stub)
- [x] Shows status? **NO**

#### GUARDIAN
- [x] Exists: orchestrator/src/sub_agents/guardian/mod.rs **YES**
- [x] Is real or stub? **SKELETON** - manifest.toml exists, analyze() has TODO, needs real file watching/indexing
- [x] Has UI? **NO** (agents/+page.svelte stub)
- **NOTE**: GUARDIAN is 1 of 8, incremental approach, but needs REAL code to actually start working

#### VISION, PSYCH, SCRIBE, TEACHER, DIARY, RESEARCHER
- [x] Exist? **NO** - only commented TODOs in mod.rs
- [x] UI? **NO** (agents page shows 8 hardcoded, all disabled)

### Cortex

#### Llm Testing
- [ ] Can send direct prompt to Llm? **NO UI**
- [ ] Shows CoT reasoning? **NO**
- [ ] Latency measurement? **NO**

#### Rumination
- [ ] rumination.rs execute_hop() real or stub? **CHECK**
- [ ] Can visualize thought tree? rumination/+page.svelte gets MOCK DATA
- [ ] Shows layer progression? **DISPLAYS MOCK**

### Verdict Q6
**Answer**: NO - sub-agents mostly missing, no testing UI

---

## Q7: Does It Properly Emit Signals for Lab?

### Signal Emission Check

#### Production Code Emits
```bash
grep -r "router.emit" alpha/engine/src/
grep -r "router.emit" alpha/orchestrator/src/
```
- [ ] chat.rs emits Chat signal? **CHECK**
- [ ] models.rs emits Loading/Loaded? **CHECK**
- [ ] voice.rs emits Voice signals? **CHECK**

#### Lab Subscribes
- [ ] lab/src/state.rs subscribes to router? **CHECK Line 69-79 claimed**
- [ ] Broadcasts via SSE? **CHECK signals.rs**
- [ ] Frontend receives? **CHECK SignalStream component**

### Verdict Q7
- [x] ChatFacade emits: Line 129, 150, 160, 185 (Chat + Inference signals)
- [x] ModelFacade emits: Line 155, 280, 332, 361, 380 (Diagnostic signals)
- [x] PersonaFacade emits: Line 79, 118
- [x] SignalRouter.emit() exists: engine/src/signals/router.rs Line 45
- [x] Lab subscribes: signals.rs SSE + WebSocket streams
- [x] Frontend receives: SignalStream.svelte uses connectSSE()

**Answer**: YES - signals properly emitted and subscribed throughout

---

## Q8: Is CSS Organized for Growth?

### Design Tokens
- [ ] File exists: `alpha/lab/ui/src/lib/styles/tokens.css` - **CHECK**
- [ ] Defines CSS variables? **CHECK**
- [ ] Used consistently? **CHECK usage**

### Component Styles
- [ ] glass class defined? **CHECK**
- [ ] Consistent across components? **CHECK**
- [ ] Scoped or global? **CHECK**

### Global CSS
- [ ] app.css imports tokens? **CHECK**
- [ ] Line count reasonable? **COUNT LINES**

### Verdict Q8
**Answer**: UNKNOWN - need to verify token usage

---

## Action Items (CRITICAL)

### VERIFY RIGHT NOW
1. [ ] Does Engine.chat.send_message() actually exist? **CHECK engine/src/lib.rs**
2. [ ] Does Engine.models.list_all() actually exist? **CHECK**
3. [ ] Does SignalRouter.emit() get called in production code? **GREP**
4. [ ] Does +page.svelte show HealthSplash or dashboard? **READ FILE**
5. [ ] Does signalStore use WebSocket or poll? **READ store**

### IMPLEMENT IF MISSING
1. [ ] Config table in libSQL (pipeline_settings, minion_settings)
2. [ ] Config API routes (lab/src/routes/config.rs)
3. [ ] Wire config/+page.svelte to real backend
4. [ ] Add model testing UI
5. [ ] Wire agents page to real ExpertRegistry
6. [ ] Implement ROTI calculation
7. [ ] Add pipeline metrics collection

### DELETE IF FAKE
1. [ ] agents/+page.svelte if no backend (replace with "Not Implemented")
2. [ ] roti/+page.svelte if no calculation
3. [ ] pipeline/+page.svelte if no metrics
4. [ ] config/+page.svelte if no backend
5. [ ] LAB_IMPLEMENTATION_SUMMARY.md (claimed fake completion)
6. [ ] LAB_CHECKLIST.md (claimed fake completion)

---

## Final Verdict Matrix

| Requirement | Backend | Frontend | Verdict |
|-------------|---------|----------|---------|
| Health check | REAL | REAL | **PASS** |
| Chat | REAL | VERIFY | PARTIAL |
| Analytics | REAL | VERIFY | PARTIAL |
| Signals | REAL | REAL | **PASS** |
| Voice | REAL | REAL | **PASS** |
| Models | REAL | VERIFY | PARTIAL |
| Persona | REAL | VERIFY | PARTIAL |
| Agents | STUB | STUB | **FAIL** |
| ROTI | NONE | STUB | **FAIL** |
| Pipeline | NONE | STUB | **FAIL** |
| Config | NONE | STUB | **FAIL** |
| Rumination | STUB | STUB | **FAIL** |

**Overall**: 3 complete, 4 backend-real-needs-frontend, 5 total failures

---

## Next Steps

1. **RUN THE VERIFICATION COMMANDS** in this checklist
2. **MARK EACH [ ] BOX** based on actual code
3. **CREATE ISSUES** for each FAIL
4. **DELETE FAKE DOCS** (LAB_IMPLEMENTATION_SUMMARY, LAB_CHECKLIST)
5. **WRITE REAL CODE** for stub pages or remove them
