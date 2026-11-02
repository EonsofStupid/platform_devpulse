//! Lane system — compute resource classes the slot budgeter allocates across.
//!
//! A *lane* is a physical compute resource class that a slot can be
//! assigned to. Today the platform sees three real lanes — VRAM, DDR,
//! and CPU — plus SSD scaffolded for when the pure-Rust `olloy` storage
//! layer lands.
//!
//! The existing [`VramBudget`][super::vram::VramBudget] is VRAM-only and
//! predates this module. Rather than break the existing budget consumers
//! in one sweeping refactor, this module adds the general lane vocabulary
//! alongside `VramBudget`. A follow-up cut moves the existing VRAM
//! budgeter into a [`LaneBudget::Vram`] variant and teaches the resource
//! budgeter to plan across every lane at once.
//!
//! # Why this lives in `hardware/` and not `slots/`
//!
//! Lanes are physical resources derived from [`HardwareMetrics`][super::metrics::HardwareMetrics].
//! The slot system consumes lanes but does not own them. Keeping the
//! definitions in `hardware::` matches the dependency direction: slots
//! depend on lanes, not the other way around.
//!
//! # Design goals
//!
//! - **Extensible**: adding a new lane (e.g. NPU, discrete inference
//!   accelerator, persistent-memory pool) is a single enum variant plus
//!   a capacity source. No existing consumer breaks.
//! - **Enum-dispatched per-lane state**: each lane has different
//!   metrics. VRAM cares about `currently_used_mb`, DDR cares about
//!   `swap_pressure`, CPU cares about active core count, SSD cares about
//!   read bandwidth. A single generic struct would lose the distinction.
//! - **Serde-stable**: the enum names match the public TOML vocabulary
//!   (`vram`, `ddr`, `cpu`, `ssd`) so lane definitions round-trip
//!   through `lanes.default.toml` without custom codecs.
//! - **Persistence-aware**: lane budgeting must honour
//!   [`PersistenceClass::AlwaysOn`][crate::slots::PersistenceClass]
//!   reservations before planning new loads.

use crate::slots::PersistenceClass;
use serde::{Deserialize, Serialize};

// ── LaneKind ─────────────────────────────────────────────────────

/// Which compute resource class a slot is assigned to.
///
/// Lane selection drives both the backend pool routing (Candle on GPU,
/// ORT on CPU, mmap paging through DDR, future SSD streaming) *and* the
/// budget accounting (which lane's capacity does this slot's footprint
/// count against).
///
/// The ordering of variants is stable: `Vram` / `Ddr` / `Cpu` / `Ssd`
/// matches the budgeter's display order and the TOML file key ordering.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "lowercase")]
pub enum LaneKind {
    /// GPU video RAM. Primary lane for transformer-style LLMs and any
    /// large inference workload that benefits from parallel compute.
    Vram,
    /// System RAM. Used for models that mmap their weights (fast warm
    /// start, cheap eviction) and for GPU-overflow spillover on
    /// workstation tier hardware.
    Ddr,
    /// CPU compute with weights in system RAM. The right lane for
    /// embedders, rerankers, and any model whose latency budget
    /// tolerates CPU burst behaviour.
    Cpu,
    /// Solid-state storage as a streaming weight store. Scaffolded for
    /// the future pure-Rust `olloy` integration. Not yet implemented —
    /// loaders see a lane definition with
    /// [`LaneStatus::Scaffolded`] and route elsewhere.
    Ssd,
}

impl LaneKind {
    /// Iterator over every defined lane in display order.
    ///
    /// Consumers that need to paint a "lanes tab" in the Slot Config
    /// overlay call this to enumerate rows without hand-listing
    /// variants. Adding a new lane automatically surfaces it here.
    #[must_use]
    pub const fn all() -> &'static [Self] {
        &[Self::Vram, Self::Ddr, Self::Cpu, Self::Ssd]
    }

    /// Lowercase string identifier suitable for TOML keys, log targets,
    /// and structured event fields. Matches the `serde` rename.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Vram => "vram",
            Self::Ddr => "ddr",
            Self::Cpu => "cpu",
            Self::Ssd => "ssd",
        }
    }

    /// Human-readable label for UI display.
    #[must_use]
    pub const fn display_label(self) -> &'static str {
        match self {
            Self::Vram => "GPU VRAM",
            Self::Ddr => "System RAM",
            Self::Cpu => "CPU",
            Self::Ssd => "SSD",
        }
    }
}

impl std::fmt::Display for LaneKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

// ── LaneStatus ───────────────────────────────────────────────────

/// Runtime availability of a lane on the current host.
///
/// A lane might be *defined* in [`LaneKind::all`] yet unavailable at
/// runtime (no GPU detected, SSD lane not yet implemented). The status
/// lets the budgeter and the UI distinguish "works but full" from
/// "doesn't exist on this hardware".
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "snake_case")]
pub enum LaneStatus {
    /// Lane is real, detected, and ready to allocate against.
    Ready,
    /// Lane exists in the hardware profile but its capacity is zero
    /// (e.g. no GPU on a CPU-only machine). The UI greys it out.
    Unavailable,
    /// Lane is defined in the codebase but the loader implementation is
    /// incomplete. Used by [`LaneKind::Ssd`] until pure-Rust olloy
    /// storage lands. The UI shows a "coming soon" indicator.
    Scaffolded,
}

impl LaneStatus {
    /// Whether the budgeter should plan allocations against this lane.
    #[must_use]
    pub const fn is_allocatable(self) -> bool {
        matches!(self, Self::Ready)
    }
}

// ── LaneCapacity ─────────────────────────────────────────────────

/// Absolute capacity of a lane, in bytes plus lane-specific metadata.
///
/// All lanes report a `total_bytes` figure so the budgeter can compare
/// apples to apples, but each carries its own metadata (core count,
/// bandwidth, etc.) exposed via the `LaneKind`-specific variants below.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct LaneCapacity {
    /// Total bytes this lane can hold. `0` means the lane is
    /// unavailable on this host (see [`LaneStatus::Unavailable`]).
    pub total_bytes: u64,
    /// Bytes currently in use by loaded models (or equivalent —
    /// for CPU this is weights-in-RAM, for SSD it's mmap footprint).
    pub used_bytes: u64,
    /// Bytes reserved by [`PersistenceClass::AlwaysOn`] slots.
    /// These are subtracted from headroom before new loads are
    /// planned so an always-on slot can never be displaced.
    pub reserved_bytes: u64,
}

impl LaneCapacity {
    /// Free bytes remaining for new allocations, honouring reservations.
    #[must_use]
    pub const fn free_bytes(self) -> u64 {
        let used_plus_reserved = self.used_bytes.saturating_add(self.reserved_bytes);
        self.total_bytes.saturating_sub(used_plus_reserved)
    }

    /// Free bytes expressed as whole megabytes (integer-truncated).
    #[must_use]
    pub const fn free_mb(self) -> u64 {
        self.free_bytes() / (1024 * 1024)
    }

    /// Total capacity in megabytes.
    #[must_use]
    pub const fn total_mb(self) -> u64 {
        self.total_bytes / (1024 * 1024)
    }

    /// Utilization percentage in `[0.0, 1.0]`. Returns `0.0` when the
    /// lane has no total capacity (avoids a divide-by-zero).
    #[must_use]
    pub fn utilization(self) -> f32 {
        if self.total_bytes == 0 {
            return 0.0;
        }
        // Byte-scale UI display ratio; loss of precision below 1 byte is
        // acceptable — the result feeds a percentage gauge.
        #[allow(clippy::cast_precision_loss)]
        let ratio = (self.used_bytes as f32) / (self.total_bytes as f32);
        ratio
    }
}

// ── LaneAllocation ───────────────────────────────────────────────

/// A single slot's claim on a lane.
///
/// The budgeter aggregates these into per-lane totals when computing a
/// [`LaneBudget`]. Each allocation carries the slot's persistence class
/// because eviction ordering depends on it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct LaneAllocation {
    /// Slot this allocation belongs to.
    pub slot_id: String,
    /// Estimated bytes the slot's model consumes once loaded.
    pub footprint_bytes: u64,
    /// Whether the slot is currently loaded (`true`) or merely
    /// planned (`false`).
    pub is_loaded: bool,
    /// Persistence class drives eviction ordering.
    pub persistence: PersistenceClass,
}

impl LaneAllocation {
    /// Whether the budgeter may consider evicting this allocation under
    /// memory pressure. Defers to the persistence class.
    #[must_use]
    pub const fn is_evictable(&self) -> bool {
        self.persistence.is_evictable()
    }
}

// ── LaneBudget ───────────────────────────────────────────────────

/// Budget view for one lane — capacity plus the list of slot
/// allocations competing for that capacity.
///
/// The resource budgeter builds one `LaneBudget` per [`LaneKind`] and
/// aggregates them into a `ResourceBudget` (future follow-up — today the
/// VRAM budgeter is still standalone in `hardware::vram`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct LaneBudget {
    /// Which lane this budget covers.
    pub kind: LaneKind,
    /// Runtime availability — `Ready`, `Unavailable`, or `Scaffolded`.
    pub status: LaneStatus,
    /// Capacity snapshot at the moment the budget was computed.
    pub capacity: LaneCapacity,
    /// Per-slot allocations against this lane, in no particular order.
    pub allocations: Vec<LaneAllocation>,
}

impl LaneBudget {
    /// Create an empty budget for a lane that does not exist on this
    /// host (`total_bytes = 0`, status = `Unavailable`).
    #[must_use]
    pub fn unavailable(kind: LaneKind) -> Self {
        Self {
            kind,
            status: LaneStatus::Unavailable,
            capacity: LaneCapacity::default(),
            allocations: Vec::new(),
        }
    }

    /// Create an empty budget for the `Ssd` lane while its loader is
    /// still being implemented. Distinct from [`Self::unavailable`] so
    /// the UI can show "coming soon" instead of "not detected".
    #[must_use]
    pub fn scaffolded(kind: LaneKind) -> Self {
        Self {
            kind,
            status: LaneStatus::Scaffolded,
            capacity: LaneCapacity::default(),
            allocations: Vec::new(),
        }
    }

    /// Whether every allocation currently planned on this lane fits
    /// within [`LaneCapacity::free_bytes`]. Allocations marked
    /// `is_loaded = true` are already accounted for in `used_bytes` and
    /// do not contribute to the planned footprint.
    #[must_use]
    pub fn planned_fits(&self) -> bool {
        let planned: u64 = self
            .allocations
            .iter()
            .filter(|a| !a.is_loaded)
            .map(|a| a.footprint_bytes)
            .sum();
        planned <= self.capacity.free_bytes()
    }

    /// Bytes allocated by slots that are already loaded. Matches
    /// [`LaneCapacity::used_bytes`] when the budget is self-consistent.
    #[must_use]
    pub fn loaded_footprint(&self) -> u64 {
        self.allocations
            .iter()
            .filter(|a| a.is_loaded)
            .map(|a| a.footprint_bytes)
            .sum()
    }

    /// Bytes for slots that are planned but not yet loaded.
    #[must_use]
    pub fn planned_footprint(&self) -> u64 {
        self.allocations
            .iter()
            .filter(|a| !a.is_loaded)
            .map(|a| a.footprint_bytes)
            .sum()
    }

    /// Eviction candidates ordered from first-to-evict to
    /// last-to-evict. [`PersistenceClass::AlwaysOn`] allocations are
    /// excluded entirely — the budgeter must never evict them.
    #[must_use]
    pub fn eviction_candidates(&self) -> Vec<&LaneAllocation> {
        let mut candidates: Vec<&LaneAllocation> = self
            .allocations
            .iter()
            .filter(|a| a.is_evictable() && a.is_loaded)
            .collect();
        candidates.sort_by_key(|a| a.persistence.eviction_priority());
        candidates
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on assertion failure by design
mod tests {
    use super::*;

    fn alloc(slot: &str, bytes: u64, loaded: bool, class: PersistenceClass) -> LaneAllocation {
        LaneAllocation {
            slot_id: slot.to_string(),
            footprint_bytes: bytes,
            is_loaded: loaded,
            persistence: class,
        }
    }

    #[test]
    fn lane_kind_all_covers_every_variant() {
        assert_eq!(
            LaneKind::all(),
            &[LaneKind::Vram, LaneKind::Ddr, LaneKind::Cpu, LaneKind::Ssd]
        );
    }

    #[test]
    fn lane_kind_display_and_serde_match() {
        assert_eq!(LaneKind::Vram.as_str(), "vram");
        assert_eq!(LaneKind::Ddr.as_str(), "ddr");
        assert_eq!(LaneKind::Cpu.as_str(), "cpu");
        assert_eq!(LaneKind::Ssd.as_str(), "ssd");
        let json = serde_json::to_string(&LaneKind::Vram).unwrap();
        assert_eq!(json, "\"vram\"");
    }

    #[test]
    fn capacity_free_honours_used_and_reserved() {
        let cap = LaneCapacity {
            total_bytes: 16 * 1024 * 1024 * 1024,
            used_bytes: 4 * 1024 * 1024 * 1024,
            reserved_bytes: 2 * 1024 * 1024 * 1024,
        };
        assert_eq!(cap.free_bytes(), 10 * 1024 * 1024 * 1024);
        assert_eq!(cap.total_mb(), 16 * 1024);
        assert!((cap.utilization() - 0.25).abs() < 1e-6);
    }

    #[test]
    fn capacity_free_saturates_when_over_committed() {
        // used + reserved > total should not panic or wrap — returns 0.
        let cap = LaneCapacity {
            total_bytes: 1000,
            used_bytes: 800,
            reserved_bytes: 400,
        };
        assert_eq!(cap.free_bytes(), 0);
    }

    #[test]
    fn unavailable_and_scaffolded_constructors() {
        let un = LaneBudget::unavailable(LaneKind::Vram);
        assert_eq!(un.kind, LaneKind::Vram);
        assert_eq!(un.status, LaneStatus::Unavailable);
        assert_eq!(un.allocations.len(), 0);

        let sc = LaneBudget::scaffolded(LaneKind::Ssd);
        assert_eq!(sc.kind, LaneKind::Ssd);
        assert_eq!(sc.status, LaneStatus::Scaffolded);
    }

    #[test]
    fn planned_fits_when_under_capacity() {
        let budget = LaneBudget {
            kind: LaneKind::Vram,
            status: LaneStatus::Ready,
            capacity: LaneCapacity {
                total_bytes: 10_000,
                used_bytes: 0,
                reserved_bytes: 0,
            },
            allocations: vec![
                alloc("chat.brain", 4_000, false, PersistenceClass::WarmStandby),
                alloc("minion.shared", 2_000, false, PersistenceClass::OnDemand),
            ],
        };
        assert!(budget.planned_fits());
    }

    #[test]
    fn planned_does_not_fit_when_over_capacity() {
        let budget = LaneBudget {
            kind: LaneKind::Vram,
            status: LaneStatus::Ready,
            capacity: LaneCapacity {
                total_bytes: 5_000,
                used_bytes: 0,
                reserved_bytes: 0,
            },
            allocations: vec![alloc(
                "chat.brain",
                6_000,
                false,
                PersistenceClass::WarmStandby,
            )],
        };
        assert!(!budget.planned_fits());
    }

    #[test]
    fn eviction_candidates_exclude_always_on() {
        let budget = LaneBudget {
            kind: LaneKind::Vram,
            status: LaneStatus::Ready,
            capacity: LaneCapacity::default(),
            allocations: vec![
                alloc("wake", 50, true, PersistenceClass::AlwaysOn),
                alloc("brain", 4_000, true, PersistenceClass::WarmStandby),
                alloc("embed", 500, true, PersistenceClass::OnDemand),
            ],
        };
        let candidates = budget.eviction_candidates();
        assert_eq!(candidates.len(), 2);
        // OnDemand evicts before WarmStandby.
        assert_eq!(candidates[0].slot_id, "embed");
        assert_eq!(candidates[1].slot_id, "brain");
    }

    #[test]
    fn loaded_vs_planned_footprint_are_additive_and_disjoint() {
        let budget = LaneBudget {
            kind: LaneKind::Ddr,
            status: LaneStatus::Ready,
            capacity: LaneCapacity::default(),
            allocations: vec![
                alloc("a", 100, true, PersistenceClass::OnDemand),
                alloc("b", 250, false, PersistenceClass::OnDemand),
                alloc("c", 50, true, PersistenceClass::OnDemand),
            ],
        };
        assert_eq!(budget.loaded_footprint(), 150);
        assert_eq!(budget.planned_footprint(), 250);
    }
}
