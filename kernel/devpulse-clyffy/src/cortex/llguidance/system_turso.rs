//! System-scoped Turso persistence for grammar / constrained decoding.
//!
//! Tables are created by the engine's `SYSTEM_SCHEMA`; this module owns the
//! kernel-side write contract for those rows.

use anyhow::{Context, Result};
use serde_json::json;
use turso::params;

use super::GrammarConfig;
use crate::cortex::persistence::TursoAdapter;

/// Primary singleton row id in `grammar_service`.
pub const GRAMMAR_SERVICE_PRIMARY_ID: &str = "primary";

/// Upsert the `grammar_service` row from kernel-owned [`GrammarConfig`].
///
/// # Errors
/// Returns an error if serialization or Turso execution fails.
pub async fn sync_grammar_service_from_config(
    adapter: &TursoAdapter,
    grammar: &GrammarConfig,
) -> Result<()> {
    let enabled: i64 = i64::from(grammar.enabled);
    let last_boot_ok: i64 = 1;
    let runtime = json!({
        "clyffy_crate": env!("CARGO_PKG_VERSION"),
        "llguidance_feature": cfg!(feature = "llguidance"),
    });
    let runtime_json =
        serde_json::to_string(&runtime).context("serialize grammar_service.runtime_json")?;

    adapter
        .execute_bound(
            r"INSERT INTO grammar_service (id, enabled, service_kind, last_boot_ok, last_error, runtime_json, updated_at)
                  VALUES (?1, ?2, ?3, ?4, NULL, ?5, unixepoch())
                ON CONFLICT(id) DO UPDATE SET
                  enabled = excluded.enabled,
                  service_kind = excluded.service_kind,
                  last_boot_ok = excluded.last_boot_ok,
                  last_error = excluded.last_error,
                  runtime_json = excluded.runtime_json,
                  updated_at = excluded.updated_at",
            params![
                GRAMMAR_SERVICE_PRIMARY_ID,
                enabled,
                grammar.kind.as_str(),
                last_boot_ok,
                runtime_json.as_str(),
            ],
        )
        .await?;

    Ok(())
}
