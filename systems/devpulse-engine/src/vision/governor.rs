//! Pipeline governor — CPU / RAM / event-bridge backpressure.
//!
//! The governor owns the decision *"may the pipeline capture a frame
//! right now?"*. It reads one `GovernorSample` at a time from whoever
//! is willing to measure (the Tauri command layer wraps `sysinfo`) and
//! publishes a `GovernorState` onto a broadcast channel. Consumers
//! (pipeline, UI, metrics writer) subscribe.
//!
//! # Why a handle, not a free function
//!
//! Policy is mutable at runtime (operator tweaks the sliders). State is
//! shared (pipeline reads, UI displays, metrics logs). Both need
//! interior mutability + notification. `Arc<RwLock<...>>` plus a
//! broadcast sender is the same pattern `RroStateHandle` uses — same
//! facade tier.
//!
//! # Why no internal sampler
//!
//! Sampling CPU / RAM is OS-specific and crate-dependent (`sysinfo` in
//! our case). Keeping the sampler *outside* the engine module lets
//! unit tests feed synthetic `GovernorSample`s without mocking a whole
//! OS. The Tauri command layer that calls `tick` is where `sysinfo`
//! lives.

use std::sync::Arc;

use devpulse_telemetry::prelude::{broadcast_channel, BroadcastReceiver, BroadcastSender};
use tokio::sync::RwLock;

use super::dto::{GovernorPolicy, GovernorSample, GovernorState, GovernorThrottleReason};

/// Broadcast channel capacity — small on purpose. If more than 32
/// ticks pile up unprocessed, something is very wrong and we'd
/// rather see the lag signal than buffer further.
const EVENT_BROADCAST_CAPACITY: usize = 32;

/// Runtime handle to the pipeline governor.
///
/// Clone-friendly — `Arc<RwLock<...>>` internally. Same tier as
/// `RroStateHandle` / `GrammarHandle`.
#[derive(Clone)]
pub struct GovernorHandle {
    policy: Arc<RwLock<GovernorPolicy>>,
    state: Arc<RwLock<GovernorState>>,
    events: BroadcastSender<GovernorState>,
}

impl GovernorHandle {
    /// Construct a handle with the given policy. State starts in a
    /// not-throttled default; the first `tick` replaces it with a
    /// real decision.
    #[must_use]
    pub fn new(policy: GovernorPolicy) -> Self {
        let (tx, _rx) = broadcast_channel(EVENT_BROADCAST_CAPACITY);
        Self {
            policy: Arc::new(RwLock::new(policy)),
            state: Arc::new(RwLock::new(GovernorState {
                throttled: false,
                reason: None,
                last_cpu_pct: 0.0,
                last_rss_mb: 0,
                last_event_qps: 0.0,
                last_sampled_at_ms: 0,
            })),
            events: tx,
        }
    }

    /// Subscribe to governor state changes.
    ///
    /// Each `recv().await` yields a `LinkedTraced<GovernorState>`
    /// carrying the producer's OTel context — same pattern as every
    /// other facade handle.
    #[must_use]
    pub fn subscribe(&self) -> BroadcastReceiver<GovernorState> {
        self.events.subscribe()
    }

    /// Current policy.
    pub async fn policy(&self) -> GovernorPolicy {
        *self.policy.read().await
    }

    /// Replace the policy. Next `tick` reflects the new values.
    pub async fn set_policy(&self, policy: GovernorPolicy) {
        *self.policy.write().await = policy;
        tracing::info!(
            cpu_ceiling = policy.cpu_ceiling_pct,
            ram_ceiling_mb = policy.ram_ceiling_mb,
            event_qps = policy.event_bridge_qps,
            "vision.governor: policy updated"
        );
    }

    /// Current state snapshot.
    pub async fn snapshot(&self) -> GovernorState {
        *self.state.read().await
    }

    /// Convenience boolean — is the pipeline currently allowed to capture?
    pub async fn throttled(&self) -> bool {
        self.state.read().await.throttled
    }

    /// Feed one sample to the governor. Returns the updated state and
    /// broadcasts it to subscribers whenever the decision changes.
    ///
    /// Broadcasting only on transitions (not every tick) keeps the
    /// event stream low-volume — UI only needs to redraw when the
    /// dot flips colour.
    pub async fn tick(&self, sample: GovernorSample) -> GovernorState {
        let policy = *self.policy.read().await;
        let reason = decide(&policy, &sample);
        let throttled = reason.is_some();

        let new_state = GovernorState {
            throttled,
            reason,
            last_cpu_pct: sample.cpu_pct,
            last_rss_mb: sample.rss_mb,
            last_event_qps: sample.event_qps,
            last_sampled_at_ms: sample.sampled_at_ms,
        };

        let changed = {
            let mut guard = self.state.write().await;
            let prev = *guard;
            *guard = new_state;
            transition_fired(&prev, &new_state)
        };

        if changed {
            // Best-effort broadcast — subscribers that dropped their
            // receivers are not the governor's problem.
            let _ = self.events.send(new_state);
            if throttled {
                tracing::warn!(
                    cpu_pct = sample.cpu_pct,
                    rss_mb = sample.rss_mb,
                    event_qps = sample.event_qps,
                    reason = ?reason,
                    "vision.governor: throttled"
                );
            } else {
                tracing::info!("vision.governor: recovered");
            }
        }

        new_state
    }
}

impl Default for GovernorHandle {
    fn default() -> Self {
        Self::new(GovernorPolicy::default())
    }
}

/// Pure decision function — policy + sample → reason (or `None`).
///
/// Order is deliberate: CPU first (cheapest observation), then RAM,
/// then event QPS (softest ceiling — coalesce rather than drop).
fn decide(policy: &GovernorPolicy, sample: &GovernorSample) -> Option<GovernorThrottleReason> {
    if sample.cpu_pct >= policy.cpu_ceiling_pct {
        return Some(GovernorThrottleReason::Cpu);
    }
    if sample.rss_mb >= policy.ram_ceiling_mb {
        return Some(GovernorThrottleReason::Ram);
    }
    if sample.event_qps >= policy.event_bridge_qps {
        return Some(GovernorThrottleReason::EventBridgeQps);
    }
    None
}

/// We only broadcast on a *transition* — either throttled flag flipped
/// or the reason changed while still throttled.
fn transition_fired(prev: &GovernorState, next: &GovernorState) -> bool {
    prev.throttled != next.throttled || prev.reason != next.reason
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample(cpu_pct: f32, rss_mb: u64, event_qps: f32) -> GovernorSample {
        GovernorSample {
            cpu_pct,
            rss_mb,
            event_qps,
            sampled_at_ms: 0,
        }
    }

    #[test]
    fn decide_returns_none_under_ceilings() {
        let p = GovernorPolicy::default();
        assert!(decide(&p, &sample(50.0, 1000, 5.0)).is_none());
    }

    #[test]
    fn decide_hits_cpu_first() {
        let p = GovernorPolicy::default();
        // All three at once — CPU should win the race
        let r = decide(&p, &sample(90.0, 99999, 999.0)).unwrap();
        assert_eq!(r, GovernorThrottleReason::Cpu);
    }

    #[test]
    fn decide_returns_ram_when_cpu_fine() {
        let p = GovernorPolicy::default();
        let r = decide(&p, &sample(10.0, 99999, 5.0)).unwrap();
        assert_eq!(r, GovernorThrottleReason::Ram);
    }

    #[test]
    fn decide_returns_qps_when_cpu_and_ram_fine() {
        let p = GovernorPolicy::default();
        let r = decide(&p, &sample(10.0, 100, 999.0)).unwrap();
        assert_eq!(r, GovernorThrottleReason::EventBridgeQps);
    }

    #[test]
    fn decide_respects_custom_policy() {
        let p = GovernorPolicy {
            cpu_ceiling_pct: 20.0,
            ram_ceiling_mb: 100,
            event_bridge_qps: 5.0,
        };
        // 50% CPU fine under default 75, but breaches our custom 20.
        assert_eq!(
            decide(&p, &sample(50.0, 10, 1.0)).unwrap(),
            GovernorThrottleReason::Cpu
        );
    }

    #[tokio::test]
    async fn tick_updates_state_and_transitions_broadcast() {
        let h = GovernorHandle::new(GovernorPolicy::default());
        let mut rx = h.subscribe();

        // First throttled tick should fire a broadcast.
        let s1 = h.tick(sample(90.0, 100, 1.0)).await;
        assert!(s1.throttled);
        let received = rx.recv().await.expect("broadcast should fire");
        assert!(received.value.throttled);

        // Same throttled state → no new broadcast (channel empty).
        let _ = h.tick(sample(90.0, 100, 1.0)).await;
        assert!(
            rx.try_recv().is_err(),
            "no transition — no broadcast should fire"
        );

        // Recovery → fires again.
        let s3 = h.tick(sample(10.0, 100, 1.0)).await;
        assert!(!s3.throttled);
        let recovered = rx.recv().await.expect("recovery should broadcast");
        assert!(!recovered.value.throttled);
    }

    #[tokio::test]
    async fn policy_update_is_reflected_immediately() {
        let h = GovernorHandle::new(GovernorPolicy::default());
        let s1 = h.tick(sample(50.0, 100, 1.0)).await;
        assert!(!s1.throttled);
        h.set_policy(GovernorPolicy {
            cpu_ceiling_pct: 25.0,
            ..GovernorPolicy::default()
        })
        .await;
        let s2 = h.tick(sample(50.0, 100, 1.0)).await;
        assert!(s2.throttled);
        assert_eq!(s2.reason, Some(GovernorThrottleReason::Cpu));
    }
}
