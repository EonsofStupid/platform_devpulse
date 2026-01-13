// orchestrator/src/infra/persistence/project.rs

//! Project Database (Data Scope)
//! 
//! Isolated Session Data, Messages, and Retrieval Chunks.
//! Implements strict WAL concurrency and YAML-LD persistence.

use anyhow::Result;
use chrono::{DateTime, Utc};
use libsql::{Builder, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::Path;
use uuid::Uuid;
use shared::types::core::Role; // Strict Enums

/// Project-Specific Database Handle
/// Isolated per project.
pub struct ProjectDb {
    conn: Connection,
    project_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub session_id: String,
    pub role: Role,            // <-- STRICT ENUM
    pub content: String,
    pub metadata: Option<Value>, // Can be deserialized from YAML-LD
    pub created_at: DateTime<Utc>,
}

impl ProjectDb {
    pub async fn open(project_path: &Path, project_id: Uuid) -> Result<Self> {
        let db_path = project_path.join(".devpulse/project.db");
        
        if let Some(parent) = db_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let conn = Builder::new_local(&db_path).build().await?.connect()?;
        
        // 1. ENABLE WAL
        conn.execute("PRAGMA journal_mode=WAL;", ()).await?;
        // 2. SYNCHRONOUS NORMAL
        conn.execute("PRAGMA synchronous=NORMAL;", ()).await?;
        // 3. FOREIGN KEYS
        conn.execute("PRAGMA foreign_keys=ON;", ()).await?;

        let db = Self { conn, project_id };
        db.init().await?;
        Ok(db)
    }

    async fn init(&self) -> Result<()> {
        // 1. Chat Sessions
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                summary TEXT,
                created_at TEXT NOT NULL,
                ended_at TEXT
            )",
            ()
        ).await?;

        // 2. Chat Messages (YAML-LD)
        // 'role' is TEXT but strictly validated via Enum
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata_yaml TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES sessions(id)
            )",
            ()
        ).await?;

        // 3. Decisions/Memory
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                category TEXT NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            ()
        ).await?;

        // 4. RAG Chunks
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_path TEXT NOT NULL,
                content TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                embedding_id TEXT,
                created_at TEXT NOT NULL
            )",
            ()
        ).await?;

        Ok(())
    }

    // ---------------------------------------------------------
    // Session & Message Methods (Strict)
    // ---------------------------------------------------------

    pub async fn create_session(&self, id: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO sessions (id, created_at) VALUES (?, ?)",
            libsql::params![
                id,
                Utc::now().to_rfc3339()
            ]
        ).await?;
        Ok(())
    }

    pub async fn record_message(
        &self, 
        session_id: &str, 
        role: Role, 
        content: &str,
        metadata: Option<&impl Serialize>
    ) -> Result<i64> {
        let role_str = role.to_string(); // "user" via strum
        
        let meta_yaml = match metadata {
            Some(m) => Some(serde_yaml::to_string(m)?),
            None => None
        };

        self.conn.execute(
            "INSERT INTO messages (session_id, role, content, metadata_yaml, created_at) VALUES (?, ?, ?, ?, ?)",
            libsql::params![
                session_id,
                role_str,
                content,
                meta_yaml,
                Utc::now().to_rfc3339()
            ]
        ).await?;

        let id = self.conn.last_insert_rowid();
        Ok(id)
    }

    pub async fn get_messages(&self, session_id: &str, limit: u32) -> Result<Vec<Message>> {
        let mut rows = self.conn.query(
            "SELECT id, session_id, role, content, metadata_yaml, created_at FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?",
            libsql::params![session_id, limit]
        ).await?;

        let mut messages = Vec::new();
        while let Some(row) = rows.next().await? {
            let role_str: String = row.get(2)?;
            let meta_raw: Option<String> = row.get(4)?;
            let created: String = row.get(5)?;

            let metadata = match meta_raw {
                Some(yaml) => Some(serde_yaml::from_str(&yaml)?),
                None => None
            };

            messages.push(Message {
                id: row.get(0)?,
                session_id: row.get(1)?,
                role: role_str.parse()?, // Strict parsing
                content: row.get(3)?,
                metadata,
                created_at: DateTime::parse_from_rfc3339(&created)?.with_timezone(&Utc),
            });
        }
        Ok(messages)
    }

    /// Get the project ID for this database
    pub fn project_id(&self) -> Uuid {
        self.project_id
    }

    /// Record a decision with project context
    pub async fn record_decision(
        &self,
        session_id: &str,
        category: &str,
        key: &str,
        value: &str,
        source: &str,
    ) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO decisions (session_id, category, key, value, source, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            libsql::params![
                session_id,
                category,
                key,
                value,
                format!("project:{} | {}", self.project_id, source),
                Utc::now().to_rfc3339()
            ]
        ).await?;

        let id = self.conn.last_insert_rowid();
        Ok(id)
    }
}
