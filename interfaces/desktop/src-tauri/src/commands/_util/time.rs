//! Time helpers shared across every command module.
//!
//! Replaces ~4 hand-rolled `now_ms()` copies that drifted across pixvix,
//! claude/autoregister, providers, etc. One implementation, one rounding
//! convention, one place to fix bugs.

use std::time::{SystemTime, UNIX_EPOCH};

/// Unix epoch milliseconds, saturating to `i64::MAX` rather than panicking
/// on the (post-year-292M) overflow path. Returns 0 if the system clock
/// is somehow before the epoch — neither path is realistic on a machine
/// healthy enough to run DevPulse.
#[must_use]
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
        .unwrap_or(0)
}

/// ISO-8601 / RFC-3339 timestamp in UTC, second-precision. Used by log
/// records and the few DTO fields that prefer human-readable strings
/// over epoch numbers.
#[must_use]
pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn now_ms_returns_post_2020_epoch() {
        assert!(now_ms() > 1_577_836_800_000);
    }

    #[test]
    fn now_iso_starts_with_year_prefix() {
        let s = now_iso();
        // Format: "2026-04-25T..." — first four chars are the year.
        assert!(s.len() >= 20);
        assert!(s.chars().take(4).all(|c| c.is_ascii_digit()));
        assert_eq!(s.chars().nth(4), Some('-'));
    }
}
