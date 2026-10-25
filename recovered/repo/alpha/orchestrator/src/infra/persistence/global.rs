// orchestrator/src/infra/persistence/global.rs

//! Global Database (System Scope)
//! 
//! Single Source of Truth for Registry, Identity, and Platform Config.
//! Implements strict WAL concurrency and YAML-LD persistence.

use anyhow::Result;
use chrono::{DateTime, Utc};
use libsql::{Builder, Connection};
use std::path::{Path, PathBuf};
use uuid::Uuid;
use shared::types::project::{ProjectRecord, ProjectType};
use shared::config::Persona; // Assuming Persona is in shared::config, might need adjusting if not

/// Global Database Handle
/// Uses WAL mode for concurrent access.
pub struct GlobalDb {
    conn: Connection,
}

impl GlobalDb {
    /// Open the global database with WAL enabled.
    /// 
    /// # Concurrency
    /// - `journal_mode=WAL`: Allows concurrent readers + 1 writer.
    /// - `synchronous=NORMAL`: Balances safety and speed for local apps.
    /// - `foreign_keys=ON`: Enforces referential integrity.
    pub async fn open(path: &Path) -> Result<Self> {
        // Ensure parent dir exists
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let conn = Builder::new_local(path).build().await?.connect()?;
        
        // 1. ENABLE WAL
        conn.execute("PRAGMA journal_mode=WAL;", ()).await?;
        // 2. SYNCHRONOUS NORMAL
        conn.execute("PRAGMA synchronous=NORMAL;", ()).await?;
        // 3. FOREIGN KEYS
        conn.execute("PRAGMA foreign_keys=ON;", ()).await?;

        let db = Self { conn };
        db.init().await?;
        Ok(db)
    }

    /// Initialize schemas (YAML-LD enabled)
    async fn init(&self) -> Result<()> {
        // 1. Project Registry
        // 'project_type' is TEXT but strictly validated via Enum (serde)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                root_path TEXT NOT NULL UNIQUE,
                project_type TEXT NOT NULL,
                collection_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_accessed TEXT NOT NULL
            )", 
            ()
        ).await?;

        // 2. Personas (YAML-LD)
        // 'style_yaml' contains the self-describing configuration
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS personas (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                instructions TEXT NOT NULL,
                style_yaml TEXT NOT NULL,
                is_active INTEGER DEFAULT 0,
                is_default INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            ()
        ).await?;

        // 3. Platform Config (YAML-LD)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS platform_config (
                key TEXT PRIMARY KEY,
                value_yaml TEXT NOT NULL,
                category TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            ()
        ).await?;

        // 4. Global Capture Registry
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS captures (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL UNIQUE,
                width INTEGER,
                height INTEGER,
                file_size INTEGER NOT NULL,
                content_hash TEXT,
                created_at TEXT NOT NULL,
                rro_yaml_path TEXT,
                metadata_yaml TEXT
            )",
            ()
        ).await?;

        // 5. Capture Tags (for fast search/filter)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS capture_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                capture_id TEXT NOT NULL,
                tag TEXT NOT NULL,
                FOREIGN KEY(capture_id) REFERENCES captures(id) ON DELETE CASCADE,
                UNIQUE(capture_id, tag)
            )",
            ()
        ).await?;

        // Index for fast tag searches
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_capture_tags ON capture_tags(tag)",
            ()
        ).await?;

        Ok(())
    }

    // ---------------------------------------------------------
    // Project Registry Methods (Strict Typed)
    // ---------------------------------------------------------

    pub async fn create_project(
        &self, 
        id: &Uuid, 
        name: &str, 
        path: &Path, 
        kind: ProjectType
    ) -> Result<()> {
        self.conn.execute(
            "INSERT INTO projects (
                id, name, root_path, project_type, collection_name, created_at, last_accessed
            ) VALUES (?, ?, ?, ?, ?, ?, ?)",
            libsql::params![
                id.to_string(),
                name,
                path.to_string_lossy().to_string(),
                kind.to_string(), // Enforced by strict Enum
                format!("col_{}", id),
                Utc::now().to_rfc3339(),
                Utc::now().to_rfc3339()
            ]
        ).await?;
        Ok(())
    }

    pub async fn list_projects(&self) -> Result<Vec<ProjectRecord>> {
        let mut rows = self.conn.query("SELECT * FROM projects", ()).await?;
        let mut projects = Vec::new();

        while let Some(row) = rows.next().await? {
            // Strict deserialization
            let id_str: String = row.get(0)?;
            let path_str: String = row.get(2)?;
            let type_str: String = row.get(3)?;
            let created: String = row.get(5)?;
            let accessed: String = row.get(6)?;

            projects.push(ProjectRecord {
                id: Uuid::parse_str(&id_str)?,
                name: row.get(1)?,
                root_path: PathBuf::from(path_str),
                project_type: type_str.parse()?, // Fails if strict enum is violated
                collection_name: row.get(4)?,
                created_at: DateTime::parse_from_rfc3339(&created)?.with_timezone(&Utc),
                last_accessed: DateTime::parse_from_rfc3339(&accessed)?.with_timezone(&Utc),
            });
        }
        Ok(projects)
    }

    // ---------------------------------------------------------
    // Persona Methods (YAML-LD)
    // ---------------------------------------------------------

    pub async fn save_persona(&self, persona: &Persona) -> Result<()> {
        // Serialize style to YAML-LD strict string
        let style_yaml = serde_yaml::to_string(&persona.style)?;
        let now = Utc::now().timestamp();

        self.conn.execute(
            "INSERT OR REPLACE INTO personas (
                id, name, instructions, style_yaml, is_active, is_default, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            libsql::params![
                persona.id.to_string(),
                persona.name.clone(),
                persona.instructions.clone(),
                style_yaml, // Validated YAML
                if persona.is_active { 1 } else { 0 },
                if persona.is_default { 1 } else { 0 },
                now,
                now
            ]
        ).await?;
        Ok(())
    }

    // ---------------------------------------------------------
    // Capture Methods (YAML-LD + JSON-LD)
    // ---------------------------------------------------------

    /// Register a capture in global database
    /// RRO is serialized to YAML-LD and stored alongside the file
    /// Returns the CaptureRecord that was inserted for further processing
    pub async fn register_capture(
        &self,
        rro: &shared::types::capture::CaptureRRO,
    ) -> Result<shared::types::capture::CaptureRecord> {
        use chrono::{DateTime, Utc};
        use std::path::PathBuf;
        use uuid::Uuid;
        use shared::types::capture::CaptureRecord;
        
        // Serialize RRO to YAML-LD for persistence
        let metadata_yaml = rro.to_yaml()?;
        
        // Validate timestamp is valid DateTime<Utc> (use the import!)
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
    pub async fn get_capture(&self, id: &str) -> Result<Option<shared::types::capture::CaptureRRO>> {
        let mut rows = self.conn.query(
            "SELECT metadata_yaml FROM captures WHERE id = ?",
            libsql::params![id]
        ).await?;
        
        if let Some(row) = rows.next().await? {
            let yaml: String = row.get(0)?;
            let rro = shared::types::capture::CaptureRRO::from_yaml(&yaml)?;
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
    ) -> Result<Vec<shared::types::capture::CaptureRRO>> {
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
            if let Ok(rro) = shared::types::capture::CaptureRRO::from_yaml(&yaml) {
                captures.push(rro);
            }
        }
        
        Ok(captures)
    }
}

