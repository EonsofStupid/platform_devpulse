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
    })
}

pub(super) async fn list(db: &dyn SqlAdapter) -> Result<Vec<Record>> {
    db.query("SELECT id, label, provider_id, endpoint, credential_ref FROM ai_connections ORDER BY label, id", &[])
        .await?.iter().map(decode).collect()
}

pub(super) async fn get(db: &dyn SqlAdapter, id: &str) -> Result<Record> {
    let rows = db.query("SELECT id, label, provider_id, endpoint, credential_ref FROM ai_connections WHERE id = ?", &[id.into()]).await?;
    decode(rows.first().context("Saved AI connection was not found")?)
}

pub(super) async fn save(db: &dyn SqlAdapter, record: &Record) -> Result<()> {
    let affected = db.execute("INSERT INTO ai_connections (id, label, provider_id, endpoint, credential_ref) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET label = excluded.label, provider_id = excluded.provider_id, endpoint = excluded.endpoint, credential_ref = excluded.credential_ref, updated_at = unixepoch()",
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
