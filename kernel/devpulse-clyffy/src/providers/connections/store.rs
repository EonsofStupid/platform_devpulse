//! Typed connection persistence over the existing SQL port.
use crate::cortex::persistence::{SqlAdapter, SqlRow};
use crate::providers::ProviderId;
use anyhow::{Context, Result, ensure};

pub(super) struct Record {
    pub id: String,
    pub label: String,
    pub provider: ProviderId,
    pub endpoint: String,
    pub credential_ref: Option<String>,
    pub revision: i64,
}

fn decode(row: &SqlRow) -> Result<Record> {
    let text = |i| {
        row.get(i)
            .and_then(crate::cortex::persistence::SqlValue::as_text)
            .context("Invalid saved AI connection column")
    };
    Ok(Record {
        id: text(0)?.to_owned(),
        label: text(1)?.to_owned(),
        provider: serde_json::from_value(serde_json::Value::String(text(2)?.to_owned()))?,
        endpoint: text(3)?.to_owned(),
        credential_ref: row
            .get(4)
            .and_then(crate::cortex::persistence::SqlValue::as_text)
            .map(str::to_owned),
        revision: row
            .get(5)
            .and_then(crate::cortex::persistence::SqlValue::as_integer)
            .filter(|n| *n > 0)
            .context("Invalid saved AI connection revision")?,
    })
}

pub(super) async fn list(db: &dyn SqlAdapter) -> Result<Vec<Record>> {
    db.query("SELECT id, label, provider_id, endpoint, credential_ref, revision FROM ai_connections ORDER BY label, id", &[])
        .await?.iter().map(decode).collect()
}

pub(super) async fn find(db: &dyn SqlAdapter, id: &str) -> Result<Option<Record>> {
    let rows = db.query("SELECT id, label, provider_id, endpoint, credential_ref, revision FROM ai_connections WHERE id = ?", &[id.into()]).await?;
    rows.first().map(decode).transpose()
}

pub(super) async fn get(db: &dyn SqlAdapter, id: &str) -> Result<Record> {
    find(db, id)
        .await?
        .context("Saved AI connection was not found")
}

pub(super) async fn save(db: &dyn SqlAdapter, record: &Record) -> Result<()> {
    let affected = db.execute("INSERT INTO ai_connections (id, label, provider_id, endpoint, credential_ref) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET label = excluded.label, provider_id = excluded.provider_id, endpoint = excluded.endpoint, credential_ref = excluded.credential_ref, revision = ai_connections.revision + 1, updated_at = unixepoch()",
        &[record.id.clone().into(), record.label.clone().into(), record.provider.key().into(), record.endpoint.clone().into(), record.credential_ref.clone().into()]).await?;
    ensure!(affected == 1, "AI connection was not saved");
    Ok(())
}

pub(super) async fn remove(db: &dyn SqlAdapter, id: &str) -> Result<()> {
    let affected = db
        .execute("DELETE FROM ai_connections WHERE id = ?", &[id.into()])
        .await?;
    ensure!(affected == 1, "AI connection was not found");
    Ok(())
}

/// A saved choice of connection and model for one speech role.
pub(super) struct SpeechRow {
    pub connection_id: String,
    pub revision: i64,
    pub label: String,
    pub model: String,
}

pub(super) async fn speech_binding(db: &dyn SqlAdapter, role: &str) -> Result<Option<SpeechRow>> {
    let rows = db.query("SELECT connection_id, connection_revision, connection_label, model FROM speech_endpoint_bindings WHERE role = ?", &[role.into()]).await?;
    rows.first()
        .map(|row| {
            let text = |i| {
                row.get(i)
                    .and_then(crate::cortex::persistence::SqlValue::as_text)
                    .context("Invalid speech binding column")
            };
            Ok(SpeechRow {
                connection_id: text(0)?.to_owned(),
                revision: row
                    .get(1)
                    .and_then(crate::cortex::persistence::SqlValue::as_integer)
                    .filter(|n| *n > 0)
                    .context("Invalid speech binding revision")?,
                label: text(2)?.to_owned(),
                model: text(3)?.to_owned(),
            })
        })
        .transpose()
}

pub(super) async fn save_speech_binding(
    db: &dyn SqlAdapter,
    role: &str,
    row: &SpeechRow,
) -> Result<()> {
    let affected = db.execute("INSERT INTO speech_endpoint_bindings (role, connection_id, connection_revision, connection_label, model) VALUES (?, ?, ?, ?, ?) ON CONFLICT(role) DO UPDATE SET connection_id = excluded.connection_id, connection_revision = excluded.connection_revision, connection_label = excluded.connection_label, model = excluded.model, updated_at = unixepoch()",
        &[role.into(), row.connection_id.clone().into(), row.revision.into(), row.label.clone().into(), row.model.clone().into()]).await?;
    ensure!(affected == 1, "Speech binding was not saved");
    Ok(())
}

/// Clearing a role that has no binding is not a failure: the outcome is the same.
pub(super) async fn clear_speech_binding(db: &dyn SqlAdapter, role: &str) -> Result<()> {
    db.execute(
        "DELETE FROM speech_endpoint_bindings WHERE role = ?",
        &[role.into()],
    )
    .await?;
    Ok(())
}
