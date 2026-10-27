//! Projects — the folders you work in, and the one you are working in now.
//!
//! The engine owns them. Every window (the hub, chat, `DevForge`) renders the
//! `projects` state this module publishes — the live projects and the active
//! one — and sends intents back. Nothing in the UI decides which project is
//! active.
//!
//! # Storage
//!
//! Turso (the user database) is the source of truth: `projects` rows,
//! `project_references` rows, and the active project's id in `kv_store`
//! (`active_project_id`). Each change is mirrored to the user `SurrealDB`
//! graph, best-effort: a graph failure is logged and never undoes the Turso
//! write.
//!
//! # Rules
//!
//! - The active project is always a live project. When it is missing or was
//!   removed — or nothing is active while projects exist — the most recently
//!   used live project becomes active (at start, and when you remove the one
//!   you are on). With no projects left, nothing is active.
//! - Registering a folder you removed earlier brings that project back
//!   instead of failing on the unique path.
//! - Making a project active stamps `last_active_at`, so "most recently used"
//!   means what it says.
//! - Intents are serialized, so two clicks never interleave.

use std::sync::Arc;

use anyhow::{bail, Context, Result};
use devpulse_clyffy::cortex::persistence::{SqlAdapter, SqlValue, TursoAdapter};
use serde::{Deserialize, Serialize};
use serde_json::json;
use specta::Type;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::services::graph::GraphService;
use crate::signals::{Signal, SignalSource, SignalVariant};

/// Active-project key in the user `kv_store` (a macro so SQL text can embed
/// the same literal).
macro_rules! kv_active_project {
    () => {
        "active_project_id"
    };
}
const KV_ACTIVE_PROJECT: &str = kv_active_project!();

/// Columns read into a [`Project`], in [`row_to_project`]'s order.
const PROJECT_COLUMNS: &str = "id, name, root_path, project_type, slug, description, tool, \
                               tech_stack, active, created_at, last_active_at";

/// The active project first — it is the most recently used by definition, and
/// `last_active_at` has one-second resolution, so two choices in one second
/// would tie — then by last use; never-used projects by creation, newest
/// first.
const RECENT_FIRST: &str = concat!(
    "ORDER BY (id = (SELECT value FROM kv_store WHERE key = '",
    kv_active_project!(),
    "')) DESC, COALESCE(last_active_at, created_at) DESC, created_at DESC"
);

const PROJECT_TYPES: [&str; 4] = ["general", "personal", "team", "archived"];
const REFERENCE_KINDS: [&str; 4] = ["docs", "source", "examples", "other"];

// `SurrealDB` graph names, one place for the reconciler to share.
const GRAPH_TABLE_PROJECT: &str = "project";
const GRAPH_TABLE_PROJECT_REFERENCE: &str = "project_reference";
const GRAPH_EDGE_REFERENCES: &str = "references";
const GRAPH_TABLE_ACTIVE_PROJECT: &str = "active_project";
const GRAPH_ACTIVE_PROJECT_ID: &str = "singleton";

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

/// A project as stored.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct Project {
    /// `UUIDv4` assigned when the project is first registered; stable for
    /// the life of the row, including a removal and a re-add.
    pub id: String,
    /// Display name.
    pub name: String,
    /// The project folder on disk. Unique: a folder is one project.
    pub root_path: String,
    /// One of `general | personal | team | archived`.
    pub project_type: String,
    /// Optional URL-safe slug.
    pub slug: Option<String>,
    /// One-line description.
    pub description: Option<String>,
    /// Source tool hint (`vscode`, `cursor`, …). Free-form.
    pub tool: Option<String>,
    /// JSON array, as a string.
    pub tech_stack: Option<String>,
    /// `false` once removed (the row stays; registering the folder again
    /// brings it back).
    pub active: bool,
    /// Unix seconds.
    pub created_at: i64,
    /// Unix seconds it was last made the active project; `None` if never.
    pub last_active_at: Option<i64>,
}

/// What [`Projects::create`] needs. Only `name` and `root_path` are
/// required.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateProjectInput {
    /// Display name. Trimmed; must be non-empty.
    pub name: String,
    /// The project folder. Trimmed; must be non-empty.
    pub root_path: String,
    /// Defaults to `"personal"`.
    #[serde(default)]
    pub project_type: Option<String>,
    /// One-line description; empty is stored as NULL.
    #[serde(default)]
    pub description: Option<String>,
    /// Source tool hint; empty is stored as NULL.
    #[serde(default)]
    pub tool: Option<String>,
    /// JSON array as a string; empty is stored as NULL.
    #[serde(default)]
    pub tech_stack: Option<String>,
    /// Make it the active project. A project is also made active when it is
    /// the first one.
    #[serde(default)]
    pub set_active: bool,
}

/// A read-only directory linked to a project for context.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
pub struct ProjectReference {
    /// `UUIDv4` of the link.
    pub id: String,
    /// The project it belongs to.
    pub project_id: String,
    /// The directory.
    pub path: String,
    /// Display label; the UI falls back to the folder name.
    pub label: Option<String>,
    /// `docs | source | examples | other`.
    pub kind: String,
    /// Unix seconds.
    pub created_at: i64,
}

/// What [`Projects::add_reference`] needs.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AddReferenceInput {
    /// The project to link it to.
    pub project_id: String,
    /// The directory. Trimmed; must be non-empty.
    pub path: String,
    /// Display label.
    #[serde(default)]
    pub label: Option<String>,
    /// Defaults to `"other"`.
    #[serde(default)]
    pub kind: Option<String>,
}

/// The outcome for one folder you asked to register.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RegisterResult {
    /// The folder.
    pub path: String,
    /// The project's id, when it was registered (or brought back).
    pub project_id: Option<String>,
    /// Why it was not.
    pub error: Option<String>,
}

/// The `projects` state every window renders.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProjectsState {
    /// Live projects, most recently used first.
    pub projects: Vec<Project>,
    /// The active project's id; when set, always one of `projects`.
    pub active_id: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════
// The service
// ═══════════════════════════════════════════════════════════════════════

/// Your projects and the active one.
pub struct Projects {
    db: Arc<TursoAdapter>,
    graph: Option<Arc<GraphService>>,
    signals: crate::Engine,
    serial: Mutex<()>,
}

impl Projects {
    /// Open the projects, make the stored active project valid, and publish
    /// the state.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read or written.
    pub async fn start(
        db: Arc<TursoAdapter>,
        graph: Option<Arc<GraphService>>,
        signals: crate::Engine,
    ) -> Result<Self> {
        let projects = Self {
            db,
            graph,
            signals,
            serial: Mutex::new(()),
        };
        {
            let _serial = projects.serial.lock().await;
            projects.settle_active().await?;
        }
        let state = projects.publish().await?;
        tracing::info!(
            target: "projects",
            count = state.projects.len(),
            active = ?state.active_id,
            "projects state published at boot"
        );
        Ok(projects)
    }

    fn sql(&self) -> &dyn SqlAdapter {
        self.db.as_ref()
    }

    /// The current state, from Turso.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn state(&self) -> Result<ProjectsState> {
        let projects = self.live().await?;
        let active_id = self
            .stored_active_id()
            .await?
            .filter(|id| projects.iter().any(|p| &p.id == id));
        Ok(ProjectsState {
            projects,
            active_id,
        })
    }

    /// Re-read and publish the state.
    ///
    /// # Errors
    /// Returns an error if the state cannot be computed.
    pub async fn publish(&self) -> Result<ProjectsState> {
        let state = self.state().await?;
        self.signals.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Projects(state.clone()),
        ));
        Ok(state)
    }

    /// Every project, most recently used first; removed ones only when asked.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn list(&self, include_removed: bool) -> Result<Vec<Project>> {
        if include_removed {
            self.read_projects(
                &format!("SELECT {PROJECT_COLUMNS} FROM projects {RECENT_FIRST}"),
                &[],
            )
            .await
        } else {
            self.live().await
        }
    }

    /// One project by id, removed or not.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn get(&self, id: &str) -> Result<Option<Project>> {
        Ok(self
            .read_projects(
                &format!("SELECT {PROJECT_COLUMNS} FROM projects WHERE id = ? LIMIT 1"),
                &[id.into()],
            )
            .await?
            .into_iter()
            .next())
    }

    /// The existing folder of a live project, suitable for running tools.
    ///
    /// # Errors
    /// Refuses missing/removed projects, relative or unavailable folders,
    /// and database failures. Never substitutes or creates a workspace.
    pub(super) async fn workspace(&self, id: &str) -> Result<std::path::PathBuf> {
        let project = self
            .get(id)
            .await
            .context("read the agent's project")?
            .filter(|project| project.active)
            .with_context(|| format!("project {id} is unavailable; restore or select a project"))?;
        let path = std::path::PathBuf::from(&project.root_path);
        if !path.is_absolute() {
            bail!(
                "project {} needs an absolute workspace folder",
                project.name
            );
        }
        let metadata = std::fs::metadata(&path)
            .with_context(|| format!("project folder {} is unavailable", path.display()))?;
        if !metadata.is_dir() {
            bail!("project folder {} is not a directory", path.display());
        }
        Ok(path)
    }

    /// The active project, if any.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn active(&self) -> Result<Option<Project>> {
        let state = self.state().await?;
        Ok(state
            .active_id
            .and_then(|id| state.projects.into_iter().find(|p| p.id == id)))
    }

    /// The folders of every live project (what first run marks
    /// "registered").
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn registered_roots(&self) -> Result<Vec<String>> {
        Ok(self
            .live()
            .await?
            .into_iter()
            .map(|p| p.root_path)
            .collect())
    }

    /// Register a folder as a project, in place (nothing is written inside
    /// it). A folder removed earlier comes back with these details.
    ///
    /// # Errors
    /// Returns an error if the input is invalid, the folder is already a
    /// live project, or the user database cannot be written.
    pub async fn create(&self, input: CreateProjectInput) -> Result<Project> {
        let _serial = self.serial.lock().await;
        let project = self.create_locked(input).await?;
        self.publish().await?;
        Ok(project)
    }

    /// Register the folders you ticked, in place. Each folder gets its own
    /// outcome; one failure does not stop the rest. The first project
    /// becomes active when none is.
    pub async fn register(&self, paths: Vec<String>) -> Vec<RegisterResult> {
        let _serial = self.serial.lock().await;
        let mut results = Vec::with_capacity(paths.len());
        for path in paths {
            let name = std::path::Path::new(path.trim()).file_name().map_or_else(
                || path.trim().to_owned(),
                |n| n.to_string_lossy().into_owned(),
            );
            let input = CreateProjectInput {
                name,
                root_path: path.clone(),
                project_type: None,
                description: None,
                tool: None,
                tech_stack: None,
                set_active: false,
            };
            match self.create_locked(input).await {
                Ok(project) => {
                    tracing::info!(target: "projects", %path, project_id = %project.id, "registered in place");
                    results.push(RegisterResult {
                        path,
                        project_id: Some(project.id),
                        error: None,
                    });
                }
                Err(e) => {
                    let error = format!("{e:#}");
                    tracing::warn!(target: "projects", %path, %error, "not registered");
                    results.push(RegisterResult {
                        path,
                        project_id: None,
                        error: Some(error),
                    });
                }
            }
        }
        if let Err(e) = self.publish().await {
            tracing::warn!(target: "projects", error = %format!("{e:#}"), "publishing after register failed");
        }
        results
    }

    /// Make a live project the active one.
    ///
    /// # Errors
    /// Returns an error if the project does not exist, was removed, or the
    /// user database cannot be written.
    pub async fn set_active(&self, id: &str) -> Result<Project> {
        let _serial = self.serial.lock().await;
        let project = self
            .get(id)
            .await?
            .with_context(|| format!("project {id} not found"))?;
        if !project.active {
            bail!(
                "project {} was removed; register its folder again to bring it back",
                project.name
            );
        }
        self.write_active(&project).await?;
        self.publish().await?;
        self.get(id)
            .await?
            .with_context(|| format!("project {id} vanished after it was made active"))
    }

    /// Leave no project active (until the next start, which picks the most
    /// recently used again).
    ///
    /// # Errors
    /// Returns an error if the user database cannot be written.
    pub async fn clear_active(&self) -> Result<()> {
        let _serial = self.serial.lock().await;
        self.clear_active_key().await?;
        self.publish().await?;
        tracing::info!(target: "projects", "active project cleared");
        Ok(())
    }

    /// Remove a project (the row stays, so its folder can be registered
    /// again). When it was the active one, the most recently used remaining
    /// project becomes active. Returns `false` when it was not live.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be written.
    pub async fn remove(&self, id: &str) -> Result<bool> {
        let _serial = self.serial.lock().await;
        let affected = self
            .sql()
            .execute(
                "UPDATE projects SET active = 0, updated_at = unixepoch() WHERE id = ? AND active = 1",
                &[id.into()],
            )
            .await
            .with_context(|| format!("remove project {id}"))?;
        if affected == 0 {
            return Ok(false);
        }
        self.settle_active().await?;
        self.publish().await?;
        tracing::info!(target: "projects", project_id = %id, "project removed");
        Ok(true)
    }

    /// Bring a removed project back. It becomes active when none is.
    /// Returns `false` when it was already live or does not exist.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be written.
    pub async fn restore(&self, id: &str) -> Result<bool> {
        let _serial = self.serial.lock().await;
        let affected = self
            .sql()
            .execute(
                "UPDATE projects SET active = 1, updated_at = unixepoch() WHERE id = ? AND active = 0",
                &[id.into()],
            )
            .await
            .with_context(|| format!("restore project {id}"))?;
        if affected == 0 {
            return Ok(false);
        }
        self.settle_active().await?;
        self.publish().await?;
        Ok(true)
    }

    /// Link a read-only directory to a project. The same directory cannot be
    /// linked to the same project twice.
    ///
    /// # Errors
    /// Returns an error if the input is invalid, the project is not live, or
    /// the user database cannot be written.
    pub async fn add_reference(&self, input: AddReferenceInput) -> Result<ProjectReference> {
        let project_id = input.project_id.trim();
        let path = input.path.trim();
        if project_id.is_empty() || path.is_empty() {
            bail!("project_id and path must be non-empty");
        }
        let kind = input.kind.as_deref().unwrap_or("other").trim().to_owned();
        if !REFERENCE_KINDS.contains(&kind.as_str()) {
            bail!(
                "kind must be one of {}, got `{kind}`",
                REFERENCE_KINDS.join("|")
            );
        }
        if !self.get(project_id).await?.is_some_and(|p| p.active) {
            bail!("project {project_id} is not a live project");
        }
        let id = Uuid::new_v4().to_string();
        self.sql()
            .execute(
                "INSERT INTO project_references (id, project_id, path, label, kind) VALUES (?, ?, ?, ?, ?)",
                &[
                    id.as_str().into(),
                    project_id.into(),
                    path.into(),
                    input.label.as_deref().unwrap_or("").into(),
                    kind.as_str().into(),
                ],
            )
            .await
            .context("insert project reference")?;
        let reference = self
            .read_references(
                "SELECT id, project_id, path, label, kind, created_at FROM project_references WHERE id = ? LIMIT 1",
                &[id.as_str().into()],
            )
            .await?
            .into_iter()
            .next()
            .with_context(|| format!("reference {id} vanished right after it was added"))?;
        self.mirror_reference(&reference).await;
        tracing::info!(target: "projects", reference_id = %id, %project_id, %path, "reference added");
        Ok(reference)
    }

    /// A project's reference directories, oldest first.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be read.
    pub async fn references(&self, project_id: &str) -> Result<Vec<ProjectReference>> {
        self.read_references(
            "SELECT id, project_id, path, label, kind, created_at FROM project_references \
             WHERE project_id = ? ORDER BY created_at ASC",
            &[project_id.into()],
        )
        .await
    }

    /// Unlink a reference directory. Returns `false` when there was none.
    ///
    /// # Errors
    /// Returns an error if the user database cannot be written.
    pub async fn remove_reference(&self, id: &str) -> Result<bool> {
        let affected = self
            .sql()
            .execute("DELETE FROM project_references WHERE id = ?", &[id.into()])
            .await
            .with_context(|| format!("delete reference {id}"))?;
        self.graph_execute(
            &format!("DELETE {};", record(GRAPH_TABLE_PROJECT_REFERENCE, id)),
            "reference delete",
        )
        .await;
        Ok(affected > 0)
    }

    // ── Inner steps (callers hold `serial`) ─────────────────────────────

    async fn create_locked(&self, input: CreateProjectInput) -> Result<Project> {
        let name = input.name.trim();
        if name.is_empty() {
            bail!("project name must be non-empty");
        }
        let root_path = input.root_path.trim();
        if root_path.is_empty() {
            bail!("root_path must be non-empty");
        }
        let project_type = input.project_type.as_deref().unwrap_or("personal").trim();
        if !PROJECT_TYPES.contains(&project_type) {
            bail!(
                "project_type must be one of {}, got `{project_type}`",
                PROJECT_TYPES.join("|")
            );
        }
        let optional = |v: &Option<String>| {
            v.as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(str::to_owned)
        };
        let details: [SqlValue; 5] = [
            name.into(),
            project_type.into(),
            optional(&input.description).into(),
            optional(&input.tool).into(),
            optional(&input.tech_stack).into(),
        ];

        let existing = self
            .read_projects(
                &format!("SELECT {PROJECT_COLUMNS} FROM projects WHERE root_path = ? LIMIT 1"),
                &[root_path.into()],
            )
            .await?
            .into_iter()
            .next();
        let id = match existing {
            Some(project) if project.active => {
                bail!("{root_path} is already the project \"{}\"", project.name)
            }
            Some(project) => {
                let [name, project_type, description, tool, tech_stack] = details;
                self.sql()
                    .execute(
                        "UPDATE projects SET name = ?, project_type = ?, description = ?, tool = ?, \
                         tech_stack = ?, active = 1, updated_at = unixepoch() WHERE id = ?",
                        &[name, project_type, description, tool, tech_stack, project.id.as_str().into()],
                    )
                    .await
                    .with_context(|| format!("bring back project {}", project.id))?;
                tracing::info!(target: "projects", project_id = %project.id, %root_path, "removed project brought back");
                project.id
            }
            None => {
                let id = Uuid::new_v4().to_string();
                let [name, project_type, description, tool, tech_stack] = details;
                self.sql()
                    .execute(
                        "INSERT INTO projects (id, name, root_path, project_type, description, tool, tech_stack) \
                         VALUES (?, ?, ?, ?, ?, ?, ?)",
                        &[id.as_str().into(), name, root_path.into(), project_type, description, tool, tech_stack],
                    )
                    .await
                    .context("insert project")?;
                tracing::info!(target: "projects", project_id = %id, %root_path, "project created");
                id
            }
        };

        let project = self
            .get(&id)
            .await?
            .with_context(|| format!("project {id} vanished right after it was written"))?;
        self.mirror_project(&project).await;

        if input.set_active || self.valid_active_id().await?.is_none() {
            self.write_active(&project).await.with_context(|| {
                format!(
                    "project {} was added, but making it active failed",
                    project.name
                )
            })?;
        }
        Ok(project)
    }

    /// Make the stored active project valid (see the module rules).
    async fn settle_active(&self) -> Result<()> {
        if self.valid_active_id().await?.is_some() {
            return Ok(());
        }
        if let Some(recent) = self.live().await?.into_iter().next() {
            return self.write_active(&recent).await;
        }
        if self.stored_active_id().await?.is_some() {
            self.clear_active_key().await?;
        }
        Ok(())
    }

    async fn write_active(&self, project: &Project) -> Result<()> {
        self.sql()
            .execute(
                "INSERT INTO kv_store (key, value) VALUES (?, ?) \
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = unixepoch()",
                &[KV_ACTIVE_PROJECT.into(), project.id.as_str().into()],
            )
            .await
            .context("store the active project")?;
        self.sql()
            .execute(
                "UPDATE projects SET last_active_at = unixepoch() WHERE id = ?",
                &[project.id.as_str().into()],
            )
            .await
            .context("stamp last_active_at")?;
        self.mirror_active(project).await;
        tracing::info!(target: "projects", project_id = %project.id, name = %project.name, "active project set");
        Ok(())
    }

    async fn clear_active_key(&self) -> Result<()> {
        self.sql()
            .execute(
                "DELETE FROM kv_store WHERE key = ?",
                &[KV_ACTIVE_PROJECT.into()],
            )
            .await
            .context("clear the active project")?;
        self.graph_execute(
            &format!(
                "DELETE {};",
                record(GRAPH_TABLE_ACTIVE_PROJECT, GRAPH_ACTIVE_PROJECT_ID)
            ),
            "active project clear",
        )
        .await;
        Ok(())
    }

    async fn stored_active_id(&self) -> Result<Option<String>> {
        let rows = self
            .sql()
            .query(
                "SELECT value FROM kv_store WHERE key = ? LIMIT 1",
                &[KV_ACTIVE_PROJECT.into()],
            )
            .await
            .context("read the active project")?;
        Ok(rows
            .into_iter()
            .next()
            .and_then(|row| match row.into_iter().next() {
                Some(SqlValue::Text(s)) => Some(s),
                Some(SqlValue::Blob(b)) => Some(String::from_utf8_lossy(&b).into_owned()),
                _ => None,
            })
            .filter(|id| !id.is_empty()))
    }

    /// The stored active id, only when it names a live project.
    async fn valid_active_id(&self) -> Result<Option<String>> {
        let Some(id) = self.stored_active_id().await? else {
            return Ok(None);
        };
        Ok(self.get(&id).await?.filter(|p| p.active).map(|p| p.id))
    }

    async fn live(&self) -> Result<Vec<Project>> {
        self.read_projects(
            &format!("SELECT {PROJECT_COLUMNS} FROM projects WHERE active = 1 {RECENT_FIRST}"),
            &[],
        )
        .await
    }

    async fn read_projects(&self, sql: &str, params: &[SqlValue]) -> Result<Vec<Project>> {
        Ok(self
            .sql()
            .query(sql, params)
            .await
            .context("read projects")?
            .iter()
            .filter_map(|row| row_to_project(row))
            .collect())
    }

    async fn read_references(
        &self,
        sql: &str,
        params: &[SqlValue],
    ) -> Result<Vec<ProjectReference>> {
        Ok(self
            .sql()
            .query(sql, params)
            .await
            .context("read project references")?
            .iter()
            .filter_map(|row| row_to_reference(row))
            .collect())
    }

    // ── Graph mirror (best-effort) ──────────────────────────────────────

    async fn graph_execute(&self, surql: &str, what: &str) {
        let Some(graph) = &self.graph else { return };
        if let Err(e) = graph.handle().execute(surql).await {
            tracing::warn!(target: "projects", error = %format!("{e:#}"), "graph {what} failed");
        }
    }

    /// Insert or replace the project's node (a project brought back already
    /// has one).
    async fn mirror_project(&self, project: &Project) {
        let props = json!({
            "id": project.id,
            "name": project.name,
            "root_path": project.root_path,
            "project_type": project.project_type,
            "description": project.description,
            "active": project.active,
            "created_at": project.created_at,
        });
        self.graph_execute(
            &format!(
                "UPSERT {} CONTENT {props};",
                record(GRAPH_TABLE_PROJECT, &project.id)
            ),
            "project mirror",
        )
        .await;
    }

    async fn mirror_reference(&self, reference: &ProjectReference) {
        let Some(graph) = &self.graph else { return };
        let props = json!({
            "id": reference.id,
            "project_id": reference.project_id,
            "path": reference.path,
            "label": reference.label,
            "kind": reference.kind,
            "created_at": reference.created_at,
        });
        if let Err(e) = graph
            .handle()
            .create_node(GRAPH_TABLE_PROJECT_REFERENCE, &reference.id, &props)
            .await
        {
            tracing::warn!(target: "projects", reference_id = %reference.id, error = %format!("{e:#}"), "graph reference mirror failed");
            return;
        }
        let from = record(GRAPH_TABLE_PROJECT, &reference.project_id);
        let to = record(GRAPH_TABLE_PROJECT_REFERENCE, &reference.id);
        if let Err(e) = graph
            .handle()
            .create_edge(GRAPH_EDGE_REFERENCES, &from, &to, &json!({}))
            .await
        {
            tracing::warn!(target: "projects", reference_id = %reference.id, error = %format!("{e:#}"), "graph references edge failed");
        }
    }

    async fn mirror_active(&self, project: &Project) {
        let props = json!({
            "project_id": project.id,
            "project_name": project.name,
            "root_path": project.root_path,
        });
        self.graph_execute(
            &format!(
                "UPSERT {} CONTENT {props};",
                record(GRAPH_TABLE_ACTIVE_PROJECT, GRAPH_ACTIVE_PROJECT_ID)
            ),
            "active project mirror",
        )
        .await;
    }
}

/// A `SurrealQL` record id with its id escaped, so a UUID (whose hyphens
/// would otherwise read as subtraction) is one record.
fn record(table: &str, id: &str) -> String {
    format!("{table}:`{}`", id.replace('`', "\\`"))
}

// ═══════════════════════════════════════════════════════════════════════
// Rows
// ═══════════════════════════════════════════════════════════════════════

fn text(v: Option<&SqlValue>) -> Option<String> {
    v.and_then(SqlValue::as_text).map(str::to_owned)
}

fn opt_text(v: Option<&SqlValue>) -> Option<String> {
    text(v).filter(|s| !s.is_empty())
}

/// A row in [`PROJECT_COLUMNS`] order. A row of another shape is a schema
/// bug; it is skipped and logged.
fn row_to_project(row: &[SqlValue]) -> Option<Project> {
    let project = Some(Project {
        id: text(row.first())?,
        name: text(row.get(1))?,
        root_path: text(row.get(2))?,
        project_type: text(row.get(3))?,
        slug: opt_text(row.get(4)),
        description: opt_text(row.get(5)),
        tool: opt_text(row.get(6)),
        tech_stack: opt_text(row.get(7)),
        active: row
            .get(8)
            .and_then(SqlValue::as_integer)
            .is_some_and(|v| v != 0),
        created_at: row.get(9).and_then(SqlValue::as_integer).unwrap_or(0),
        last_active_at: row.get(10).and_then(SqlValue::as_integer),
    });
    if project.is_none() {
        tracing::warn!(target: "projects", columns = row.len(), "project row of an unexpected shape skipped");
    }
    project
}

fn row_to_reference(row: &[SqlValue]) -> Option<ProjectReference> {
    Some(ProjectReference {
        id: text(row.first())?,
        project_id: text(row.get(1))?,
        path: text(row.get(2))?,
        label: opt_text(row.get(3)),
        kind: text(row.get(4))?,
        created_at: row.get(5).and_then(SqlValue::as_integer).unwrap_or(0),
    })
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use crate::platform::profile::tests::user_db;

    async fn service(tag: &str) -> (Projects, crate::Engine, std::path::PathBuf) {
        let (db, dir) = user_db(tag).await;
        let engine = crate::Engine::boot();
        let projects = Projects::start(Arc::new(db), None, engine.clone())
            .await
            .expect("start");
        (projects, engine, dir)
    }

    fn published(engine: &crate::Engine) -> ProjectsState {
        let latest = engine.state().latest(crate::signals::SignalKind::Projects);
        match latest.as_ref().map(|s| s.payload.as_ref()) {
            Some(SignalVariant::Projects(state)) => state.clone(),
            other => panic!("no projects state published: {other:?}"),
        }
    }

    fn ok_id(result: &RegisterResult) -> String {
        assert_eq!(result.error, None, "{} not registered", result.path);
        result.project_id.clone().expect("project id")
    }

    async fn done(projects: Projects, dir: std::path::PathBuf) {
        projects.db.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }

    #[test]
    fn uuid_record_ids_are_escaped() {
        assert_eq!(
            record("project", "2cfbf00d-7d5d-41a9-a2f2-259a3174d935"),
            "project:`2cfbf00d-7d5d-41a9-a2f2-259a3174d935`"
        );
        assert_eq!(
            record("active_project", "singleton"),
            "active_project:`singleton`"
        );
    }

    #[tokio::test]
    async fn workspace_requires_a_live_project_and_preserves_its_folder() {
        let (p, _, dir) = service("workspace-live").await;
        let folder = tempfile::tempdir().unwrap();
        let results = p.register(vec![folder.path().display().to_string()]).await;
        let id = ok_id(&results[0]);
        assert_eq!(p.workspace(&id).await.unwrap(), folder.path());
        assert!(p.workspace("missing-project").await.is_err());
        p.remove(&id).await.unwrap();
        assert!(p.workspace(&id).await.is_err());
        assert!(folder.path().is_dir(), "removal must not affect the folder");
        p.restore(&id).await.unwrap();
        assert_eq!(p.workspace(&id).await.unwrap(), folder.path());
        done(p, dir).await;
    }

    #[tokio::test]
    async fn workspace_refuses_unavailable_and_relative_paths() {
        let (p, _, dir) = service("workspace-paths").await;
        let tree = tempfile::tempdir().unwrap();
        let missing = tree.path().join("deleted-workspace");
        let file = tree.path().join("file");
        std::fs::write(&file, "not a directory").unwrap();
        let results = p
            .register(vec![
                missing.display().to_string(),
                file.display().to_string(),
                "relative-workspace".into(),
            ])
            .await;
        for result in &results {
            assert!(p.workspace(&ok_id(result)).await.is_err());
        }
        assert!(!missing.exists(), "resolving must not recreate a folder");
        done(p, dir).await;
    }

    #[tokio::test]
    async fn workspace_propagates_database_failure() {
        let (p, _, dir) = service("workspace-db-error").await;
        p.db.execute("DROP TABLE projects", &[]).await.unwrap();
        let error = p.workspace("any-project").await.unwrap_err();
        assert!(format!("{error:#}").contains("read the agent's project"));
        done(p, dir).await;
    }

    #[tokio::test]
    async fn first_registered_becomes_active_and_is_published() {
        let (p, engine, dir) = service("first").await;
        assert_eq!(published(&engine).active_id, None, "nothing yet");

        let results = p
            .register(vec!["/work/devpulse".into(), "/work/other".into()])
            .await;
        let first = ok_id(&results[0]);
        ok_id(&results[1]);

        let state = published(&engine);
        assert_eq!(state.projects.len(), 2);
        assert_eq!(state.active_id.as_deref(), Some(first.as_str()));
        assert_eq!(
            p.active().await.expect("active").map(|a| a.name),
            Some("devpulse".to_owned())
        );
        done(p, dir).await;
    }

    #[tokio::test]
    async fn a_removed_folder_comes_back_with_its_id() {
        let (p, engine, dir) = service("readd").await;
        let results = p.register(vec!["/work/a".into(), "/work/b".into()]).await;
        let a = ok_id(&results[0]);
        let b = ok_id(&results[1]);

        assert!(p.remove(&a).await.expect("remove"), "a was live");
        let state = published(&engine);
        assert_eq!(
            state.active_id.as_deref(),
            Some(b.as_str()),
            "the remaining project takes over"
        );
        assert_eq!(p.registered_roots().await.expect("roots"), ["/work/b"]);
        assert!(
            p.set_active(&a).await.is_err(),
            "a removed project cannot be active"
        );

        let again = p.register(vec!["/work/a".into()]).await;
        assert_eq!(ok_id(&again[0]), a, "same project, not a duplicate");
        assert_eq!(published(&engine).projects.len(), 2);

        let dup = p.register(vec!["/work/a".into()]).await;
        assert!(
            dup[0].error.is_some(),
            "a live folder is not registered twice"
        );
        done(p, dir).await;
    }

    #[tokio::test]
    async fn set_active_stamps_last_active_and_orders_recent_first() {
        let (p, engine, dir) = service("recent").await;
        let results = p.register(vec!["/work/a".into(), "/work/b".into()]).await;
        let b = ok_id(&results[1]);

        let made = p.set_active(&b).await.expect("set active");
        assert!(made.last_active_at.is_some(), "stamped");
        let state = published(&engine);
        assert_eq!(state.active_id.as_deref(), Some(b.as_str()));
        assert_eq!(state.projects[0].id, b, "most recently used first");
        done(p, dir).await;
    }

    #[tokio::test]
    async fn start_repairs_a_dangling_active_project() {
        let (db, dir) = user_db("dangling").await;
        let db = Arc::new(db);
        let engine = crate::Engine::boot();
        {
            let p = Projects::start(Arc::clone(&db), None, engine.clone())
                .await
                .expect("start");
            let results = p.register(vec!["/work/kept".into()]).await;
            ok_id(&results[0]);
        }
        db.execute(
            "UPDATE kv_store SET value = 'gone' WHERE key = ?",
            &[KV_ACTIVE_PROJECT.into()],
        )
        .await
        .expect("corrupt the key");

        let p = Projects::start(Arc::clone(&db), None, engine.clone())
            .await
            .expect("restart");
        let state = published(&engine);
        assert_eq!(
            state.active_id,
            state.projects.first().map(|x| x.id.clone()),
            "the most recent live project is active again"
        );
        assert!(state.active_id.is_some());
        drop(p);
        db.close().await;
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn removing_the_last_project_leaves_none_active() {
        let (p, engine, dir) = service("last").await;
        let results = p.register(vec!["/work/only".into()]).await;
        let only = ok_id(&results[0]);
        assert!(p.remove(&only).await.expect("remove"));
        let state = published(&engine);
        assert!(state.projects.is_empty());
        assert_eq!(state.active_id, None);
        assert!(p.restore(&only).await.expect("restore"));
        assert_eq!(
            published(&engine).active_id.as_deref(),
            Some(only.as_str()),
            "restored and active"
        );
        done(p, dir).await;
    }
}
