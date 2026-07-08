//! Persistence class — the lifecycle contract a slot declares to the
//! resource budgeter.
//!
//! A slot's persistence class tells the VRAM / DDR / CPU lane budgeters
//! how aggressively that slot can be evicted under memory pressure and
//! how proactively it should be loaded at boot.
//!
//! This is orthogonal to [`LoadingStrategy`][crate::platform::model_loader::slots::types::LoadingStrategy]:
//!
//! - `LoadingStrategy` answers *"when should the first load happen?"*
//!   (`Hot` / `Warm` / `OnDemand` / `Signal(…)` / `Coupled { parent }`)
//! - [`PersistenceClass`] answers *"once loaded, how permanent is the residency?"*
//!   (`OnDemand` / `WarmStandby` / `AlwaysOn`)
//!
//! The two combine in the slot definition. Example: a text embedder
//! might be `LoadingStrategy::OnDemand` **and**
//! `PersistenceClass::WarmStandby` — lazy first load, but stay resident
//! after the first call.
//!
//! **2026-04-20 note (owner directive — no auto-load):** the
//! `LoadingStrategy::Hot` variant is retained in the type system as an
//! inert hint. Nothing in kernel or engine auto-loads based on it. Every
//! model load is a deliberate user action triggered from the UI. The
//! `auto_load_hot_slots` function was removed from both the kernel
//! service and the engine facade.
//!
//! # Why this lives in a dedicated module
//!
//! The budgeter in `hardware::lanes` needs to reference this enum and
//! the slot types in `slots::types` do as well. Putting it in its own
//! module keeps the import graph acyclic and lets both consumers pull
//! from a single definition.

use serde::{Deserialize, Serialize};

/// Lifecycle contract for a slot's memory residency.
///
/// The variants are ordered from weakest to strongest claim on the
/// underlying lane. Higher variants outrank lower variants when the
/// budgeter has to decide what to evict under pressure:
///
/// 1. [`Self::OnDemand`] — fully evictable, no residency guarantees.
/// 2. [`Self::WarmStandby`] — eviction allowed only after all
///    `OnDemand` candidates have been unloaded.
/// 3. [`Self::AlwaysOn`] — non-evictable. The budgeter treats the
///    slot's footprint as unavailable memory for every other slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum PersistenceClass {
    /// Lazy first load; fully evictable under memory pressure.
    ///
    /// This is the safe default for any slot whose latency budget can
    /// tolerate a reload. Used by embedders, rerankers, and any
    /// "occasional" model that the user doesn't expect to be
    /// instantly available.
    #[default]
    OnDemand,
    /// Loaded on first use, then kept resident. Evicted only after
    /// every [`Self::OnDemand`] candidate has been unloaded.
    ///
    /// Appropriate for the main chat brain and any helper model the
    /// platform expects to be warm between conversations.
    WarmStandby,
    /// Non-evictable. Load at boot (or first trigger) and stay resident
    /// for the lifetime of the process.
    ///
    /// Reserved for genuine always-on requirements: the wake-word
    /// detector, the kernel persona (Conductor), and any built-in the
    /// user expects to respond with zero warm-up latency. The budgeter
    /// subtracts the slot's footprint from every other slot's
    /// available lane capacity.
    AlwaysOn,
}

impl PersistenceClass {
    /// Whether the budgeter may evict this slot under memory pressure.
    ///
    /// [`Self::OnDemand`] and [`Self::WarmStandby`] are evictable.
    /// [`Self::AlwaysOn`] is not.
    #[must_use]
    pub const fn is_evictable(self) -> bool {
        !matches!(self, Self::AlwaysOn)
    }

    /// Eviction priority — lower numbers are evicted first.
    ///
    /// The budgeter uses this to sort eviction candidates when it
    /// needs to free memory for a new load:
    ///
    /// | Class           | Priority | Behaviour                          |
    /// | --------------- | -------- | ---------------------------------- |
    /// | `OnDemand`      | `0`      | evicted first                      |
    /// | `WarmStandby`   | `1`      | evicted only after all `OnDemand` |
    /// | `AlwaysOn`      | `u8::MAX`| never evicted                      |
    #[must_use]
    pub const fn eviction_priority(self) -> u8 {
        match self {
            Self::OnDemand => 0,
            Self::WarmStandby => 1,
            Self::AlwaysOn => u8::MAX,
        }
    }

    /// Whether the slot is included in the "unavailable capacity"
    /// reservation that the budgeter applies before planning new loads.
    ///
    /// Only [`Self::AlwaysOn`] reserves capacity — the other two can
    /// be displaced so their footprint counts as available headroom
    /// for planning purposes.
    #[must_use]
    pub const fn reserves_capacity(self) -> bool {
        matches!(self, Self::AlwaysOn)
    }

    /// Lowercase identifier suitable for log targets, TOML config,
    /// and structured event fields.
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::OnDemand => "on_demand",
            Self::WarmStandby => "warm_standby",
            Self::AlwaysOn => "always_on",
        }
    }
}

impl std::fmt::Display for PersistenceClass {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)] // tests panic on assertion failure by design
mod tests {
    use super::*;

    #[test]
    fn default_is_on_demand() {
        assert_eq!(PersistenceClass::default(), PersistenceClass::OnDemand);
    }

    #[test]
    fn on_demand_is_evictable_first() {
        assert!(PersistenceClass::OnDemand.is_evictable());
        assert_eq!(PersistenceClass::OnDemand.eviction_priority(), 0);
        assert!(!PersistenceClass::OnDemand.reserves_capacity());
    }

    #[test]
    fn warm_standby_is_evictable_last() {
        assert!(PersistenceClass::WarmStandby.is_evictable());
        assert_eq!(PersistenceClass::WarmStandby.eviction_priority(), 1);
        assert!(!PersistenceClass::WarmStandby.reserves_capacity());
    }

    #[test]
    fn always_on_is_not_evictable_and_reserves() {
        assert!(!PersistenceClass::AlwaysOn.is_evictable());
        assert_eq!(PersistenceClass::AlwaysOn.eviction_priority(), u8::MAX);
        assert!(PersistenceClass::AlwaysOn.reserves_capacity());
    }

    #[test]
    fn eviction_order_matches_priority() {
        let mut classes = [
            PersistenceClass::AlwaysOn,
            PersistenceClass::OnDemand,
            PersistenceClass::WarmStandby,
        ];
        // `eviction_priority` takes `self` by value, so wrap in a
        // closure that dereferences the `&PersistenceClass` sort_by_key
        // hands us. `Copy` makes the deref free.
        classes.sort_by_key(|c| c.eviction_priority());
        assert_eq!(
            classes,
            [
                PersistenceClass::OnDemand,
                PersistenceClass::WarmStandby,
                PersistenceClass::AlwaysOn,
            ]
        );
    }

    #[test]
    fn serde_snake_case() {
        let json = serde_json::to_string(&PersistenceClass::WarmStandby).unwrap();
        assert_eq!(json, "\"warm_standby\"");
        let back: PersistenceClass = serde_json::from_str("\"always_on\"").unwrap();
        assert_eq!(back, PersistenceClass::AlwaysOn);
    }

    #[test]
    fn as_str_matches_serde() {
        for class in [
            PersistenceClass::OnDemand,
            PersistenceClass::WarmStandby,
            PersistenceClass::AlwaysOn,
        ] {
            let json = serde_json::to_string(&class).unwrap();
            assert_eq!(json, format!("\"{}\"", class.as_str()));
        }
    }
}
