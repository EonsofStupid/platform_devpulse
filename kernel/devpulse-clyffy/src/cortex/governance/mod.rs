//! Cortex governance graph — operator-authored reasoning trees.
//!
//! `CORTEX.md` §4 is the spec. Per-project scoping via `project_id`
//! field within the user namespace, matching the existing
//! `memories` / `corrections` per-project pattern. Three built-in
//! edge types (`leads_to` / `refines` / `summarizes`); custom edge
//! types load via plugin registry in the last build phase.
//!
//! This module ships the B-1 foundation slice: thought create + load
//! by branch. Edge linking arrives in B-2; checkpoint consolidation
//! arrives in C; the visualizer surfaces (Tree 2D / Graph 3D) arrive
//! in B-3 and D respectively.
//!
//! # Boundary
//!
//! Kernel-owned. The function signatures take `&ScopedGraphHandle`
//! directly — engine's `GraphService::handle()` returns one, so engine
//! callers stay one method-call away. `rro_state` crosses as the
//! canonical lowercase string (`"idle"`, `"gathering"`, …) per the
//! `signals.registry.yaml` member ids; engine layers convert their
//! `RroState` enum at the boundary via `RroState::as_str()`.

use crate::cortex::persistence::ScopedGraphHandle;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// One thought in a reasoning tree — mirrors the `thought` table in
/// `USER_GRAPH_SCHEMA`. `id` is the Surreal record id (`thought:<uuid>`)
/// so callers can use it directly as a relation endpoint.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub struct ThoughtRecord {
    /// Surreal record id (`thought:<uuid>`).
    pub id: String,
    /// Free-form thought content.
    pub content: String,
    /// RRO state at thought creation time, canonical lowercase string
    /// per `signals.registry.yaml` group `rro` (`"idle"`, `"gathering"`,
    /// `"processing"`, `"ruminating"`, `"ready"`, `"purged"`, `"forked"`).
    pub rro_state: String,
    /// Branch depth, 1-based. Capped at 14 per `CORTEX.md` §4.3.
    pub depth: i32,
    /// Proximity diagnostic at thought creation time (0.0..1.0).
    pub proximity: f32,
    /// Branch grouping id (UUID) — every thought in the same branch
    /// shares this value, regardless of depth.
    pub branch_id: String,
    /// Project this thought belongs to. `CORTEX.md` §4.5 — per-project
    /// scope is the default; cross-project happens via explicit
    /// `@<project>` mention in `content`, never an implicit edge.
    pub project_id: String,
    /// If `Some`, this is a consolidation summary node pointing at the
    /// collapsed subtree's root. `CORTEX.md` §4.4.
    pub checkpoint: Option<String>,
    /// Wall-clock creation time, milliseconds since UNIX epoch.
    pub created_at_ms: u64,
}

/// Create a new thought in the cortex governance graph.
///
/// Writes a `thought` row to the user namespace, scoped to the given
/// `project_id`. The returned `ThoughtRecord.id` is the Surreal record
/// id and is the canonical reference for subsequent `leads_to` /
/// `refines` / `summarizes` edges (B-2).
///
/// `rro_state` must be one of the canonical lowercase member ids from
/// `signals.registry.yaml` group `rro`. Engine callers convert their
/// `RroState` enum via `RroState::as_str()`.
///
/// # Errors
/// - The Surreal `CREATE` statement fails (sidecar down, schema drift,
///   serialization issue).
pub async fn thought_create(
    handle: &ScopedGraphHandle,
    project_id: &str,
    branch_id: &str,
    content: &str,
    rro_state: &str,
    depth: i32,
    proximity: f32,
) -> Result<ThoughtRecord> {
    let id = uuid::Uuid::new_v4().to_string();
    let now_ms = u64::try_from(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| d.as_millis()),
    )
    .unwrap_or(0);

    let props = serde_json::json!({
        "content": content,
        "rro_state": rro_state,
        "depth": depth,
        "proximity": proximity,
        "branch_id": branch_id,
        "project_id": project_id,
    });

    handle
        .create_node("thought", &id, &props)
        .await
        .context("Failed to create thought record")?;

    Ok(ThoughtRecord {
        id: format!("thought:{id}"),
        content: content.to_string(),
        rro_state: rro_state.to_string(),
        depth,
        proximity,
        branch_id: branch_id.to_string(),
        project_id: project_id.to_string(),
        checkpoint: None,
        created_at_ms: now_ms,
    })
}

/// Load every thought in a branch, ordered by depth ascending.
///
/// Filters the `thought` table by `(project_id, branch_id)`. Returns
/// an empty vector if the branch has no thoughts yet — never an
/// error.
///
/// # Errors
/// - The underlying Surreal query fails.
pub async fn thought_load_branch(
    handle: &ScopedGraphHandle,
    project_id: &str,
    branch_id: &str,
) -> Result<Vec<ThoughtRecord>> {
    // SAFETY: project_id and branch_id are caller-provided UUIDs in
    // production paths; we still escape single-quotes defensively to
    // keep the query robust against operator input.
    let project_safe = project_id.replace('\'', "''");
    let branch_safe = branch_id.replace('\'', "''");
    let surql = format!(
        "SELECT * FROM thought \
         WHERE project_id = '{project_safe}' AND branch_id = '{branch_safe}' \
         ORDER BY depth ASC;"
    );

    let result = handle
        .query(&surql)
        .await
        .context("Failed to load branch thoughts")?;

    let serde_json::Value::Array(rows) = result else {
        return Ok(Vec::new());
    };

    Ok(rows.iter().filter_map(coerce_row).collect())
}

/// Convert a single Surreal row into a `ThoughtRecord`. Returns `None`
/// when the row lacks required fields — silently skipped by the caller
/// rather than failing the whole branch load.
fn coerce_row(row: &serde_json::Value) -> Option<ThoughtRecord> {
    let obj = row.as_object()?;

    let id = obj.get("id").and_then(stringify_record_id)?;
    let content = obj
        .get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let rro_state = obj
        .get("rro_state")
        .and_then(|v| v.as_str())
        .unwrap_or("idle")
        .to_string();
    let depth = i32::try_from(
        obj.get("depth")
            .and_then(serde_json::Value::as_i64)
            .unwrap_or(1),
    )
    .unwrap_or(1);
    #[allow(clippy::cast_possible_truncation)]
    let proximity = obj
        .get("proximity")
        .and_then(serde_json::Value::as_f64)
        .unwrap_or(0.5) as f32;
    let branch_id = obj
        .get("branch_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let project_id = obj
        .get("project_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let checkpoint = obj.get("checkpoint").and_then(stringify_record_id);

    Some(ThoughtRecord {
        id,
        content,
        rro_state,
        depth,
        proximity,
        branch_id,
        project_id,
        checkpoint,
        // `created_at` lands as a Surreal datetime; we don't parse it
        // for B-1 since the UI uses Surreal-side ordering. B-2 will
        // surface the timestamp explicitly via a `time::unix_millis`
        // projection in the SELECT.
        created_at_ms: 0,
    })
}

/// `SurrealDB` serializes record ids in two shapes — `"thought:abc"`
/// when emitted as a string, or `{"tb": "thought", "id": {"String": "abc"}}`
/// when emitted as a structured object. Normalize to the string form.
fn stringify_record_id(value: &serde_json::Value) -> Option<String> {
    if let Some(s) = value.as_str() {
        return Some(s.to_string());
    }
    let obj = value.as_object()?;
    let tb = obj.get("tb").and_then(|v| v.as_str())?;
    let id_field = obj.get("id")?;
    let id_str = match id_field {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Object(inner) => {
            inner.values().find_map(|v| v.as_str().map(String::from))?
        }
        _ => return None,
    };
    Some(format!("{tb}:{id_str}"))
}
