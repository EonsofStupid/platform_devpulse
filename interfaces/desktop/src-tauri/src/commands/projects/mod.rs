//! Project CRUD commands — the foundation of "managed knowledge".
//!
//! A **project** is a directory the user has explicitly told `DevPulse`
//! to track. At any time there is **exactly one active project**; the
//! user can link arbitrarily many read-only **reference directories**
//! to the active project for context, search, and indexing.
//!
//! # Storage model
//!
//! Every mutation writes the user **Turso** database (the authoritative
//! local SSOT) — if that write fails, the mutation fails. DevPulse runs
//! **standalone** on Turso alone; project CRUD never depends on the AI
//! layer.
//!
//! The knowledge **graph** (a `SurrealDB` view of projects + references)
//! is **Clyffy's** — headless, on the GB10, reached over the
//! `devpulse-gb10-client` wire. It is a **Tier-2 capability**: when
//! Clyffy is disconnected the graph mirror is simply skipped (Turso is
//! authoritative); when connected, DevPulse notifies Clyffy of the
//! mutation so Clyffy mirrors it into its own graph. That notify path is
//! best-effort and non-fatal — a mirror failure never rolls back the
//! Turso write. Available once the AI-layer connection is active.
//!
//! Active-project state is stored in the user Turso `kv_store` under
//! `active_project_id`. No schema migration required — `kv_store` is the
//! catch-all for singleton user state.
//!
//! # Tables touched
//!
//! * User Turso DB (authoritative, local, standalone):
//!   * `projects` — 1 row per project
//!   * `project_references` — N rows per project (read-only dirs)
//!   * `kv_store` — `active_project_id` singleton
//! * Clyffy's graph (Tier-2, over the wire, deferred notify): the
//!   `project` / `project_reference` / `active_project` nodes + the
//!   `references` edge live in **Clyffy's** `SurrealDB` schema (in the
//!   ClyffyOS repo), not here.
//!
//! # Command error surface
//!
//! All commands return `Result<T, String>` because tauri-specta
//! flattens anyhow chains to `String` at the IPC boundary; error
//! context is preserved via `.map_err(|e| format!("…{e:#}"))`.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over `Platform` / `SqlAdapter` whose docs hold the canonical # Errors copy (also documented in the module-level `# Command error surface` section above)"
)]

use crate::state::{ClyffyConnectionState, PlatformState};
use devpulse_gb10_client::ConnectionState;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;
use uuid::Uuid;

use devpulse_engine::platform::{Platform, SqlAdapter};

/// Active-project singleton key in the user Turso `kv_store`.
const KV_ACTIVE_PROJECT: &str = "active_project_id";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

/// A full project row returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Project {
    /// `UUIDv4` identifier assigned at `create_project` time. Stable for
    /// the life of the row.
    pub id: String,
    /// Human-readable display name shown in the UI.
    pub name: String,
    /// Absolute path to the project root on disk. `UNIQUE` at the SQL
    /// level — the same directory cannot be tracked twice.
    pub root_path: String,
    /// One of: `"general" | "personal" | "team" | "archived"`.
    pub project_type: String,
    /// Optional URL-safe slug derived from `name`. Populated by the UI
    /// when the user customises the link path.
    pub slug: Option<String>,
    /// Free-form one-line description shown in project cards.
    pub description: Option<String>,
    /// Source tool hint: `"lovable" | "cursor" | "vscode" | …`. Free-form.
    pub tool: Option<String>,
    /// JSON array serialized as a string, per the schema.
    pub tech_stack: Option<String>,
    /// Whether the project is active (soft-delete flag flipped to 0).
    pub active: bool,
    /// Unix seconds.
    pub created_at: i64,
}

/// Input for [`create_project`]. Only `name` and `root_path` are
/// required; every other field has a sensible default or is nullable.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateProjectInput {
    /// Human-readable project name. Trimmed; must be non-empty.
    pub name: String,
    /// Absolute path to the project root on disk. Trimmed; must be
    /// non-empty. Uniqueness is enforced at the SQL layer.
    pub root_path: String,
    /// Defaults to `"personal"`.
    #[serde(default)]
    pub project_type: Option<String>,
    /// Optional one-line description. Stored as empty string when
    /// omitted to keep the column NOT NULL.
    #[serde(default)]
    pub description: Option<String>,
    /// Optional source-tool hint (e.g. `"vscode"`, `"cursor"`). Free-form.
    #[serde(default)]
    pub tool: Option<String>,
    /// Optional JSON string. Caller is responsible for the shape.
    #[serde(default)]
    pub tech_stack: Option<String>,
    /// If `true`, the new project is immediately set as the active
    /// project. Convenient for the wizard "Create + Start" flow.
    #[serde(default)]
    pub set_active: bool,
}

/// A read-only reference directory linked to a project.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectReference {
    /// `UUIDv4` identifier for this reference link.
    pub id: String,
    /// FK to [`Project::id`] — the project this reference is attached to.
    pub project_id: String,
    /// Absolute path to the referenced directory on disk.
    pub path: String,
    /// Optional display label; UI falls back to the path's basename
    /// when `None`.
    pub label: Option<String>,
    /// `"docs" | "source" | "examples" | "other"`. Free-form; the UI
    /// maps this to a color / icon and the indexer uses it to bias
    /// scan depth (e.g. `source` gets AST indexing, `docs` gets text).
    pub kind: String,
    /// Unix seconds at which the reference was linked.
    pub created_at: i64,
}

/// Input for [`add_project_reference`].
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AddReferenceInput {
    /// Target project id (FK to [`Project::id`]).
    pub project_id: String,
    /// Absolute path to the referenced directory. Trimmed; non-empty.
    pub path: String,
    /// Optional display label. UI falls back to the path basename.
    #[serde(default)]
    pub label: Option<String>,
    /// Defaults to `"other"`. Allowed values enforced at the command.
    #[serde(default)]
    pub kind: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════════════════

/// Create a new project row in user `LibSQL`.
///
/// Duplicate `root_path` values are rejected at the SQL level — the
/// `projects` table schema declares `root_path TEXT NOT NULL UNIQUE`,
/// so a second attempt returns an IPC-level error containing the
/// adapter's message. The frontend should catch this and re-render
/// with "a project at this path already exists".
#[tauri::command]
#[specta::specta]
pub async fn create_project(
    state: State<'_, PlatformState>,
    clyffy: State<'_, ClyffyConnectionState>,
    input: CreateProjectInput,
) -> Result<Project, String> {
    // Trim + validate — refuse obviously-broken input at the boundary
    // so we don't ship bad rows into the schema and show mystery UI
    // errors later.
    let name = input.name.trim();
    if name.is_empty() {
        return Err("project name must be non-empty".to_string());
    }
    let root_path = input.root_path.trim();
    if root_path.is_empty() {
        return Err("root_path must be non-empty".to_string());
    }
    let project_type = input
        .project_type
        .as_deref()
        .unwrap_or("personal")
        .trim()
        .to_string();
    if !matches!(
        project_type.as_str(),
        "general" | "personal" | "team" | "archived"
    ) {
        return Err(format!(
            "project_type must be one of general|personal|team|archived, got `{project_type}`"
        ));
    }

    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();

    let id = Uuid::new_v4().to_string();
    let description = input.description.as_deref().unwrap_or("");
    let tool = input.tool.as_deref().unwrap_or("");
    let tech_stack = input.tech_stack.as_deref().unwrap_or("");

    // Parameterized INSERT. SqlAdapter params are `&[&str]` — numeric /
    // null fields we handle by inserting the SQL literal directly where
    // the schema's DEFAULT is appropriate (active, created_at).
    adapter
        .execute(
            r"INSERT INTO projects (id, name, root_path, project_type, description, tool, tech_stack)
              VALUES (?, ?, ?, ?, ?, ?, ?)",
            &[&id, name, root_path, &project_type, description, tool, tech_stack],
        )
        .await
        .map_err(|e| format!("inserting project: {e:#}"))?;

    tracing::info!(project_id = %id, name = %name, root_path = %root_path, "project created");

    // Read the row back so the frontend has the real DEFAULTs (active,
    // created_at) instead of us guessing. `adapter` is `&Arc<LibSqlAdapter>`
    // so we deref once to get `&LibSqlAdapter` which coerces to
    // `&dyn SqlAdapter` at the call site.
    let project = read_one_project(adapter.as_ref(), &id)
        .await
        .map_err(|e| format!("reading back project {id}: {e:#}"))?
        .ok_or_else(|| format!("project {id} disappeared immediately after insert"))?;

    // Notify Clyffy's graph (best-effort, Tier-2, non-fatal). Skipped
    // when Clyffy is disconnected — Turso is authoritative and project
    // creation succeeds standalone.
    let clyffy_connected = matches!(clyffy.current(), ConnectionState::Connected { .. });
    mirror_project_to_graph(clyffy_connected, &project);

    // If the caller requested it, flip the active-project singleton
    // in the same command. Avoids a second round-trip at wizard time.
    if input.set_active {
        if let Err(e) = set_active_project_inner(&platform, clyffy_connected, &id).await {
            tracing::warn!(project_id = %id, error = %e, "set_active after create failed");
        }
    }

    Ok(project)
}

// ═══════════════════════════════════════════════════════════════════════
// Active project — singleton state in kv_store
// ═══════════════════════════════════════════════════════════════════════

/// Return the currently-active project, or `None` if nothing is set.
#[tauri::command]
#[specta::specta]
pub async fn get_active_project(
    state: State<'_, PlatformState>,
) -> Result<Option<Project>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();

    let id = match kv_get(adapter.as_ref(), KV_ACTIVE_PROJECT).await? {
        Some(id) if !id.is_empty() => id,
        _ => return Ok(None),
    };
    read_one_project(adapter.as_ref(), &id)
        .await
        .map_err(|e| format!("reading active project {id}: {e:#}"))
}

/// Set the active project by id. Validates that the project exists
/// before writing the singleton so we never end up pointing at a
/// deleted row.
#[tauri::command]
#[specta::specta]
pub async fn set_active_project(
    state: State<'_, PlatformState>,
    clyffy: State<'_, ClyffyConnectionState>,
    id: String,
) -> Result<Project, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let clyffy_connected = matches!(clyffy.current(), ConnectionState::Connected { .. });
    set_active_project_inner(&platform, clyffy_connected, &id).await
}

/// Clear the active-project singleton. `get_active_project` returns
/// `None` after this. Does NOT delete the project row itself.
#[tauri::command]
#[specta::specta]
pub async fn clear_active_project(
    state: State<'_, PlatformState>,
    clyffy: State<'_, ClyffyConnectionState>,
) -> Result<(), String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();
    adapter
        .execute("DELETE FROM kv_store WHERE key = ?", &[KV_ACTIVE_PROJECT])
        .await
        .map_err(|e| format!("clearing kv_store: {e:#}"))?;

    let clyffy_connected = matches!(clyffy.current(), ConnectionState::Connected { .. });
    mirror_active_project_cleared_to_graph(clyffy_connected);
    tracing::info!("active project cleared");
    Ok(())
}

// ═══════════════════════════════════════════════════════════════════════
// References — read-only directories linked to a project
// ═══════════════════════════════════════════════════════════════════════

/// Link a reference directory to a project. The same `(project_id,
/// path)` pair cannot be added twice — schema UNIQUE constraint
/// enforces this and the caller gets the SQL error surfaced.
#[tauri::command]
#[specta::specta]
pub async fn add_project_reference(
    state: State<'_, PlatformState>,
    clyffy: State<'_, ClyffyConnectionState>,
    input: AddReferenceInput,
) -> Result<ProjectReference, String> {
    let project_id = input.project_id.trim();
    let path = input.path.trim();
    if project_id.is_empty() || path.is_empty() {
        return Err("project_id and path must be non-empty".to_string());
    }
    let kind = input.kind.as_deref().unwrap_or("other").trim().to_string();
    if !matches!(kind.as_str(), "docs" | "source" | "examples" | "other") {
        return Err(format!(
            "kind must be one of docs|source|examples|other, got `{kind}`"
        ));
    }

    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();

    let id = Uuid::new_v4().to_string();
    let label = input.label.as_deref().unwrap_or("");

    adapter
        .execute(
            r"INSERT INTO project_references (id, project_id, path, label, kind)
              VALUES (?, ?, ?, ?, ?)",
            &[&id, project_id, path, label, &kind],
        )
        .await
        .map_err(|e| format!("inserting project_reference: {e:#}"))?;

    let reference = read_one_reference(adapter.as_ref(), &id)
        .await
        .map_err(|e| format!("reading back reference {id}: {e:#}"))?
        .ok_or_else(|| format!("reference {id} disappeared immediately after insert"))?;

    let clyffy_connected = matches!(clyffy.current(), ConnectionState::Connected { .. });
    mirror_reference_to_graph(clyffy_connected, &reference);

    tracing::info!(reference_id = %id, project_id = %project_id, path = %path, "reference added");
    Ok(reference)
}

/// List every reference directory linked to a project, oldest first
/// (insertion order). Empty list is normal.
#[tauri::command]
#[specta::specta]
pub async fn list_project_references(
    state: State<'_, PlatformState>,
    project_id: String,
) -> Result<Vec<ProjectReference>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();

    let rows = adapter
        .query(
            "SELECT id, project_id, path, label, kind, created_at
             FROM project_references
             WHERE project_id = ?
             ORDER BY created_at ASC",
            &[&project_id],
        )
        .await
        .map_err(|e| format!("listing references for {project_id}: {e:#}"))?;

    Ok(rows.into_iter().filter_map(row_to_reference).collect())
}

/// Remove a reference link. Hard delete — references are cheap to
/// recreate and the RAG index for this reference can be rebuilt on
/// re-add. Returns `true` if a row was actually removed.
#[tauri::command]
#[specta::specta]
pub async fn remove_project_reference(
    state: State<'_, PlatformState>,
    clyffy: State<'_, ClyffyConnectionState>,
    id: String,
) -> Result<bool, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;

    let rows_affected = svc
        .adapter()
        .execute("DELETE FROM project_references WHERE id = ?", &[&id])
        .await
        .map_err(|e| format!("deleting reference {id}: {e:#}"))?;

    let clyffy_connected = matches!(clyffy.current(), ConnectionState::Connected { .. });
    mirror_reference_removed_from_graph(clyffy_connected, &id);

    tracing::info!(reference_id = %id, rows_affected, "reference removed");
    Ok(rows_affected > 0)
}

// ═══════════════════════════════════════════════════════════════════════
// Shared inner implementations
// ═══════════════════════════════════════════════════════════════════════

async fn set_active_project_inner(
    platform: &Platform,
    clyffy_connected: bool,
    id: &str,
) -> Result<Project, String> {
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();

    // Validate — never write the singleton to point at a phantom id.
    let project = read_one_project(adapter.as_ref(), id)
        .await
        .map_err(|e| format!("validating project {id}: {e:#}"))?
        .ok_or_else(|| format!("project {id} not found"))?;

    let value_bytes = id.as_bytes().to_vec();
    // UPSERT into kv_store. SQLite dialect supports INSERT ... ON CONFLICT.
    adapter
        .execute(
            r"INSERT INTO kv_store (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()",
            &[KV_ACTIVE_PROJECT, id],
        )
        .await
        .map_err(|e| format!("writing kv_store active_project_id: {e:#}"))?;
    let _ = value_bytes; // reserved for future binary-value kv_store writes.

    mirror_active_project_to_graph(clyffy_connected, &project);
    tracing::info!(project_id = %id, name = %project.name, "active project set");
    Ok(project)
}

async fn kv_get(adapter: &dyn SqlAdapter, key: &str) -> Result<Option<String>, String> {
    use devpulse_engine::platform::SqlValue;
    let rows = adapter
        .query("SELECT value FROM kv_store WHERE key = ? LIMIT 1", &[key])
        .await
        .map_err(|e| format!("reading kv_store[{key}]: {e:#}"))?;
    let Some(row) = rows.into_iter().next() else {
        return Ok(None);
    };
    match row.into_iter().next() {
        Some(SqlValue::Text(s)) => Ok(Some(s)),
        Some(SqlValue::Blob(b)) => Ok(Some(String::from_utf8_lossy(&b).into_owned())),
        _ => Ok(None),
    }
}

async fn read_one_reference(
    adapter: &dyn SqlAdapter,
    id: &str,
) -> anyhow::Result<Option<ProjectReference>> {
    let rows = adapter
        .query(
            "SELECT id, project_id, path, label, kind, created_at
             FROM project_references WHERE id = ? LIMIT 1",
            &[id],
        )
        .await?;
    Ok(rows.into_iter().next().and_then(row_to_reference))
}

fn row_to_reference(row: Vec<devpulse_engine::platform::SqlValue>) -> Option<ProjectReference> {
    use devpulse_engine::platform::SqlValue;
    let mut iter = row.into_iter();
    Some(ProjectReference {
        id: text(iter.next()?)?,
        project_id: text(iter.next()?)?,
        path: text(iter.next()?)?,
        label: opt_text(iter.next()?),
        kind: text(iter.next()?)?,
        created_at: iter
            .next()
            .and_then(|v| match v {
                SqlValue::Integer(n) => Some(n),
                _ => None,
            })
            .unwrap_or(0),
    })
}

// ═══════════════════════════════════════════════════════════════════════
// Clyffy graph mirror — Tier-2, best-effort, non-fatal
// ═══════════════════════════════════════════════════════════════════════
//
// Turso is authoritative. The knowledge graph is **Clyffy's** — headless,
// on the GB10 — reached over the `devpulse-gb10-client` wire. When Clyffy
// is disconnected these mirrors are skipped (DevPulse runs standalone on
// Turso). When connected, DevPulse notifies Clyffy of the mutation so
// Clyffy mirrors it into its own `SurrealDB` graph (that graph's schema —
// the `project` / `project_reference` / `active_project` nodes + the
// `references` edge — lives in Clyffy's repo, not here).
//
// The notify call itself is deferred: it lands when the gb10-client gains
// the notify method and `clyffyd` exposes the `/v1/graph` ingest endpoint
// (deferred, not retired — tracked as Tier-2 wire work). These functions
// are the exact insertion points for that call; a mirror failure never
// rolls back the Turso write. They are synchronous today because the gate
// is a pure state check — they turn `async` again once the wire call lands.

fn mirror_project_to_graph(clyffy_connected: bool, project: &Project) {
    if !clyffy_connected {
        return;
    }
    tracing::debug!(
        project_id = %project.id,
        "clyffy connected — project graph mirror pending the wire graph-ingest endpoint"
    );
}

fn mirror_reference_to_graph(clyffy_connected: bool, reference: &ProjectReference) {
    if !clyffy_connected {
        return;
    }
    tracing::debug!(
        reference_id = %reference.id,
        project_id = %reference.project_id,
        "clyffy connected — reference graph mirror pending the wire graph-ingest endpoint"
    );
}

fn mirror_reference_removed_from_graph(clyffy_connected: bool, reference_id: &str) {
    if !clyffy_connected {
        return;
    }
    tracing::debug!(
        reference_id = %reference_id,
        "clyffy connected — reference-removal graph mirror pending the wire graph-ingest endpoint"
    );
}

fn mirror_active_project_to_graph(clyffy_connected: bool, project: &Project) {
    if !clyffy_connected {
        return;
    }
    tracing::debug!(
        project_id = %project.id,
        "clyffy connected — active-project graph mirror pending the wire graph-ingest endpoint"
    );
}

fn mirror_active_project_cleared_to_graph(clyffy_connected: bool) {
    if !clyffy_connected {
        return;
    }
    tracing::debug!(
        "clyffy connected — active-project-cleared graph mirror pending the wire graph-ingest endpoint"
    );
}

/// List every project ordered newest-first.
///
/// Use `include_archived = false` (default) to match the dashboard's
/// "active projects" shape. Archived rows have `active = 0` and are
/// typically hidden from the main UI surface.
#[tauri::command]
#[specta::specta]
pub async fn list_projects(
    state: State<'_, PlatformState>,
    include_archived: Option<bool>,
) -> Result<Vec<Project>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;
    let adapter = svc.adapter();

    let sql = if include_archived.unwrap_or(false) {
        "SELECT id, name, root_path, project_type, slug, description, tool, tech_stack, active, created_at
         FROM projects ORDER BY created_at DESC"
    } else {
        "SELECT id, name, root_path, project_type, slug, description, tool, tech_stack, active, created_at
         FROM projects WHERE active = 1 ORDER BY created_at DESC"
    };

    let rows = adapter
        .query(sql, &[])
        .await
        .map_err(|e| format!("listing projects: {e:#}"))?;

    Ok(rows.into_iter().filter_map(row_to_project).collect())
}

/// Fetch a single project by id. Returns `None` for missing ids so the
/// frontend can render a "project not found" state without the IPC
/// boundary treating it as an error.
#[tauri::command]
#[specta::specta]
pub async fn get_project(
    state: State<'_, PlatformState>,
    id: String,
) -> Result<Option<Project>, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;

    read_one_project(svc.adapter().as_ref(), &id)
        .await
        .map_err(|e| format!("reading project {id}: {e:#}"))
}

/// Soft-delete: flip `active` to 0. Project row stays on disk and the
/// per-project `.userdata/project.db` is untouched. Reversible via
/// `restore_project`.
#[tauri::command]
#[specta::specta]
pub async fn delete_project(state: State<'_, PlatformState>, id: String) -> Result<bool, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;

    let rows_affected = svc
        .adapter()
        .execute("UPDATE projects SET active = 0 WHERE id = ?", &[&id])
        .await
        .map_err(|e| format!("soft-deleting project {id}: {e:#}"))?;

    tracing::info!(project_id = %id, rows_affected, "project soft-deleted");
    Ok(rows_affected > 0)
}

/// Reverse of [`delete_project`] — flip `active` back to 1.
#[tauri::command]
#[specta::specta]
pub async fn restore_project(state: State<'_, PlatformState>, id: String) -> Result<bool, String> {
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| "platform not booted".to_string())?;
    let svc = platform
        .user_relational()
        .ok_or_else(|| "user relational service not available".to_string())?;

    let rows_affected = svc
        .adapter()
        .execute("UPDATE projects SET active = 1 WHERE id = ?", &[&id])
        .await
        .map_err(|e| format!("restoring project {id}: {e:#}"))?;

    Ok(rows_affected > 0)
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/// Shared read path for `get_project` and `create_project` (the latter
/// reads the row back post-insert to avoid trusting its own defaults).
async fn read_one_project(adapter: &dyn SqlAdapter, id: &str) -> anyhow::Result<Option<Project>> {
    let rows = adapter
        .query(
            "SELECT id, name, root_path, project_type, slug, description, tool, tech_stack, active, created_at
             FROM projects WHERE id = ? LIMIT 1",
            &[id],
        )
        .await?;
    Ok(rows.into_iter().next().and_then(row_to_project))
}

/// Project row → `Project` struct. Silently drops rows whose shape
/// doesn't match — such a row would only appear if the schema drifted,
/// which is a schema-migration bug not an ergonomic API concern.
fn row_to_project(row: Vec<devpulse_engine::platform::SqlValue>) -> Option<Project> {
    use devpulse_engine::platform::SqlValue;
    let mut iter = row.into_iter();
    Some(Project {
        id: text(iter.next()?)?,
        name: text(iter.next()?)?,
        root_path: text(iter.next()?)?,
        project_type: text(iter.next()?)?,
        slug: opt_text(iter.next()?),
        description: opt_text(iter.next()?),
        tool: opt_text(iter.next()?),
        tech_stack: opt_text(iter.next()?),
        active: iter
            .next()
            .and_then(|v| match v {
                SqlValue::Integer(n) => Some(n != 0),
                SqlValue::Null => Some(false),
                _ => None,
            })
            .unwrap_or(false),
        created_at: iter
            .next()
            .and_then(|v| match v {
                SqlValue::Integer(n) => Some(n),
                _ => None,
            })
            .unwrap_or(0),
    })
}

fn text(v: devpulse_engine::platform::SqlValue) -> Option<String> {
    match v {
        devpulse_engine::platform::SqlValue::Text(s) => Some(s),
        _ => None,
    }
}

fn opt_text(v: devpulse_engine::platform::SqlValue) -> Option<String> {
    match v {
        devpulse_engine::platform::SqlValue::Text(s) if !s.is_empty() => Some(s),
        _ => None,
    }
}
