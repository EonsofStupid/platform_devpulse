//! Backend pool — shared model instances with reference counting.
//!
//! Phase 4 implementation. Skeleton for Phase 1 compile.

/// Placeholder — Phase 4 implements shared instances with flume channels.
pub struct BackendPool {
    _private: (),
}

impl BackendPool {
    #[must_use]
    pub fn new() -> Self {
        Self { _private: () }
    }
}

impl Default for BackendPool {
    fn default() -> Self {
        Self::new()
    }
}
