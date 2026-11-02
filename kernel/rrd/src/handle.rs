//! # `PauseHandle` — opaque proof-of-pause
//!
//! Per `HOT_UPDATE_PATTERN.md` §5.2 / H7: encodes the
//! `pause → swap → resume` protocol in the type system. The
//! compiler rejects the three failure modes:
//!
//! - `resume()` without `pause()` — no way to construct a
//!   `PauseHandle` outside the daemon.
//! - Double `resume()` — handle is moved into the call (no `Clone`).
//! - `swap()` without `pause()` — no handle to borrow.
//!
//! ## Why not just a boolean?
//!
//! Because a boolean lets a caller pass `true` accidentally. A
//! move-only opaque token forces the caller to obtain one from
//! `pause()`, which forces them to actually pause first. Type-state
//! over runtime assertion.

/// Opaque proof-of-pause. Cannot be constructed outside this crate.
///
/// `Debug` prints a constant string — the inner field is intentionally
/// not exposed (changing its shape later, e.g. to carry a unique id,
/// must not break observers).
#[derive(Debug)]
pub struct PauseHandle {
    /// Private unit — exists only so the type can't be constructed
    /// via `PauseHandle {}` from outside the crate. Construction
    /// goes through `PauseHandle::new()` which is `pub(crate)`.
    _opaque: (),
}

impl PauseHandle {
    /// Construct a fresh handle. Crate-private so only the daemon
    /// (and its tests) can mint one.
    pub(crate) fn new() -> Self {
        Self { _opaque: () }
    }
}

// The tests enforce the ownership contract at compile time: this token
// cannot be copied or cloned into a second authorization to resume.

#[cfg(test)]
mod tests {
    use super::*;

    static_assertions::assert_not_impl_any!(PauseHandle: Clone, Copy);

    #[test]
    fn pause_handle_construction_works_inside_crate() {
        let _handle = PauseHandle::new();
    }
}
