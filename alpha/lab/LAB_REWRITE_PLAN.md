# Lab Rewrite Plan

## Audit Summary

**Current State:** 75% Real, 25% Stub
- ✅ Backend: 9/10 route modules production-ready (Health, Chat, Analytics, Signals, Voice, Background, Models, Persona)
- ⚠️ Rumination: Returns mock data, needs wiring to actual system
- ⚠️ Frontend stubs: Agents, ROTI, Pipeline pages have UI but no backend

**NO MAJOR REWRITE NEEDED** - Most code is real and working.

---

## What Needs Fixing (Phase 0-5 Applied)

### 1. Wire Rumination Backend (WHEN SYSTEM EXISTS)
**Current:** `alpha/lab/src/routes/rumination.rs` returns hardcoded mock data
**Needed:** Connect to actual rumination/thought tree system in orchestrator

Phase 0 - Boundary:
- File: `alpha/lab/src/routes/rumination.rs` (exists)
- Dependencies: Engine → Orchestrator rumination system (not implemented yet)
- Consumers: Frontend `/rumination` page

Phase 1 - Contract: BLOCKED - orchestrator rumination.rs is stub
Phase 2-5: BLOCKED until orchestrator implements real thought tree

**Decision:** Leave as stub until orchestrator rumination system complete

---

### 2. Implement Minions/Agents Backend
**Current:** Background API returns placeholder minion status
**Needed:** Real sub-agent lifecycle tracking

Phase 0 - Boundary:
- New file: `alpha/lab/src/routes/agents.rs`
- Dependencies: Engine → Orchestrator sub_agents registry
- Consumers: `/agents` frontend page

Phase 1 - Contract:
```rust
// Need in orchestrator first:
pub struct AgentRegistry {
    enforcer: Option<EnforcerHandle>,
    guardian: Option<GuardianHandle>,
    vision: Option<VisionHandle>,
    // ...
}

impl AgentRegistry {
    pub fn list_status(&self) -> Vec<AgentStatus>;
    pub fn enable(&mut self, agent: AgentType) -> Result<()>;
    pub fn disable(&mut self, agent: AgentType) -> Result<()>;
}
```

Phase 2 - Observability:
- #[instrument] on enable/disable
- INFO when agent starts/stops
- ERROR on failures

Phase 3 - Tests:
- Unit test enable/disable
- Integration test status reporting

Phase 4 - Docs:
- Document agent lifecycle
- Usage examples

Phase 5 - Security:
- Validate agent names
- Prevent disabling critical agents

**Decision:** Implement after orchestrator sub_agents are real

---

### 3. Implement ROTI Calculator
**Current:** `/roti` page shows static UI
**Needed:** Real time/value tracking and calculation

Phase 0 - Boundary:
- File: `alpha/lab/src/routes/roti.rs` (new)
- Dependencies: Engine → Orchestrator ROTI tracker
- Consumers: `/roti` frontend page

Phase 1 - Contract:
```rust
pub struct RotiTracker {
    analytics: Arc<Analytics>,
}

pub struct RotiSnapshot {
    pub time_invested_hours: f32,
    pub value_delivered: f32,
    pub roti_score: f32,
    pub breakdown: RotiBreakdown,
}

impl RotiTracker {
    pub async fn calculate(&self, session_id: &str) -> Result<RotiSnapshot>;
    pub async fn track_time_event(&self, event: TimeEvent) -> Result<()>;
    pub async fn track_value_event(&self, event: ValueEvent) -> Result<()>;
}
```

Phase 2-5: Standard module checklist

**Decision:** Implement when time/value tracking requirements defined

---

### 4. Add Real Pipeline Metrics
**Current:** `/pipeline` page shows static layer descriptions
**Needed:** Real throughput metrics for L1-L6

Phase 0 - Boundary:
- File: `alpha/lab/src/routes/pipeline.rs` (new)
- Dependencies: Engine → Orchestrator analytics (DuckDB queries)
- Consumers: `/pipeline` frontend page

Phase 1 - Contract:
```rust
pub struct PipelineMetrics {
    analytics: Arc<Analytics>,
}

pub struct LayerStats {
    pub hot: u64,     // L1 hot memory
    pub warm: u64,    // L2-L3 context
    pub cold: u64,    // L4-L6 archives
    pub throughput: HashMap<String, u64>,
}

impl PipelineMetrics {
    pub async fn get_layer_stats(&self) -> Result<LayerStats>;
    pub async fn get_layer_history(&self, layer: &str) -> Result<Vec<LayerSnapshot>>;
}
```

Phase 2-5: Standard module checklist

**Decision:** Implement after storage layer metrics collection added

---

### 5. Delete LAB_IMPLEMENTATION_SUMMARY.md and LAB_CHECKLIST.md
**Reason:** Those were based on my false scaffold work. Audit shows real work already exists.

---

## What's Already Good (No Rewrite)

### Backend Routes ✅
- `health.rs` - Comprehensive system checks ✅
- `chat.rs` - Full CRUD + session management ✅
- `analytics.rs` - Real DuckDB metrics ✅
- `signals.rs` - SSE/WS streaming ✅
- `voice.rs` - Complete voice profile/sample CRUD ✅
- `background.rs` - System status monitoring ✅
- `models.rs` - Model registry with verification ✅
- `persona.rs` - Persona CRUD ✅

### Frontend ✅
- All API clients functional
- All stores using real APIs
- Dashboard, signals, background, voice, models, chat, analytics, persona pages complete
- Component library comprehensive

---

## Implementation Priority

**DO NOW:**
1. ✅ Delete duplicate `/voices` page I created
2. ✅ Fix sidebar link back to `/voice` (not `/voices`)
3. ❌ Do NOT rewrite existing working code

**DO AFTER ORCHESTRATOR IMPLEMENTS:**
1. Wire rumination backend to real system
2. Add agent registry and status endpoints
3. Implement ROTI calculator
4. Add pipeline metrics collection

**DO NEVER:**
- Rewrite working health/chat/analytics/voice/models/persona code
- Create duplicate pages
- Scaffold over real implementations

---

## Health Check Fix (Already Done)

Fixed `alpha/lab/src/routes/health.rs` line 64-89:
- Before: Called nonexistent `execute_query()` methods
- After: Uses real `list_voice_profiles()` and `get_event_count()`
- Status: ✅ FIXED

---

## Conclusion

Lab codebase is **75% production-ready**. The 25% that's stub (agents, ROTI, pipeline, rumination details) is correctly stubbed because the orchestrator systems don't exist yet.

**NO REWRITE NEEDED** - just wire new features as orchestrator implements them.
