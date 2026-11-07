//! Project-scoped ticket intake in the platform's user store.
use anyhow::{Context, Result, ensure};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlRow, SqlValue, TursoAdapter};
use serde::{Deserialize, Serialize};
use specta::Type;
use uuid::Uuid;

/// A persisted human-authored work specification.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Ticket {
    /// Stable internal identity.
    pub id: String,
    /// Project that owns the ticket.
    pub project_id: String,
    /// Short description.
    pub title: String,
    /// Desired result.
    pub goal: String,
    /// Evidence required before acceptance.
    pub criteria: Vec<String>,
    /// Current work revision.
    pub revision: i64,
    /// Creation time, Unix seconds.
    pub created_at: i64,
}

fn text(row: &SqlRow, index: usize) -> Result<&str> {
    row.get(index)
        .and_then(SqlValue::as_text)
        .context("Invalid ticket text")
}

fn decode(row: &SqlRow) -> Result<Ticket> {
    Ok(Ticket {
        id: text(row, 0)?.into(),
        project_id: text(row, 1)?.into(),
        title: text(row, 2)?.into(),
        goal: text(row, 3)?.into(),
        criteria: serde_json::from_str(text(row, 4)?).context("Invalid stored ticket criteria")?,
        revision: row
            .get(5)
            .and_then(SqlValue::as_integer)
            .context("Invalid ticket revision")?,
        created_at: row
            .get(6)
            .and_then(SqlValue::as_integer)
            .context("Invalid ticket time")?,
    })
}

/// Read work owned by one project.
/// # Errors
/// Database or stored-data errors.
pub async fn list(db: &TursoAdapter, project: &str) -> Result<Vec<Ticket>> {
    let rows = db.query("SELECT id, project_id, title, goal, criteria_json, revision, created_at FROM agenthub_tickets WHERE project_id = ? ORDER BY created_at DESC, id DESC", &[project.into()]).await?;
    rows.iter().map(decode).collect()
}

/// Create an intake ticket and its audit event in one transaction.
/// # Errors
/// Invalid work, an unknown project, or a database failure.
pub async fn create(
    db: &TursoAdapter,
    project: &str,
    title: &str,
    goal: &str,
    criteria: Vec<String>,
) -> Result<Ticket> {
    let title = title.trim();
    let goal = goal.trim();
    ensure!(
        !title.is_empty() && title.len() <= 256,
        "Title must contain 1 to 256 bytes"
    );
    ensure!(
        !goal.is_empty() && goal.len() <= 16_384,
        "Goal must contain 1 to 16384 bytes"
    );
    let criteria: Vec<String> = criteria
        .into_iter()
        .map(|s| s.trim().to_owned())
        .filter(|s| !s.is_empty())
        .collect();
    ensure!(
        !criteria.is_empty() && criteria.len() <= 50 && criteria.iter().all(|s| s.len() <= 2048),
        "Provide 1 to 50 bounded acceptance criteria"
    );
    ensure!(
        !db.query("SELECT id FROM projects WHERE id = ?", &[project.into()])
            .await?
            .is_empty(),
        "Project not found"
    );
    let id = Uuid::new_v4().to_string();
    let event = Uuid::new_v4().to_string();
    let criteria_json = serde_json::to_string(&criteria)?;
    db.write_atomic(&[
        ("INSERT INTO agenthub_tickets (id, project_id, title, goal, criteria_json) VALUES (?, ?, ?, ?, ?)", vec![id.as_str().into(), project.into(), title.into(), goal.into(), criteria_json.into()]),
        ("INSERT INTO agenthub_events (id, ticket_id, project_id, kind, revision) VALUES (?, ?, ?, 'created', 1)", vec![event.as_str().into(), id.as_str().into(), project.into()]),
    ]).await.context("Save ticket and creation event")?;
    let rows = db.query("SELECT id, project_id, title, goal, criteria_json, revision, created_at FROM agenthub_tickets WHERE id = ? AND project_id = ?", &[id.as_str().into(), project.into()]).await?;
    decode(rows.first().context("Saved ticket not found")?)
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test assertions")]
    use super::*;
    use crate::platform::services::relational::{RelationalService, USER_STORE};
    use devpulse_clyffy::cortex::persistence::TursoOptions;

    #[tokio::test]
    async fn intake_is_project_scoped_durable_and_audited() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("user.db");
        let store =
            RelationalService::boot(&path, USER_STORE, "ticket test", TursoOptions::default())
                .await
                .unwrap();
        let db = store.adapter();
        db.execute_batch(
            "INSERT INTO projects(id,name,root_path) VALUES ('p','one','/one'),('q','two','/two');",
        )
        .await
        .unwrap();
        let ticket = create(
            db,
            "p",
            "  Restore  ",
            " Restore the work ",
            vec![" Verified ".into()],
        )
        .await
        .unwrap();
        assert_eq!(ticket.title, "Restore");
        assert_eq!(ticket.criteria, ["Verified"]);
        assert!(list(db, "q").await.unwrap().is_empty());
        assert!(
            create(db, "missing", "Title", "Goal", vec!["Criteria".into()])
                .await
                .is_err()
        );
        assert!(
            create(db, "p", "Title", "Goal", vec![" ".into()])
                .await
                .is_err()
        );
        let events = db
            .query(
                "SELECT kind, revision FROM agenthub_events WHERE ticket_id = ?",
                &[ticket.id.as_str().into()],
            )
            .await
            .unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0][0].as_text(), Some("created"));
        drop(store);
        let reopened =
            RelationalService::boot(&path, USER_STORE, "ticket test", TursoOptions::default())
                .await
                .unwrap();
        assert_eq!(
            list(reopened.adapter(), "p").await.unwrap()[0].id,
            ticket.id
        );
    }
}
