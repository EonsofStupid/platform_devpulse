//! Recovery copies for failed database writes. Never replayed automatically.

use std::path::Path;

use anyhow::{Context, Result};
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

use super::{ResumeUpdate, TurnRow};

pub(in crate::platform) async fn retain(
    data_dir: &Path,
    session_id: &str,
    project_id: &str,
    turn: &TurnRow<'_>,
    continuation: Option<&ResumeUpdate<'_>>,
    error: &anyhow::Error,
) -> String {
    let document = serde_json::json!({
        "version": 1, "sessionId": session_id, "projectId": project_id,
        "turn": turn, "continuation": continuation,
    });
    match write(data_dir, &document).await {
        Ok(path) => format!("The answer was not saved to history: {error:#}. Recovery copy: {}. No tool work was retried.", path.display()),
        Err(recovery_error) => format!("The answer was not saved to history: {error:#}. A recovery copy could not be written: {recovery_error:#}. Copy the visible answer before closing this window."),
    }
}

async fn write(data_dir: &Path, document: &serde_json::Value) -> Result<std::path::PathBuf> {
    let dir = data_dir.join("agenthub").join("recovery");
    tokio::fs::create_dir_all(&dir)
        .await
        .context("create the recovery directory")?;
    let path = dir.join(format!("{}.json", Uuid::new_v4()));
    let bytes = serde_json::to_vec_pretty(document).context("encode the recovery copy")?;
    let mut file = tokio::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)
        .await
        .context("create the recovery copy")?;
    file.write_all(&bytes)
        .await
        .context("write the recovery copy")?;
    file.sync_all().await.context("flush the recovery copy")?;
    Ok(path)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]
    use super::*;

    #[tokio::test]
    async fn recovery_preserves_content_and_continuation_without_overwriting() {
        let dir = tempfile::tempdir().unwrap();
        let document =
            serde_json::json!({"answer": "complete answer", "continuation": "resume-id"});
        let first = write(dir.path(), &document).await.unwrap();
        let second = write(dir.path(), &document).await.unwrap();
        assert_ne!(first, second);
        assert_eq!(
            serde_json::from_slice::<serde_json::Value>(&tokio::fs::read(first).await.unwrap())
                .unwrap(),
            document
        );
    }

    #[tokio::test]
    async fn recovery_io_failure_is_not_reported_as_a_saved_copy() {
        let dir = tempfile::tempdir().unwrap();
        tokio::fs::write(dir.path().join("agenthub"), "occupied")
            .await
            .unwrap();
        assert!(write(dir.path(), &serde_json::json!({})).await.is_err());
    }
}
