# RRD - Reason Ready Daemon


| Field | Value |
|-------|-------|
| Status | OFFICIAL - v1.0.0 |
| Last Updated | 2026-05-01 |
| Owner | @jesse |
| Location | kernel/rrd |
| Part of | RRO (sibling: RRO.md, REASON_READY_OBJECT.md) |
| Governs | RRO cluster lifecycle, hot reload, encoder swap, health |

---

## 1. What RRD Is

The RRD (Reason Ready Daemon) is the in-process orchestrator that runs the RRO cluster. NOT a sidecar. NOT HTTP. NOT a separate process.

The RRD owns:
- Lifecycle state of the entire RRO cluster
- Encoder hot-reload (atomic via ArcSwap)
- Pause/resume protocol (Clyffy maintenance window)
- Health check aggregation across all backends
- Failure recovery from libSQL SSOT
- Resource budget tracking

The RRD does NOT own:
- Query execution (RRO public API does)
- Embedding/encoding (Encoder does)
- Storage (Backends do)
- Reasoning logic (Decision Engine does)

The RRD is the conductor. RRO components are the orchestra.

## 2. Lifecycle States

```rust
pub enum RRDState {
    /// Cold start: reading config, loading encoder weights
    Loading,
    /// Fully operational: queries accepted
    Running,
    /// Maintenance window: new queries queue or get RRDUnavailable
    Paused,
    /// Atomic encoder swap in progress (ArcSwap)
    Updating,
    /// Unrecoverable error: required for diagnostics
    Failed(FailureReason),
}
```n
### State Transitions

| From | To | Trigger |
|------|------|---------|
| Loading | Running | All backends healthy, encoder loaded |
| Loading | Failed | Critical backend unreachable, encoder weights corrupt |
| Running | Paused | pause_for_update called by RRO API |
| Running | Failed | Critical health check failure |
| Paused | Updating | swap_encoder called with new weights path |
| Paused | Running | resume called without swap |
| Updating | Running | ArcSwap completed, new encoder validated |
| Updating | Failed | New encoder failed validation |
| Failed | Loading | Manual recovery: restart with cleared error state |

## 3. Pause/Resume Protocol (Clyffy Maintenance Window)

This is what the user sees as 'Clyffy maintenance' in the UI. It is not a sidecar. It is in-process state coordination.

### Sequence

1. **Trigger** - rro.pause_for_update() called
2. **Set state to Paused** - new queries get RRDUnavailable error or queue based on config
3. **Drain in-flight requests** - typically completes in <500ms
4. **Set state to Updating** - signals encoder swap is happening
5. **Load new encoder weights** - from disk, ~2-5 seconds for 0.6B safetensors
6. **Validate new encoder** - test embedding produced and dimension matches
7. **ArcSwap atomic pointer swap** - old Arc<Encoder> drops when last reference goes
8. **Set state to Running** - queued queries resume immediately

### Total user-visible pause

~5-10 seconds total. UI shows 'Clyffy maintenance' indicator throughout. Queue depth at start: zero (drain happens before swap).

### Failure modes

| Failure point | Behavior |
|---------------|----------|
| Drain timeout (>30s) | Force-cancel in-flight, log, proceed with swap |
| New weights load fails | Stay on old encoder, set state Failed, surface error |
| New encoder fails validation | Discard new, restore old via ArcSwap, set state Failed |
| ArcSwap itself never fails | Atomic by definition |
