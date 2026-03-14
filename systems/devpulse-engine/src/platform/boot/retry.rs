//! Windows file-lock retry utility.
//!
//! Windows can hold file locks briefly after a process exits or during
//! antivirus scans. This retries async operations with exponential backoff
//! when sharing violations are detected.

use crate::platform::config::WindowsConfig;
use std::future::Future;
use std::time::Duration;

/// Retry an async file operation on Windows sharing violations.
///
/// Retries with exponential backoff when the error message indicates
/// a file lock (sharing violation, access denied, os error 32/33).
///
/// # Errors
/// Returns the last error if all retries are exhausted.
pub async fn retry_on_lock_async<F, Fut, T>(
    config: &WindowsConfig,
    operation: &str,
    mut f: F,
) -> anyhow::Result<T>
where
    F: FnMut() -> Fut,
    Fut: Future<Output = anyhow::Result<T>>,
{
    let mut last_err = None;
    for attempt in 0..config.file_lock_retries {
        match f().await {
            Ok(val) => return Ok(val),
            Err(e) => {
                let err_str = format!("{e:#}");
                let is_lock_error = err_str.contains("sharing violation")
                    || err_str.contains("being used by another process")
                    || err_str.contains("Access is denied")
                    || err_str.contains("os error 32")
                    || err_str.contains("os error 33");

                if is_lock_error && attempt + 1 < config.file_lock_retries {
                    let delay = u64::from(1u32 << attempt.min(3))
                        * config.file_lock_retry_delay_ms;
                    tracing::warn!(
                        operation,
                        attempt = attempt + 1,
                        max = config.file_lock_retries,
                        delay_ms = delay,
                        "File lock detected — retrying"
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
