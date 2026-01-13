// orchestrator/src/infra/persistence/sql.rs

//! libSQL database - L3 DURABLE layer
//!
//! Schema:
//! - **projects**: Global registry of projects with UUID→path mapping
//! - **decisions**: Locked choices promoted from fjall parking_lot
//! - **messages**: Clean rendered conversation history (UI-facing)
//! - **chunks**: RAG chunks with embedding metadata
//! - **sessions**: Per-project conversation sessions
//!
//! Note: Raw signal replay (tool calls, LeanSignals) lives in fjall, not here.
//! This is the "clean" queryable layer for UI and cross-project RAG.

use shared::types::ids::{ProjectId, SessionId};
use shared::types::capture::{CaptureRRO, CaptureRecord};
use std::path::Path;
use uuid::Uuid;

/// Database handle for libSQL
pub struct Database {
    conn: libsql::Connection,
}

impl Database {
    /// Open or create database at path
    pub async fn open(path: &Path) -> anyhow::Result<Self> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let db = libsql::Builder::new_local(path).build().await?;
        let conn = db.connect()?;

        let database = Self { conn };
        database.init_schema().await?;

        Ok(database)
    }

    /// Initialize schema
    async fn init_schema(&self) -> anyhow::Result<()> {
        self.conn.execute_batch(SCHEMA).await?;
        Ok(())
    }

    // ============== Projects ==============

    /// Register a new project
    pub async fn create_project(
        &self,
        id: &Uuid,
        name: &str,
        root_path: &str,
        project_type: &str,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO projects (id, name, root_path, project_type, collection_name, created_at, last_accessed)
                   VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))"#,
                libsql::params![
                    id.to_string(),
                    name,
                    root_path,
                    project_type,
                    format!("project_{}", id)
                ],
            )
            .await?;
        Ok(())
    }

    /// Update last_accessed timestamp for a project
    pub async fn touch_project(&self, id: &Uuid) -> anyhow::Result<()> {
        self.conn
            .execute(
                "UPDATE projects SET last_accessed = datetime('now') WHERE id = ?",
                libsql::params![id.to_string()],
            )
            .await?;
        Ok(())
    }

    /// Get project by ID
    pub async fn get_project(&self, id: &Uuid) -> anyhow::Result<Option<Project>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, root_path, project_type, collection_name, created_at, last_accessed FROM projects WHERE id = ?",
                libsql::params![id.to_string()],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(Project {
                id: row.get::<String>(0)?.parse()?,
                name: row.get(1)?,
                root_path: row.get(2)?,
                project_type: row.get(3)?,
                collection_name: row.get(4)?,
                created_at: row.get(5)?,
                last_accessed: row.get(6)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// Find project by root path
    pub async fn find_project_by_path(&self, root_path: &str) -> anyhow::Result<Option<Uuid>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id FROM projects WHERE root_path = ?",
                libsql::params![root_path],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            let id_str: String = row.get(0)?;
            Ok(Some(id_str.parse()?))
        } else {
            Ok(None)
        }
    }

    /// List all projects
    pub async fn list_projects(&self) -> anyhow::Result<Vec<Project>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, root_path, project_type, collection_name, created_at, last_accessed FROM projects ORDER BY last_accessed DESC",
                (),
            )
            .await?;

        let mut projects = Vec::new();
        while let Some(row) = rows.next().await? {
            projects.push(Project {
                id: row.get::<String>(0)?.parse()?,
                name: row.get(1)?,
                root_path: row.get(2)?,
                project_type: row.get(3)?,
                collection_name: row.get(4)?,
                created_at: row.get(5)?,
                last_accessed: row.get(6)?,
            });
        }
        Ok(projects)
    }

    /// Delete a project
    pub async fn delete_project(&self, id: &Uuid) -> anyhow::Result<()> {
        self.conn
            .execute(
                "DELETE FROM projects WHERE id = ?",
                libsql::params![id.to_string()],
            )
            .await?;
        Ok(())
    }

    // ============== Sessions ==============

    /// Create a new session
    pub async fn create_session(
        &self,
        session_id: &SessionId,
        project_id: Option<&ProjectId>,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                "INSERT INTO sessions (id, project_id, created_at) VALUES (?, ?, datetime('now'))",
                libsql::params![
                    session_id.as_str(),
                    project_id.map(|p| p.as_str())
                ],
            )
            .await?;
        Ok(())
    }

    /// End a session
    pub async fn end_session(&self, session_id: &SessionId) -> anyhow::Result<()> {
        self.conn
            .execute(
                "UPDATE sessions SET ended_at = datetime('now') WHERE id = ?",
                libsql::params![session_id.as_str()],
            )
            .await?;
        Ok(())
    }

    /// List all sessions, optionally filtered by project
    pub async fn list_sessions(&self, project_id: Option<&str>) -> anyhow::Result<Vec<Session>> {
        let query = match project_id {
            Some(_) => {
                r#"SELECT s.id, s.project_id, s.created_at, s.ended_at,
                          (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count,
                          (SELECT MAX(created_at) FROM messages m WHERE m.session_id = s.id) as last_message_at
                   FROM sessions s
                   WHERE s.project_id = ?
                   ORDER BY s.created_at DESC"#
            }
            None => {
                r#"SELECT s.id, s.project_id, s.created_at, s.ended_at,
                          (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count,
                          (SELECT MAX(created_at) FROM messages m WHERE m.session_id = s.id) as last_message_at
                   FROM sessions s
                   ORDER BY s.created_at DESC"#
            }
        };

        let mut rows = match project_id {
            Some(pid) => self.conn.query(query, libsql::params![pid]).await?,
            None => self.conn.query(query, ()).await?,
        };

        let mut sessions = Vec::new();
        while let Some(row) = rows.next().await? {
            sessions.push(Session {
                id: row.get(0)?,
                project_id: row.get(1)?,
                created_at: row.get(2)?,
                ended_at: row.get(3)?,
                message_count: row.get::<u32>(4).unwrap_or(0),
                last_message_at: row.get(5)?,
            });
        }
        Ok(sessions)
    }

    /// Delete a session and its messages
    pub async fn delete_session(&self, session_id: &str) -> anyhow::Result<()> {
        // Delete messages first (foreign key)
        self.conn
            .execute(
                "DELETE FROM messages WHERE session_id = ?",
                libsql::params![session_id],
            )
            .await?;

        // Delete session
        self.conn
            .execute(
                "DELETE FROM sessions WHERE id = ?",
                libsql::params![session_id],
            )
            .await?;

        Ok(())
    }

    /// Touch session (update for activity tracking - though sessions don't have last_accessed yet)
    pub async fn touch_session(&self, session_id: &str) -> anyhow::Result<()> {
        // Sessions table doesn't have last_accessed, but we could add it.
        // For now this is a no-op placeholder for future use.
        let _ = session_id;
        Ok(())
    }

    // ============== Messages (Clean UI Layer) ==============

    /// Record a rendered message (user or assistant)
    pub async fn record_message(
        &self,
        session_id: &SessionId,
        role: &str,
        content: &str,
        metadata_json: Option<&str>,
    ) -> anyhow::Result<i64> {
        self.conn
            .execute(
                r#"INSERT INTO messages (session_id, role, content, metadata, created_at)
                   VALUES (?, ?, ?, ?, datetime('now'))"#,
                libsql::params![session_id.as_str(), role, content, metadata_json],
            )
            .await?;

        // Get last insert rowid
        let mut rows = self.conn.query("SELECT last_insert_rowid()", ()).await?;
        let row = rows.next().await?.expect("last_insert_rowid should return");
        Ok(row.get(0)?)
    }

    /// Get messages for a session (for UI rendering)
    pub async fn get_messages(
        &self,
        session_id: &SessionId,
        limit: u32,
    ) -> anyhow::Result<Vec<Message>> {
        let mut rows = self
            .conn
            .query(
                r#"SELECT id, session_id, role, content, metadata, created_at
                   FROM messages WHERE session_id = ?
                   ORDER BY created_at DESC LIMIT ?"#,
                libsql::params![session_id.as_str(), limit],
            )
            .await?;

        let mut messages = Vec::new();
        while let Some(row) = rows.next().await? {
            messages.push(Message {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                metadata: row.get(4)?,
                created_at: row.get(5)?,
            });
        }
        messages.reverse(); // Oldest first
        Ok(messages)
    }

    // ============== Decisions (Locked Choices) ==============

    /// Promote a decision from parking lot
    pub async fn create_decision(
        &self,
        project_id: &Uuid,
        session_id: &SessionId,
        category: &str,
        key: &str,
        value: &str,
        source: DecisionSource,
        parking_lot_key: Option<&str>,
    ) -> anyhow::Result<i64> {
        self.conn
            .execute(
                r#"INSERT INTO decisions (project_id, session_id, category, key, value, source, parking_lot_key, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"#,
                libsql::params![
                    project_id.to_string(),
                    session_id.as_str(),
                    category,
                    key,
                    value,
                    source.as_str(),
                    parking_lot_key
                ],
            )
            .await?;

        let mut rows = self.conn.query("SELECT last_insert_rowid()", ()).await?;
        let row = rows.next().await?.expect("last_insert_rowid should return");
        Ok(row.get(0)?)
    }

    /// Get decisions for a project (for cross-project RAG)
    pub async fn get_decisions(
        &self,
        project_id: &Uuid,
        category: Option<&str>,
    ) -> anyhow::Result<Vec<Decision>> {
        let query = if category.is_some() {
            r#"SELECT id, project_id, session_id, category, key, value, source, parking_lot_key, created_at
               FROM decisions WHERE project_id = ? AND category = ? ORDER BY created_at DESC"#
        } else {
            r#"SELECT id, project_id, session_id, category, key, value, source, parking_lot_key, created_at
               FROM decisions WHERE project_id = ? ORDER BY created_at DESC"#
        };

        let mut rows = if let Some(cat) = category {
            self.conn
                .query(query, libsql::params![project_id.to_string(), cat])
                .await?
        } else {
            self.conn
                .query(query, libsql::params![project_id.to_string()])
                .await?
        };

        let mut decisions = Vec::new();
        while let Some(row) = rows.next().await? {
            decisions.push(Decision {
                id: row.get(0)?,
                project_id: row.get::<String>(1)?.parse()?,
                session_id: row.get(2)?,
                category: row.get(3)?,
                key: row.get(4)?,
                value: row.get(5)?,
                source: DecisionSource::from_str(&row.get::<String>(6)?),
                parking_lot_key: row.get(7)?,
                created_at: row.get(8)?,
            });
        }
        Ok(decisions)
    }

    // ============== Chunks (RAG) ==============

    /// Store a chunk for RAG
    pub async fn store_chunk(
        &self,
        project_id: &Uuid,
        source_path: &str,
        content: &str,
        chunk_index: i32,
        embedding_id: Option<&str>,
    ) -> anyhow::Result<i64> {
        self.conn
            .execute(
                r#"INSERT INTO chunks (project_id, source_path, content, chunk_index, embedding_id, created_at)
                   VALUES (?, ?, ?, ?, ?, datetime('now'))"#,
                libsql::params![
                    project_id.to_string(),
                    source_path,
                    content,
                    chunk_index,
                    embedding_id
                ],
            )
            .await?;

        let mut rows = self.conn.query("SELECT last_insert_rowid()", ()).await?;
        let row = rows.next().await?.expect("last_insert_rowid should return");
        Ok(row.get(0)?)
    }

    /// Get chunks for a source file
    pub async fn get_chunks_for_source(
        &self,
        project_id: &Uuid,
        source_path: &str,
    ) -> anyhow::Result<Vec<Chunk>> {
        let mut rows = self
            .conn
            .query(
                r#"SELECT id, project_id, source_path, content, chunk_index, embedding_id, created_at
                   FROM chunks WHERE project_id = ? AND source_path = ?
                   ORDER BY chunk_index ASC"#,
                libsql::params![project_id.to_string(), source_path],
            )
            .await?;

        let mut chunks = Vec::new();
        while let Some(row) = rows.next().await? {
            chunks.push(Chunk {
                id: row.get(0)?,
                project_id: row.get::<String>(1)?.parse()?,
                source_path: row.get(2)?,
                content: row.get(3)?,
                chunk_index: row.get(4)?,
                embedding_id: row.get(5)?,
                created_at: row.get(6)?,
            });
        }
        Ok(chunks)
    }

    /// Delete chunks for a source file (for re-indexing)
    pub async fn delete_chunks_for_source(
        &self,
        project_id: &Uuid,
        source_path: &str,
    ) -> anyhow::Result<u64> {
        let result = self
            .conn
            .execute(
                "DELETE FROM chunks WHERE project_id = ? AND source_path = ?",
                libsql::params![project_id.to_string(), source_path],
            )
            .await?;
        Ok(result)
    }

    // ============== Voice Profiles ==============

    /// Create a voice profile
    pub async fn create_voice_profile(
        &self,
        id: &str,
        name: &str,
        gender: &str,
        speaker_id: Option<i32>,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO voice_profiles (id, name, gender, is_active, is_default, speaker_id, created_at)
                   VALUES (?, ?, ?, 0, 0, ?, datetime('now'))"#,
                libsql::params![id, name, gender, speaker_id],
            )
            .await?;
        Ok(())
    }

    /// List all voice profiles
    pub async fn list_voice_profiles(&self) -> anyhow::Result<Vec<VoiceProfile>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, gender, is_active, is_default, speaker_id, created_at FROM voice_profiles ORDER BY created_at DESC",
                (),
            )
            .await?;

        let mut profiles = Vec::new();
        while let Some(row) = rows.next().await? {
            profiles.push(VoiceProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                gender: row.get(2)?,
                is_active: row.get::<i32>(3)? != 0,
                is_default: row.get::<i32>(4)? != 0,
                speaker_id: row.get(5)?,
                created_at: row.get(6)?,
            });
        }
        Ok(profiles)
    }

    /// Get voice profile by ID
    pub async fn get_voice_profile(&self, id: &str) -> anyhow::Result<Option<VoiceProfile>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, gender, is_active, is_default, speaker_id, created_at FROM voice_profiles WHERE id = ?",
                libsql::params![id],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(VoiceProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                gender: row.get(2)?,
                is_active: row.get::<i32>(3)? != 0,
                is_default: row.get::<i32>(4)? != 0,
                speaker_id: row.get(5)?,
                created_at: row.get(6)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// Set active voice profile
    pub async fn set_active_voice_profile(&self, id: &str) -> anyhow::Result<()> {
        // Clear all active flags
        self.conn
            .execute("UPDATE voice_profiles SET is_active = 0", ())
            .await?;
        // Set the new active profile
        self.conn
            .execute(
                "UPDATE voice_profiles SET is_active = 1 WHERE id = ?",
                libsql::params![id],
            )
            .await?;
        Ok(())
    }

    /// Delete voice profile
    pub async fn delete_voice_profile(&self, id: &str) -> anyhow::Result<()> {
        // Delete associated samples first
        self.conn
            .execute(
                "DELETE FROM voice_samples WHERE profile_id = ?",
                libsql::params![id],
            )
            .await?;
        // Delete profile
        self.conn
            .execute(
                "DELETE FROM voice_profiles WHERE id = ?",
                libsql::params![id],
            )
            .await?;
        Ok(())
    }

    // ============== Voice Samples ==============

    /// Save a voice sample
    pub async fn save_voice_sample(
        &self,
        id: &str,
        profile_id: &str,
        filename: &str,
        size_bytes: u64,
        duration_ms: Option<i64>,
        mime_type: &str,
        storage_path: &str,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO voice_samples (id, profile_id, filename, size_bytes, duration_ms, mime_type, storage_path, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"#,
                libsql::params![id, profile_id, filename, size_bytes as i64, duration_ms, mime_type, storage_path],
            )
            .await?;
        Ok(())
    }

    /// List voice samples for a profile
    pub async fn list_voice_samples(&self, profile_id: Option<&str>) -> anyhow::Result<Vec<VoiceSample>> {
        let query = match profile_id {
            Some(_) => {
                "SELECT id, profile_id, filename, size_bytes, duration_ms, mime_type, storage_path, created_at FROM voice_samples WHERE profile_id = ? ORDER BY created_at DESC"
            }
            None => {
                "SELECT id, profile_id, filename, size_bytes, duration_ms, mime_type, storage_path, created_at FROM voice_samples ORDER BY created_at DESC"
            }
        };

        let mut rows = match profile_id {
            Some(pid) => self.conn.query(query, libsql::params![pid]).await?,
            None => self.conn.query(query, ()).await?,
        };

        let mut samples = Vec::new();
        while let Some(row) = rows.next().await? {
            samples.push(VoiceSample {
                id: row.get(0)?,
                profile_id: row.get(1)?,
                filename: row.get(2)?,
                size_bytes: row.get::<i64>(3)? as u64,
                duration_ms: row.get(4)?,
                mime_type: row.get(5)?,
                storage_path: row.get(6)?,
                created_at: row.get(7)?,
            });
        }
        Ok(samples)
    }

    /// Delete a voice sample
    pub async fn delete_voice_sample(&self, id: &str) -> anyhow::Result<Option<String>> {
        // Get storage path first
        let mut rows = self
            .conn
            .query(
                "SELECT storage_path FROM voice_samples WHERE id = ?",
                libsql::params![id],
            )
            .await?;

        let storage_path = if let Some(row) = rows.next().await? {
            Some(row.get::<String>(0)?)
        } else {
            None
        };

        // Delete from database
        self.conn
            .execute(
                "DELETE FROM voice_samples WHERE id = ?",
                libsql::params![id],
            )
            .await?;

        Ok(storage_path)
    }

    /// Get sample count for a profile
    pub async fn get_voice_sample_count(&self, profile_id: &str) -> anyhow::Result<u32> {
        let mut rows = self
            .conn
            .query(
                "SELECT COUNT(*) FROM voice_samples WHERE profile_id = ?",
                libsql::params![profile_id],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(row.get::<i64>(0)? as u32)
        } else {
            Ok(0)
        }
    }

    // ============== Personas ==============

    /// Create or update a persona
    pub async fn save_persona(&self, persona: &shared::config::Persona) -> anyhow::Result<()> {
        let style_json = serde_json::to_string(&persona.style)?;

        self.conn
            .execute(
                r#"INSERT INTO personas (id, name, instructions, personality, style_json, is_active, is_default, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(id) DO UPDATE SET
                       name = excluded.name,
                       instructions = excluded.instructions,
                       personality = excluded.personality,
                       style_json = excluded.style_json,
                       is_active = excluded.is_active,
                       updated_at = excluded.updated_at"#,
                libsql::params![
                    persona.id.clone(),
                    persona.name.clone(),
                    persona.instructions.clone(),
                    persona.personality.clone(),
                    style_json,
                    persona.is_active as i32,
                    persona.is_default as i32,
                    persona.created_at,
                    persona.updated_at
                ],
            )
            .await?;
        Ok(())
    }

    /// Get persona by ID
    pub async fn get_persona(&self, id: &str) -> anyhow::Result<Option<shared::config::Persona>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, instructions, personality, style_json, is_active, is_default, created_at, updated_at FROM personas WHERE id = ?",
                libsql::params![id],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            let style_json: String = row.get(4)?;
            let style: shared::config::ResponseStyle = serde_json::from_str(&style_json).unwrap_or_default();

            Ok(Some(shared::config::Persona {
                id: row.get(0)?,
                name: row.get(1)?,
                instructions: row.get(2)?,
                personality: row.get::<Option<String>>(3)?.unwrap_or_default(),
                style,
                is_active: row.get::<i32>(5)? != 0,
                is_default: row.get::<i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// Get active persona (or default if none active)
    pub async fn get_active_persona(&self) -> anyhow::Result<Option<shared::config::Persona>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, instructions, personality, style_json, is_active, is_default, created_at, updated_at FROM personas WHERE is_active = 1 LIMIT 1",
                (),
            )
            .await?;

        if let Some(row) = rows.next().await? {
            let style_json: String = row.get(4)?;
            let style: shared::config::ResponseStyle = serde_json::from_str(&style_json).unwrap_or_default();

            Ok(Some(shared::config::Persona {
                id: row.get(0)?,
                name: row.get(1)?,
                instructions: row.get(2)?,
                personality: row.get::<Option<String>>(3)?.unwrap_or_default(),
                style,
                is_active: row.get::<i32>(5)? != 0,
                is_default: row.get::<i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List all personas
    pub async fn list_personas(&self) -> anyhow::Result<Vec<shared::config::Persona>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, name, instructions, personality, style_json, is_active, is_default, created_at, updated_at FROM personas ORDER BY is_default DESC, name ASC",
                (),
            )
            .await?;

        let mut personas = Vec::new();
        while let Some(row) = rows.next().await? {
            let style_json: String = row.get(4)?;
            let style: shared::config::ResponseStyle = serde_json::from_str(&style_json).unwrap_or_default();

            personas.push(shared::config::Persona {
                id: row.get(0)?,
                name: row.get(1)?,
                instructions: row.get(2)?,
                personality: row.get::<Option<String>>(3)?.unwrap_or_default(),
                style,
                is_active: row.get::<i32>(5)? != 0,
                is_default: row.get::<i32>(6)? != 0,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            });
        }
        Ok(personas)
    }

    /// Set active persona (clears other active flags)
    pub async fn set_active_persona(&self, id: &str) -> anyhow::Result<()> {
        // Clear all active flags
        self.conn
            .execute("UPDATE personas SET is_active = 0", ())
            .await?;
        // Set the new active persona
        self.conn
            .execute(
                "UPDATE personas SET is_active = 1 WHERE id = ?",
                libsql::params![id],
            )
            .await?;
        Ok(())
    }

    /// Delete persona (cannot delete default)
    pub async fn delete_persona(&self, id: &str) -> anyhow::Result<bool> {
        let result = self
            .conn
            .execute(
                "DELETE FROM personas WHERE id = ? AND is_default = 0",
                libsql::params![id],
            )
            .await?;
        Ok(result > 0)
    }

    /// Ensure default persona exists (call on startup)
    pub async fn ensure_default_persona(&self) -> anyhow::Result<()> {
        let default = shared::config::Persona::maestro_default();

        // Check if default exists
        if self.get_persona(&default.id).await?.is_none() {
            self.save_persona(&default).await?;
            self.set_active_persona(&default.id).await?;
            tracing::info!("Created default Maestro persona");
        }
        Ok(())
    }

    // ============== Active Models ==============

    /// Set active model for a family (upsert)
    pub async fn set_active_model(&self, family: &str, model_id: &str) -> anyhow::Result<()> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_millis() as i64;

        self.conn
            .execute(
                r#"INSERT INTO active_models (family, model_id, activated_at)
                   VALUES (?, ?, ?)
                   ON CONFLICT(family) DO UPDATE SET
                       model_id = excluded.model_id,
                       activated_at = excluded.activated_at"#,
                libsql::params![family, model_id, now],
            )
            .await?;
        Ok(())
    }

    /// Get active model for a family
    pub async fn get_active_model(&self, family: &str) -> anyhow::Result<Option<String>> {
        let mut rows = self
            .conn
            .query(
                "SELECT model_id FROM active_models WHERE family = ?",
                libsql::params![family],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    /// Get all active models (family -> model_id mapping)
    pub async fn get_all_active_models(&self) -> anyhow::Result<Vec<(String, String)>> {
        let mut rows = self
            .conn
            .query("SELECT family, model_id FROM active_models", ())
            .await?;

        let mut result = Vec::new();
        while let Some(row) = rows.next().await? {
            result.push((row.get(0)?, row.get(1)?));
        }
        Ok(result)
    }

    /// Clear active model for a family
    pub async fn clear_active_model(&self, family: &str) -> anyhow::Result<()> {
        self.conn
            .execute(
                "DELETE FROM active_models WHERE family = ?",
                libsql::params![family],
            )
            .await?;
        Ok(())
    }

    // ============== Platform Config ==============

    /// Set platform configuration value
    pub async fn set_platform_config(
        &self,
        key: &str,
        value: &str,
        category: &str,
        description: Option<&str>,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO platform_config (key, value, category, description, updated_at)
                   VALUES (?, ?, ?, ?, unixepoch())
                   ON CONFLICT(key) DO UPDATE SET
                       value = excluded.value,
                       category = excluded.category,
                       description = excluded.description,
                       updated_at = excluded.updated_at"#,
                libsql::params![key, value, category, description],
            )
            .await?;
        Ok(())
    }

    /// Get platform configuration value
    pub async fn get_platform_config(&self, key: &str) -> anyhow::Result<Option<ConfigEntry>> {
        let mut rows = self
            .conn
            .query(
                "SELECT key, value, category, description, updated_at FROM platform_config WHERE key = ?",
                libsql::params![key],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(ConfigEntry {
                key: row.get(0)?,
                value: row.get(1)?,
                category: row.get(2)?,
                description: row.get(3)?,
                updated_at: row.get(4)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List platform config by category
    pub async fn list_platform_config(&self, category: Option<&str>) -> anyhow::Result<Vec<ConfigEntry>> {
        let query = if category.is_some() {
            "SELECT key, value, category, description, updated_at FROM platform_config WHERE category = ? ORDER BY key"
        } else {
            "SELECT key, value, category, description, updated_at FROM platform_config ORDER BY category, key"
        };

        let mut rows = if let Some(cat) = category {
            self.conn.query(query, libsql::params![cat]).await?
        } else {
            self.conn.query(query, ()).await?
        };

        let mut entries = Vec::new();
        while let Some(row) = rows.next().await? {
            entries.push(ConfigEntry {
                key: row.get(0)?,
                value: row.get(1)?,
                category: row.get(2)?,
                description: row.get(3)?,
                updated_at: row.get(4)?,
            });
        }
        Ok(entries)
    }

    /// Delete platform config entry
    pub async fn delete_platform_config(&self, key: &str) -> anyhow::Result<()> {
        self.conn
            .execute(
                "DELETE FROM platform_config WHERE key = ?",
                libsql::params![key],
            )
            .await?;
        Ok(())
    }

    // ============== User Config ==============

    /// Set user configuration value
    pub async fn set_user_config(&self, key: &str, value: &str, category: &str) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO user_config (key, value, category, updated_at)
                   VALUES (?, ?, ?, unixepoch())
                   ON CONFLICT(key) DO UPDATE SET
                       value = excluded.value,
                       category = excluded.category,
                       updated_at = excluded.updated_at"#,
                libsql::params![key, value, category],
            )
            .await?;
        Ok(())
    }

    /// Get user configuration value
    pub async fn get_user_config(&self, key: &str) -> anyhow::Result<Option<ConfigEntry>> {
        let mut rows = self
            .conn
            .query(
                "SELECT key, value, category, NULL as description, updated_at FROM user_config WHERE key = ?",
                libsql::params![key],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(ConfigEntry {
                key: row.get(0)?,
                value: row.get(1)?,
                category: row.get(2)?,
                description: row.get(3)?,
                updated_at: row.get(4)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List user config by category
    pub async fn list_user_config(&self, category: Option<&str>) -> anyhow::Result<Vec<ConfigEntry>> {
        let query = if category.is_some() {
            "SELECT key, value, category, NULL as description, updated_at FROM user_config WHERE category = ? ORDER BY key"
        } else {
            "SELECT key, value, category, NULL as description, updated_at FROM user_config ORDER BY category, key"
        };

        let mut rows = if let Some(cat) = category {
            self.conn.query(query, libsql::params![cat]).await?
        } else {
            self.conn.query(query, ()).await?
        };

        let mut entries = Vec::new();
        while let Some(row) = rows.next().await? {
            entries.push(ConfigEntry {
                key: row.get(0)?,
                value: row.get(1)?,
                category: row.get(2)?,
                description: row.get(3)?,
                updated_at: row.get(4)?,
            });
        }
        Ok(entries)
    }

    /// Delete user config entry
    pub async fn delete_user_config(&self, key: &str) -> anyhow::Result<()> {
        self.conn
            .execute(
                "DELETE FROM user_config WHERE key = ?",
                libsql::params![key],
            )
            .await?;
        Ok(())
    }

    // ============== Project Config ==============

    /// Set project configuration value
    pub async fn set_project_config(
        &self,
        project_id: &Uuid,
        key: &str,
        value: &str,
        category: &str,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO project_config (project_id, key, value, category, updated_at)
                   VALUES (?, ?, ?, ?, unixepoch())
                   ON CONFLICT(project_id, key) DO UPDATE SET
                       value = excluded.value,
                       category = excluded.category,
                       updated_at = excluded.updated_at"#,
                libsql::params![project_id.to_string(), key, value, category],
            )
            .await?;
        Ok(())
    }

    /// Get project configuration value
    pub async fn get_project_config(&self, project_id: &Uuid, key: &str) -> anyhow::Result<Option<ConfigEntry>> {
        let mut rows = self
            .conn
            .query(
                "SELECT key, value, category, NULL as description, updated_at FROM project_config WHERE project_id = ? AND key = ?",
                libsql::params![project_id.to_string(), key],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(ConfigEntry {
                key: row.get(0)?,
                value: row.get(1)?,
                category: row.get(2)?,
                description: row.get(3)?,
                updated_at: row.get(4)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List project config by category
    pub async fn list_project_config(
        &self,
        project_id: &Uuid,
        category: Option<&str>,
    ) -> anyhow::Result<Vec<ConfigEntry>> {
        let query = if category.is_some() {
            "SELECT key, value, category, NULL as description, updated_at FROM project_config WHERE project_id = ? AND category = ? ORDER BY key"
        } else {
            "SELECT key, value, category, NULL as description, updated_at FROM project_config WHERE project_id = ? ORDER BY category, key"
        };

        let mut rows = if let Some(cat) = category {
            self.conn
                .query(query, libsql::params![project_id.to_string(), cat])
                .await?
        } else {
            self.conn
                .query(query, libsql::params![project_id.to_string()])
                .await?
        };

        let mut entries = Vec::new();
        while let Some(row) = rows.next().await? {
            entries.push(ConfigEntry {
                key: row.get(0)?,
                value: row.get(1)?,
                category: row.get(2)?,
                description: row.get(3)?,
                updated_at: row.get(4)?,
            });
        }
        Ok(entries)
    }

    /// Delete project config entry
    pub async fn delete_project_config(&self, project_id: &Uuid, key: &str) -> anyhow::Result<()> {
        self.conn
            .execute(
                "DELETE FROM project_config WHERE project_id = ? AND key = ?",
                libsql::params![project_id.to_string(), key],
            )
            .await?;
        Ok(())
    }

    // ============== Project Resources ==============

    /// Create project resource (image/document)
    pub async fn create_project_resource(
        &self,
        id: &str,
        project_id: &Uuid,
        resource_type: &str,
        filename: &str,
        relative_path: &str,
        original_path: Option<&str>,
        file_hash: &str,
        size_bytes: u64,
        mime_type: &str,
        metadata_json: Option<&str>,
    ) -> anyhow::Result<()> {
        self.conn
            .execute(
                r#"INSERT INTO project_resources 
                   (id, project_id, resource_type, filename, relative_path, original_path, 
                    file_hash, size_bytes, mime_type, metadata_json, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())"#,
                libsql::params![
                    id,
                    project_id.to_string(),
                    resource_type,
                    filename,
                    relative_path,
                    original_path,
                    file_hash,
                    size_bytes as i64,
                    mime_type,
                    metadata_json
                ],
            )
            .await?;
        Ok(())
    }

    /// Get project resource by ID
    pub async fn get_project_resource(&self, id: &str) -> anyhow::Result<Option<ProjectResource>> {
        let mut rows = self
            .conn
            .query(
                r#"SELECT id, project_id, resource_type, filename, relative_path, original_path,
                          file_hash, size_bytes, mime_type, metadata_json, created_at, updated_at
                   FROM project_resources WHERE id = ?"#,
                libsql::params![id],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(ProjectResource {
                id: row.get(0)?,
                project_id: row.get::<String>(1)?.parse()?,
                resource_type: row.get(2)?,
                filename: row.get(3)?,
                relative_path: row.get(4)?,
                original_path: row.get(5)?,
                file_hash: row.get(6)?,
                size_bytes: row.get::<i64>(7)? as u64,
                mime_type: row.get(8)?,
                metadata_json: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List project resources with optional type filter
    pub async fn list_project_resources(
        &self,
        project_id: &Uuid,
        resource_type: Option<&str>,
    ) -> anyhow::Result<Vec<ProjectResource>> {
        let query = if resource_type.is_some() {
            r#"SELECT id, project_id, resource_type, filename, relative_path, original_path,
                      file_hash, size_bytes, mime_type, metadata_json, created_at, updated_at
               FROM project_resources 
               WHERE project_id = ? AND resource_type = ? 
               ORDER BY created_at DESC"#
        } else {
            r#"SELECT id, project_id, resource_type, filename, relative_path, original_path,
                      file_hash, size_bytes, mime_type, metadata_json, created_at, updated_at
               FROM project_resources 
               WHERE project_id = ? 
               ORDER BY created_at DESC"#
        };

        let mut rows = if let Some(rt) = resource_type {
            self.conn
                .query(query, libsql::params![project_id.to_string(), rt])
                .await?
        } else {
            self.conn
                .query(query, libsql::params![project_id.to_string()])
                .await?
        };

        let mut resources = Vec::new();
        while let Some(row) = rows.next().await? {
            resources.push(ProjectResource {
                id: row.get(0)?,
                project_id: row.get::<String>(1)?.parse()?,
                resource_type: row.get(2)?,
                filename: row.get(3)?,
                relative_path: row.get(4)?,
                original_path: row.get(5)?,
                file_hash: row.get(6)?,
                size_bytes: row.get::<i64>(7)? as u64,
                mime_type: row.get(8)?,
                metadata_json: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            });
        }
        Ok(resources)
    }

    /// Find resource by hash (deduplication check)
    pub async fn find_resource_by_hash(
        &self,
        project_id: &Uuid,
        file_hash: &str,
    ) -> anyhow::Result<Option<ProjectResource>> {
        let mut rows = self
            .conn
            .query(
                r#"SELECT id, project_id, resource_type, filename, relative_path, original_path,
                          file_hash, size_bytes, mime_type, metadata_json, created_at, updated_at
                   FROM project_resources 
                   WHERE project_id = ? AND file_hash = ? 
                   LIMIT 1"#,
                libsql::params![project_id.to_string(), file_hash],
            )
            .await?;

        if let Some(row) = rows.next().await? {
            Ok(Some(ProjectResource {
                id: row.get(0)?,
                project_id: row.get::<String>(1)?.parse()?,
                resource_type: row.get(2)?,
                filename: row.get(3)?,
                relative_path: row.get(4)?,
                original_path: row.get(5)?,
                file_hash: row.get(6)?,
                size_bytes: row.get::<i64>(7)? as u64,
                mime_type: row.get(8)?,
                metadata_json: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// Update resource path (when user moves file)
    pub async fn update_resource_path(&self, id: &str, new_relative_path: &str) -> anyhow::Result<()> {
        self.conn
            .execute(
                "UPDATE project_resources SET relative_path = ?, updated_at = unixepoch() WHERE id = ?",
                libsql::params![new_relative_path, id],
            )
            .await?;
        Ok(())
    }

    /// Delete project resource
    pub async fn delete_project_resource(&self, id: &str) -> anyhow::Result<()> {
        // Delete associated links first
        self.conn
            .execute(
                "DELETE FROM resource_links WHERE resource_id = ?",
                libsql::params![id],
            )
            .await?;

        // Delete resource
        self.conn
            .execute(
                "DELETE FROM project_resources WHERE id = ?",
                libsql::params![id],
            )
            .await?;
        Ok(())
    }

    // ============== Resource Links ==============

    /// Create resource link
    pub async fn create_resource_link(
        &self,
        resource_id: &str,
        source_file: &str,
        line_number: Option<i64>,
        link_text: Option<&str>,
    ) -> anyhow::Result<i64> {
        self.conn
            .execute(
                r#"INSERT INTO resource_links (resource_id, source_file, line_number, link_text, created_at)
                   VALUES (?, ?, ?, ?, unixepoch())"#,
                libsql::params![resource_id, source_file, line_number, link_text],
            )
            .await?;

        let mut rows = self.conn.query("SELECT last_insert_rowid()", ()).await?;
        let row = rows.next().await?.expect("last_insert_rowid should return");
        Ok(row.get(0)?)
    }

    /// Get links for a resource
    pub async fn get_resource_links(&self, resource_id: &str) -> anyhow::Result<Vec<ResourceLink>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, resource_id, source_file, line_number, link_text, created_at FROM resource_links WHERE resource_id = ? ORDER BY source_file, line_number",
                libsql::params![resource_id],
            )
            .await?;

        let mut links = Vec::new();
        while let Some(row) = rows.next().await? {
            links.push(ResourceLink {
                id: row.get(0)?,
                resource_id: row.get(1)?,
                source_file: row.get(2)?,
                line_number: row.get(3)?,
                link_text: row.get(4)?,
                created_at: row.get(5)?,
            });
        }
        Ok(links)
    }

    /// Get links from a source file
    pub async fn get_links_from_file(&self, source_file: &str) -> anyhow::Result<Vec<ResourceLink>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, resource_id, source_file, line_number, link_text, created_at FROM resource_links WHERE source_file = ? ORDER BY line_number",
                libsql::params![source_file],
            )
            .await?;

        let mut links = Vec::new();
        while let Some(row) = rows.next().await? {
            links.push(ResourceLink {
                id: row.get(0)?,
                resource_id: row.get(1)?,
                source_file: row.get(2)?,
                line_number: row.get(3)?,
                link_text: row.get(4)?,
                created_at: row.get(5)?,
            });
        }
        Ok(links)
    }

    /// Delete resource link
    pub async fn delete_resource_link(&self, id: i64) -> anyhow::Result<()> {
        self.conn
            .execute(
                "DELETE FROM resource_links WHERE id = ?",
                libsql::params![id],
            )
            .await?;
        Ok(())
    }

    /// Delete all links from a source file (for re-scanning)
    pub async fn delete_links_from_file(&self, source_file: &str) -> anyhow::Result<u64> {
        let result = self
            .conn
            .execute(
                "DELETE FROM resource_links WHERE source_file = ?",
                libsql::params![source_file],
            )
            .await?;
        Ok(result)
    }
}

// ============== Data Types ==============

/// Project record
#[derive(Debug, Clone)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub root_path: String,
    pub project_type: String,
    pub collection_name: String,
    pub created_at: String,
    pub last_accessed: String,
}

/// Session record
#[derive(Debug, Clone)]
pub struct Session {
    pub id: String,
    pub project_id: Option<String>,
    pub created_at: String,
    pub ended_at: Option<String>,
    pub message_count: u32,
    pub last_message_at: Option<String>,
}

/// Message record (clean UI layer)
#[derive(Debug, Clone)]
pub struct Message {
    pub id: i64,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub metadata: Option<String>,
    pub created_at: String,
}

/// Decision source
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DecisionSource {
    /// User manually created
    Manual,
    /// AI promoted from parking lot, user confirmed
    Promoted,
    /// Auto-detected from code/context
    Detected,
}

impl DecisionSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Manual => "manual",
            Self::Promoted => "promoted",
            Self::Detected => "detected",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "manual" => Self::Manual,
            "promoted" => Self::Promoted,
            "detected" => Self::Detected,
            _ => Self::Manual,
        }
    }
}

/// Decision record (locked choice)
#[derive(Debug, Clone)]
pub struct Decision {
    pub id: i64,
    pub project_id: Uuid,
    pub session_id: String,
    pub category: String,
    pub key: String,
    pub value: String,
    pub source: DecisionSource,
    pub parking_lot_key: Option<String>,
    pub created_at: String,
}

/// Chunk record (for RAG)
#[derive(Debug, Clone)]
pub struct Chunk {
    pub id: i64,
    pub project_id: Uuid,
    pub source_path: String,
    pub content: String,
    pub chunk_index: i32,
    pub embedding_id: Option<String>,
    pub created_at: String,
}

/// Voice profile record
#[derive(Debug, Clone)]
pub struct VoiceProfile {
    pub id: String,
    pub name: String,
    pub gender: String,
    pub is_active: bool,
    pub is_default: bool,
    pub speaker_id: Option<i32>,
    pub created_at: String,
}

/// Voice sample record
#[derive(Debug, Clone)]
pub struct VoiceSample {
    pub id: String,
    pub profile_id: String,
    pub filename: String,
    pub size_bytes: u64,
    pub duration_ms: Option<i64>,
    pub mime_type: String,
    pub storage_path: String,
    pub created_at: String,
}

/// Configuration entry (platform, user, or project)
#[derive(Debug, Clone)]
pub struct ConfigEntry {
    pub key: String,
    pub value: String,
    pub category: String,
    pub description: Option<String>,
    pub updated_at: i64,
}

/// Project resource (image/document/video)
#[derive(Debug, Clone)]
pub struct ProjectResource {
    pub id: String,
    pub project_id: Uuid,
    pub resource_type: String,
    pub filename: String,
    pub relative_path: String,
    pub original_path: Option<String>,
    pub file_hash: String,
    pub size_bytes: u64,
    pub mime_type: String,
    pub metadata_json: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Resource link (tracks references to resources)
#[derive(Debug, Clone)]
pub struct ResourceLink {
    pub id: i64,
    pub resource_id: String,
    pub source_file: String,
    pub line_number: Option<i64>,
    pub link_text: Option<String>,
    pub created_at: i64,
}

// ---------------------------------------------------------
// Capture Methods (Combined from GlobalDb)
// ---------------------------------------------------------

impl Database {
    /// Register a capture in global database
    /// RRO is serialized to YAML-LD and stored alongside the file
    /// Returns the CaptureRecord that was inserted for further processing
    pub async fn register_capture(
        &self,
        rro: &CaptureRRO,
    ) -> anyhow::Result<CaptureRecord> {
        use chrono::{DateTime, Utc};
        use std::path::PathBuf;
        use uuid::Uuid;
        
        // Serialize RRO to YAML-LD for persistence
        let metadata_yaml = rro.to_yaml()?;
        
        // Validate timestamp is valid DateTime<Utc>
        let validated_timestamp: DateTime<Utc> = rro.capture.timestamp;
        
        // Build the CaptureRecord from RRO data
        let record = CaptureRecord {
            id: Uuid::parse_str(&rro.capture.id)?,
            filename: std::path::Path::new(&rro.storage.primary_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown.png")
                .to_string(),
            file_path: PathBuf::from(&rro.storage.primary_path),
            width: Some(rro.storage.width),
            height: Some(rro.storage.height),
            file_size: rro.storage.file_size,
            content_hash: Some(rro.storage.content_hash.clone()),
            created_at: validated_timestamp,
            rro_yaml_path: None, // Will be set when RRO file is written
        };
        
        self.conn.execute(
            "INSERT INTO captures (
                id, filename, file_path, width, height, file_size, 
                content_hash, created_at, metadata_yaml
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            libsql::params![
                record.id.to_string(),
                record.filename.clone(),
                record.file_path.to_string_lossy().to_string(),
                record.width.unwrap_or(0) as i64,
                record.height.unwrap_or(0) as i64,
                record.file_size as i64,
                record.content_hash.clone().unwrap_or_default(),
                record.created_at.to_rfc3339(),
                metadata_yaml
            ]
        ).await?;
        
        // Insert tags
        for tag in &rro.tags {
            self.conn.execute(
                "INSERT OR IGNORE INTO capture_tags (capture_id, tag) VALUES (?, ?)",
                libsql::params![record.id.to_string(), tag.clone()]
            ).await?;
        }
        
        Ok(record)
    }
    
    /// Get a capture RRO by ID (deserializes from YAML-LD)
    pub async fn get_capture(&self, id: &str) -> anyhow::Result<Option<CaptureRRO>> {
        let mut rows = self.conn.query(
            "SELECT metadata_yaml FROM captures WHERE id = ?",
            libsql::params![id]
        ).await?;
        
        if let Some(row) = rows.next().await? {
            let yaml: String = row.get(0)?;
            let rro = CaptureRRO::from_yaml(&yaml)?;
            Ok(Some(rro))
        } else {
            Ok(None)
        }
    }
    
    /// List captures with optional tag filter
    pub async fn list_captures(
        &self,
        tag: Option<&str>,
        limit: usize,
    ) -> anyhow::Result<Vec<CaptureRRO>> {
        let mut rows = match tag {
            Some(tag_filter) => {
                // Query with tag filter
                let query = format!(
                    "SELECT c.metadata_yaml FROM captures c 
                     JOIN capture_tags ct ON c.id = ct.capture_id 
                     WHERE ct.tag = ? 
                     ORDER BY c.created_at DESC LIMIT {}",
                    limit
                );
                self.conn.query(&query, libsql::params![tag_filter]).await?
            }
            None => {
                // Query without filter
                let query = format!(
                    "SELECT metadata_yaml FROM captures 
                     ORDER BY created_at DESC LIMIT {}",
                    limit
                );
                self.conn.query(&query, ()).await?
            }
        };
        
        let mut captures = Vec::new();
        while let Some(row) = rows.next().await? {
            let yaml: String = row.get(0)?;
            if let Ok(rro) = CaptureRRO::from_yaml(&yaml) {
                captures.push(rro);
            }
        }
        
        Ok(captures)
    }
}

const SCHEMA: &str = r#"
-- =============================================================================
-- DESKTOP GLOBAL TABLES (devpulse.db)
-- These tables live in ~/.local/share/devpulse/data/devpulse.db
-- =============================================================================

-- =============================================================================
-- PROJECTS - Global registry with UUID-based identity
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,                    -- UUID (not path-based, projects can move)
    name TEXT NOT NULL,                     -- Human-readable name
    root_path TEXT NOT NULL UNIQUE,         -- Filesystem path (can be updated if moved)
    project_type TEXT NOT NULL DEFAULT 'generic', -- rust, python, node, etc.
    collection_name TEXT NOT NULL,          -- RRO collection: project_{uuid}
    created_at TEXT NOT NULL,
    last_accessed TEXT NOT NULL
);

-- =============================================================================
-- DESKTOP PER-PROJECT TABLES (project.db)
-- These tables live in ~/.local/share/devpulse/projects/{uuid}/project.db
-- Each project has its own isolated database instance
-- =============================================================================

-- =============================================================================
-- SESSIONS - Per-project conversation sessions
-- =============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                    -- UUID v7 (time-ordered)
    project_id TEXT REFERENCES projects(id),
    created_at TEXT NOT NULL,
    ended_at TEXT
);

-- =============================================================================
-- MESSAGES - Clean rendered conversation history (UI layer)
-- Note: Raw signal replay lives in fjall, not here
-- =============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    role TEXT NOT NULL,                     -- user, assistant, system
    content TEXT NOT NULL,                  -- Rendered text for display
    metadata TEXT,                          -- JSON: tool_calls, citations, etc.
    created_at TEXT NOT NULL
);

-- =============================================================================
-- DECISIONS - Locked choices (promoted from fjall parking_lot)
-- Used for cross-project RAG and decision consistency
-- =============================================================================
CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id),
    session_id TEXT NOT NULL REFERENCES sessions(id),
    category TEXT NOT NULL,                 -- architecture, library, pattern, convention, etc.
    key TEXT NOT NULL,                      -- Specific decision identifier
    value TEXT NOT NULL,                    -- The locked decision content
    source TEXT NOT NULL DEFAULT 'manual',  -- manual, promoted, detected
    parking_lot_key TEXT,                   -- fjall key if promoted from parking lot
    created_at TEXT NOT NULL,
    UNIQUE(project_id, category, key)       -- Only one decision per category+key
);

-- =============================================================================
-- CHUNKS - RAG chunks with embedding metadata
-- =============================================================================
CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id),
    source_path TEXT NOT NULL,              -- File path relative to project root
    content TEXT NOT NULL,                  -- Chunk text content
    chunk_index INTEGER NOT NULL,           -- Position within source file
    embedding_id TEXT,                      -- Reference to RRO point ID
    created_at TEXT NOT NULL,
    UNIQUE(project_id, source_path, chunk_index)
);

-- =============================================================================
-- LANE RUNS - Trace correlation for multi-hop execution
-- =============================================================================
CREATE TABLE IF NOT EXISTS lane_runs (
    id TEXT PRIMARY KEY,                    -- UUID
    trace_id TEXT NOT NULL,                 -- W3C traceparent
    session_id TEXT NOT NULL,
    lane TEXT NOT NULL,                     -- reflex, rumination, archive
    signal_kind TEXT NOT NULL,
    started_at INTEGER NOT NULL,            -- Unix timestamp ms
    ended_at INTEGER,
    status TEXT NOT NULL,                   -- running, completed, failed
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- =============================================================================
-- LLM CALLS - Token usage and latency tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS llm_calls (
    id TEXT PRIMARY KEY,                    -- UUID
    trace_id TEXT NOT NULL,                 -- Correlates with lane_runs
    lane_run_id TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (lane_run_id) REFERENCES lane_runs(id)
);

-- =============================================================================
-- GOVERNANCE VIOLATIONS - 9 Umbrellas tracking (PER-PROJECT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS governance_violations (
    id TEXT PRIMARY KEY,                    -- UUID
    trace_id TEXT NOT NULL,
    umbrella TEXT NOT NULL,                 -- safety, privacy, security, etc.
    severity TEXT NOT NULL,                 -- warning, block
    message TEXT NOT NULL,
    context TEXT,                           -- JSON blob
    created_at INTEGER NOT NULL
);

-- =============================================================================
-- PROJECT CONFIG - Per-project settings (overrides user/platform defaults)
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_config (
    project_id TEXT NOT NULL,               -- UUID reference to projects table
    key TEXT NOT NULL,                      -- Config key
    value TEXT NOT NULL,                    -- Serialized value
    category TEXT NOT NULL,                 -- Categorization for grouping
    updated_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (project_id, key),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =============================================================================
-- PROJECT RESOURCES - Images/documents with smart linking (PER-PROJECT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_resources (
    id TEXT PRIMARY KEY,                    -- UUID
    project_id TEXT NOT NULL,               -- UUID reference to projects table
    resource_type TEXT NOT NULL,            -- image, document, video, audio
    filename TEXT NOT NULL,                 -- Original filename
    relative_path TEXT NOT NULL,            -- .devpulse/images/arch.png
    original_path TEXT,                     -- Where user imported from (optional)
    file_hash TEXT NOT NULL,                -- SHA256 for deduplication
    size_bytes INTEGER NOT NULL,            -- File size
    mime_type TEXT NOT NULL,                -- image/png, application/pdf, etc.
    metadata_json TEXT,                     -- EXIF, dimensions, OCR text, etc.
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- =============================================================================
-- RESOURCE LINKS - Tracks which files reference which resources (PER-PROJECT)
-- =============================================================================
CREATE TABLE IF NOT EXISTS resource_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id TEXT NOT NULL,              -- UUID reference to project_resources
    source_file TEXT NOT NULL,              -- README.md, docs/architecture.md
    line_number INTEGER,                    -- Line where link appears
    link_text TEXT,                         -- ![Architecture](...)
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (resource_id) REFERENCES project_resources(id) ON DELETE CASCADE
);

-- =============================================================================
-- DESKTOP GLOBAL TABLES - Voice, Personas, Config
-- These live in ~/.local/share/devpulse/data/devpulse.db (GLOBAL)
-- =============================================================================

-- =============================================================================
-- VOICE PROFILES - Custom voice profiles for TTS (GLOBAL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS voice_profiles (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,                     -- Human-readable name
    gender TEXT NOT NULL,                   -- male, female, neutral
    is_active INTEGER DEFAULT 0,            -- Currently active profile
    is_default INTEGER DEFAULT 0,           -- Built-in default profile
    speaker_id INTEGER,                     -- Kokoro speaker ID if mapped
    created_at TEXT NOT NULL
);

-- =============================================================================
-- VOICE SAMPLES - Uploaded voice samples for training/cloning
-- =============================================================================
CREATE TABLE IF NOT EXISTS voice_samples (
    id TEXT PRIMARY KEY,                    -- UUID
    profile_id TEXT NOT NULL,               -- Associated profile
    filename TEXT NOT NULL,                 -- Original filename
    size_bytes INTEGER NOT NULL,            -- File size
    duration_ms INTEGER,                    -- Audio duration (NULL if not computed)
    mime_type TEXT NOT NULL,                -- audio/mpeg, audio/wav, etc.
    storage_path TEXT NOT NULL,             -- Relative path to stored file
    created_at TEXT NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES voice_profiles(id)
);

-- =============================================================================
-- PERSONAS - Maestro personality and instruction configurations (GLOBAL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,                     -- Display name
    instructions TEXT NOT NULL,             -- System prompt for LLM
    personality TEXT,                       -- Personality description
    style_json TEXT,                        -- JSON: ResponseStyle config
    is_active INTEGER DEFAULT 0,            -- Currently active persona
    is_default INTEGER DEFAULT 0,           -- Built-in default (cannot delete)
    created_at INTEGER NOT NULL,            -- Unix timestamp ms
    updated_at INTEGER NOT NULL             -- Unix timestamp ms
);

-- =============================================================================
-- ACTIVE MODELS - Persisted model selection per family (GLOBAL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS active_models (
    family TEXT PRIMARY KEY,                -- qwen3_vl, qwen3_embed, qwen3_rerank, whisper, kokoro
    model_id TEXT NOT NULL,                 -- e.g., qwen3-vl-8b-q6k
    activated_at INTEGER NOT NULL           -- Unix timestamp ms
);

-- =============================================================================
-- PLATFORM CONFIG - System-wide settings (GLOBAL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_config (
    key TEXT PRIMARY KEY,                   -- Config key (e.g., max_context_tokens)
    value TEXT NOT NULL,                    -- Serialized value (JSON or plain text)
    category TEXT NOT NULL,                 -- engine, legal, guidelines, defaults
    description TEXT,                       -- Human-readable description
    updated_at INTEGER DEFAULT (unixepoch())
);

-- =============================================================================
-- USER CONFIG - Global user preferences (GLOBAL - applies across all projects)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,                   -- Config key (e.g., theme, default_model)
    value TEXT NOT NULL,                    -- Serialized value
    category TEXT NOT NULL,                 -- identity, preferences, api_keys
    updated_at INTEGER DEFAULT (unixepoch())
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(session_id, role);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(project_id, category);
CREATE INDEX IF NOT EXISTS idx_chunks_project ON chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(project_id, source_path);
CREATE INDEX IF NOT EXISTS idx_lane_runs_trace ON lane_runs(trace_id);
CREATE INDEX IF NOT EXISTS idx_lane_runs_session ON lane_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_llm_calls_trace ON llm_calls(trace_id);
CREATE INDEX IF NOT EXISTS idx_governance_violations_trace ON governance_violations(trace_id);
CREATE INDEX IF NOT EXISTS idx_governance_violations_umbrella ON governance_violations(umbrella);
CREATE INDEX IF NOT EXISTS idx_voice_samples_profile ON voice_samples(profile_id);
CREATE INDEX IF NOT EXISTS idx_project_config_project ON project_config(project_id);
CREATE INDEX IF NOT EXISTS idx_project_config_category ON project_config(project_id, category);
CREATE INDEX IF NOT EXISTS idx_platform_config_category ON platform_config(category);
CREATE INDEX IF NOT EXISTS idx_user_config_category ON user_config(category);
CREATE INDEX IF NOT EXISTS idx_project_resources_project ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_type ON project_resources(project_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_project_resources_hash ON project_resources(file_hash);
CREATE INDEX IF NOT EXISTS idx_resource_links_resource ON resource_links(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_links_source ON resource_links(source_file);
"#;
