//! Cross-platform file-lock retry utility.
//!
//! On Windows, file locks persist briefly after a process exits or during
//! antivirus scans. On Linux/macOS, file locks are rare but can occur with
//! NFS or antivirus. This retries operations with exponential backoff when
//! sharing violations are detected.
//!
//! All stores use this — `DuckDB`, `SurrealDB`, `LibSQL`. No hand-rolled retries.

use std::future::Future;
use std::time::Duration;

/// Retry parameters — per-store overridable.
///
/// Each store can specify its own retry behavior. Defaults are generous
/// enough to cover Windows file-lock release (typically 1-5 seconds).
#[derive(Debug, Clone)]
pub struct RetryConfig {
    /// Maximum number of retry attempts.
    pub max_retries: u32,
    /// Base delay between retries in milliseconds (multiplied by 2^attempt).
    pub base_delay_ms: u64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 5,
            base_delay_ms: 500,
        }
    }
}

/// Retry an async file operation on transient storage-open failures.
///
/// Retries with exponential backoff when the error message indicates
/// a file lock (sharing violation, access denied, os error 32/33) or a
/// Surreal graph-open timeout that points at stale locks / WAL recovery.
/// Cross-platform — detects Windows, Linux, and macOS lock error patterns.
///
/// # Errors
/// Returns the last error if all retries are exhausted.
pub async fn retry_on_lock_async<F, Fut, T>(
    config: &RetryConfig,
    operation: &str,
    mut f: F,
) -> anyhow::Result<T>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = anyhow::Result<T>>,
{
    let mut last_err = None;
    for attempt in 0..config.max_retries {
        match f().await {
            Ok(val) => return Ok(val),
            Err(e) => {
                let err_str = format!("{e:#}");
                let is_retryable = is_retryable_error(operation, &err_str);

                if is_retryable && attempt + 1 < config.max_retries {
                    let delay = u64::from(1u32 << attempt.min(3)) * config.base_delay_ms;
                    tracing::warn!(
                        operation,
                        attempt = attempt + 1,
                        max = config.max_retries,
                        delay_ms = delay,
                        error = %err_str,
                        "Transient store-open failure detected — retrying"
                    );
                    tokio::time::sleep(Duration::from_millis(delay)).await;
                    last_err = Some(e);
                } else {
                    return Err(e);
                }
            }
        }
    }
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("retry exhausted for {operation}")))
}

/// Check if an error message indicates a file lock.
///
/// Cross-platform: covers Windows sharing violations (os error 32/33),
/// POSIX lock errors (EAGAIN, EACCES on lock), and common error messages
/// from `DuckDB`, `SurrealDB`, and `LibSQL`.
fn is_file_lock_error(err: &str) -> bool {
    // Windows
    err.contains("sharing violation")
        || err.contains("being used by another process")
        || err.contains("Access is denied")
        || err.contains("os error 32")
        || err.contains("os error 33")
        // POSIX / cross-platform
        || err.contains("locked")
        || err.contains("EAGAIN")
        || err.contains("Resource temporarily unavailable")
        || err.contains("database is locked")
}

fn is_retryable_error(operation: &str, err: &str) -> bool {
    if is_file_lock_error(err) {
        return true;
    }

    let operation_lower = operation.to_ascii_lowercase();
    let err_lower = err.to_ascii_lowercase();
    let is_surreal_graph_open = operation_lower.contains("surrealdb");
    let is_timeout = err_lower.contains("timed out");
    let points_at_lock_or_recovery = err_lower.contains("stale lock")
        || err_lower.contains("wal recovery")
        || err_lower.contains("surrealkv open");

    is_surreal_graph_open && is_timeout && points_at_lock_or_recovery
}

#[cfg(test)]
mod tests {
    use super::is_retryable_error;

    #[test]
    fn retries_surreal_timeout_that_points_at_stale_lock() {
        assert!(is_retryable_error(
            "Graph store (SurrealDB)",
            "SurrealDB open timed out (15s) — likely stale lock or WAL recovery hang",
        ));
    }

    #[test]
    fn does_not_retry_arbitrary_timeouts() {
        assert!(!is_retryable_error(
            "System analytics",
            "operation timed out after 15s",
        ));
    }
}
