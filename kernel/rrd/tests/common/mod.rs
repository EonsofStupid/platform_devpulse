//! Shared test fixture — a minimal `HotUpdateable` impl that records
//! load/validate calls and lets each test inject success or failure
//! deterministically.

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use thiserror::Error;

use rrd::HotUpdateable;

/// Trivial component identified by a `u32` generation. Each `swap`
/// in tests rotates the generation so the test can assert which
/// component is currently live.
#[derive(Debug)]
pub struct TestComponent {
    pub generation: u32,
}

impl TestComponent {
    pub fn new(generation: u32) -> Arc<Self> {
        Arc::new(Self { generation })
    }
}

/// Source descriptor that controls behavior of `load` and `validate`
/// for a given test. `pass_validate = false` lets test 6 inject a
/// validation failure deterministically.
#[derive(Debug, Clone)]
pub struct TestSource {
    pub generation: u32,
    pub pass_validate: bool,
}

#[derive(Debug, Error)]
pub enum TestLoadError {
    #[error("synthetic validation failure (gen={0})")]
    ValidationRejected(u32),
}

/// Counter shared across all tests in a process — read by tests
/// asserting that load/validate were/weren't called.
pub static LOAD_CALLS: AtomicU32 = AtomicU32::new(0);
pub static VALIDATE_CALLS: AtomicU32 = AtomicU32::new(0);

impl HotUpdateable for TestComponent {
    type Source = TestSource;
    type Snapshot = TestSnapshot;
    type LoadError = TestLoadError;

    async fn load(source: &Self::Source) -> Result<Self::Snapshot, Self::LoadError> {
        LOAD_CALLS.fetch_add(1, Ordering::Relaxed);
        Ok(TestSnapshot {
            generation: source.generation,
            pass_validate: source.pass_validate,
        })
    }

    async fn validate(snap: &Self::Snapshot) -> Result<(), Self::LoadError> {
        VALIDATE_CALLS.fetch_add(1, Ordering::Relaxed);
        if snap.pass_validate {
            Ok(())
        } else {
            Err(TestLoadError::ValidationRejected(snap.generation))
        }
    }

    fn into_live(snap: Self::Snapshot) -> Arc<Self> {
        Arc::new(TestComponent {
            generation: snap.generation,
        })
    }
}

/// Snapshot — pre-live form. Carries the generation that will be
/// promoted on a successful swap.
#[derive(Debug)]
pub struct TestSnapshot {
    pub generation: u32,
    pub pass_validate: bool,
}
