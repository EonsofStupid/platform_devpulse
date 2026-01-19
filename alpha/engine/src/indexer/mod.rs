// engine/src/indexer/mod.rs

//! Project indexer - walks files, chunks, embeds, upserts to RRO
//!
//! The GUARDIAN indexer for DevPulse.
//! Scans project files, creates semantic chunks, embeds them, and
//! stores them in RRO for later retrieval.
//!
//! Progress events are emitted at each stage for UI updates.
//!
//! All operations are logged to DuckDB for telemetry.

use anyhow::Result;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use orchestrator::infra::{
    persistence::analytics::Analytics,
    embedding::embedder::EmbedderBackend,
    persistence::sql::Database,
    persistence::vector::{databanks, VectorPoint, VectorStore},
};
use serde::{Deserialize, Serialize};
use tracing::{debug, info, warn};

/// Progress stages during indexing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IndexStage {
    Scanning,
    Chunking,
    Embedding,
    Uploading,
    Complete,
    Error,
}

/// Progress update during indexing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexProgress {
    pub stage: IndexStage,
    pub current: u32,
    pub total: u32,
    /// Running count of files scanned so far
    pub files_scanned: u32,
    /// Running count of chunks processed so far
    pub chunks_processed: u32,
}

/// A chunk of code to be indexed
#[derive(Debug, Clone)]
pub struct CodeChunk {
    /// Source file path (relative to project root)
    pub file_path: String,
    /// Chunk content
    pub content: String,
    /// Start line in source file
    pub start_line: u32,
    /// End line in source file
    pub end_line: u32,
    /// Language detected
    pub language: String,
}

/// Stats from indexing operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    pub files_scanned: u32,
    pub chunks_created: u32,
    pub embeddings_generated: u32,
    pub points_uploaded: u32,
    pub errors: Vec<String>,
    pub duration_ms: u64,
}

/// Project indexer configuration
#[derive(Debug, Clone)]
pub struct IndexerConfig {
    /// Maximum chunk size in tokens (approximate)
    pub max_chunk_tokens: usize,
    /// Overlap between chunks in lines
    pub chunk_overlap_lines: usize,
    /// File extensions to index
    pub include_extensions: Vec<String>,
    /// Directories to skip
    pub exclude_dirs: Vec<String>,
    /// Maximum file size to index (bytes)
    pub max_file_size: usize,
}

impl Default for IndexerConfig {
    fn default() -> Self {
        Self {
            max_chunk_tokens: 512,
            chunk_overlap_lines: 3,
            include_extensions: vec![
                "rs", "py", "ts", "js", "tsx", "jsx", "svelte", "vue",
                "go", "java", "kt", "c", "cpp", "h", "hpp",
                "md", "txt", "json", "yaml", "yml", "toml",
            ].into_iter().map(String::from).collect(),
            exclude_dirs: vec![
                "target", "node_modules", ".git", "dist", "build",
                "__pycache__", ".venv", "venv", ".idea", ".vscode",
            ].into_iter().map(String::from).collect(),
            max_file_size: 1024 * 1024, // 1MB
        }
    }
}

/// Project indexer - scans, chunks, embeds, uploads
pub struct ProjectIndexer {
    config: IndexerConfig,
    embedder: Option<Arc<EmbedderBackend>>,
    rro: Option<Arc<VectorStore>>,
    db: Arc<Database>,
    analytics: Option<Arc<Analytics>>,
}

impl ProjectIndexer {
    /// Create a new indexer with dependencies
    pub fn new(
        embedder: Option<Arc<EmbedderBackend>>,
        rro: Option<Arc<VectorStore>>,
        db: Arc<Database>,
        analytics: Option<Arc<Analytics>>,
    ) -> Self {
        Self {
            config: IndexerConfig::default(),
            embedder,
            rro,
            db,
            analytics,
        }
    }

    /// Index a project, calling progress callback at each stage
    pub async fn index_project<F>(
        &self,
        project_id: &str,
        project_path: &Path,
        mut on_progress: F,
    ) -> Result<IndexStats>
    where
        F: FnMut(IndexProgress),
    {
        let start = std::time::Instant::now();
        let mut stats = IndexStats {
            files_scanned: 0,
            chunks_created: 0,
            embeddings_generated: 0,
            points_uploaded: 0,
            errors: vec![],
            duration_ms: 0,
        };

        info!("Starting indexing for project {} at {:?}", project_id, project_path);

        // Log to analytics
        if let Some(analytics) = &self.analytics {
            let _ = analytics.record_event("indexer.start", &serde_json::json!({
                "project_id": project_id,
                "project_path": project_path.display().to_string(),
            }));
        }

        // Stage 1: Scan files
        on_progress(IndexProgress {
            stage: IndexStage::Scanning,
            current: 0,
            total: 0,
            files_scanned: 0,
            chunks_processed: 0,
        });

        let files = match self.scan_files(project_path).await {
            Ok(f) => f,
            Err(e) => {
                let msg = format!("Failed to scan files: {}", e);
                warn!("{}", msg);
                on_progress(IndexProgress {
                    stage: IndexStage::Error,
                    current: 0,
                    total: 0,
                    files_scanned: 0,
                    chunks_processed: 0,
                });
                stats.errors.push(msg);
                stats.duration_ms = start.elapsed().as_millis() as u64;
                return Ok(stats);
            }
        };

        stats.files_scanned = files.len() as u32;
        info!("Found {} files to index", files.len());

        on_progress(IndexProgress {
            stage: IndexStage::Scanning,
            current: files.len() as u32,
            total: files.len() as u32,
            files_scanned: stats.files_scanned,
            chunks_processed: 0,
        });

        // Stage 2: Chunk files
        on_progress(IndexProgress {
            stage: IndexStage::Chunking,
            current: 0,
            total: stats.files_scanned,
            files_scanned: stats.files_scanned,
            chunks_processed: 0,
        });

        let mut all_chunks = Vec::new();
        for (i, file_path) in files.iter().enumerate() {
            match self.chunk_file(file_path, project_path).await {
                Ok(chunks) => {
                    all_chunks.extend(chunks);
                }
                Err(e) => {
                    let msg = format!("Failed to chunk {:?}: {}", file_path, e);
                    debug!("{}", msg);
                    stats.errors.push(msg);
                }
            }

            if (i + 1) % 10 == 0 || i == files.len() - 1 {
                on_progress(IndexProgress {
                    stage: IndexStage::Chunking,
                    current: (i + 1) as u32,
                    total: stats.files_scanned,
                    files_scanned: stats.files_scanned,
                    chunks_processed: all_chunks.len() as u32,
                });
            }
        }

        stats.chunks_created = all_chunks.len() as u32;
        info!("Created {} chunks from {} files", all_chunks.len(), files.len());

        // Check if we have embedder/rro for remaining stages
        let (embedder, rro) = match (&self.embedder, &self.rro) {
            (Some(e), Some(q)) => (e, q),
            _ => {
                let msg = "Embedder or RRO not available - indexing complete (chunks only)";
                info!("{}", msg);
                on_progress(IndexProgress {
                    stage: IndexStage::Complete,
                    current: stats.chunks_created,
                    total: stats.chunks_created,
                    files_scanned: stats.files_scanned,
                    chunks_processed: stats.chunks_created,
                });
                stats.duration_ms = start.elapsed().as_millis() as u64;

                // Store chunks to libSQL for later
                if let Err(e) = self.store_chunks_to_db(project_id, &all_chunks).await {
                    warn!("Failed to store chunks to DB: {}", e);
                }

                return Ok(stats);
            }
        };

        // Stage 3: Generate embeddings
        on_progress(IndexProgress {
            stage: IndexStage::Embedding,
            current: 0,
            total: stats.chunks_created,
            files_scanned: stats.files_scanned,
            chunks_processed: stats.chunks_created,
        });

        let mut points = Vec::new();
        for (i, chunk) in all_chunks.iter().enumerate() {
            match embedder.embed(&chunk.content) {
                Ok(embedding) => {
                    // Deterministic ID allows deduplication on re-index
                    let point_id = format!("{}:{}:{}", project_id, chunk.file_path, chunk.start_line);
                    let point = VectorPoint::new(
                        point_id,
                        embedding,
                        serde_json::json!({
                            "project_id": project_id,
                            "file_path": chunk.file_path,
                            "start_line": chunk.start_line,
                            "end_line": chunk.end_line,
                            "language": chunk.language,
                            "content": chunk.content,
                        }),
                    );
                    points.push(point);
                    stats.embeddings_generated += 1;
                }
                Err(e) => {
                    let msg = format!("Failed to embed chunk {}: {}", i, e);
                    debug!("{}", msg);
                    stats.errors.push(msg);
                }
            }

            if (i + 1) % 50 == 0 || i == all_chunks.len() - 1 {
                on_progress(IndexProgress {
                    stage: IndexStage::Embedding,
                    current: (i + 1) as u32,
                    total: stats.chunks_created,
                    files_scanned: stats.files_scanned,
                    chunks_processed: stats.chunks_created,
                });
            }
        }

        info!("Generated {} embeddings", stats.embeddings_generated);

        // Stage 4: Upload to RRO
        on_progress(IndexProgress {
            stage: IndexStage::Uploading,
            current: 0,
            total: stats.embeddings_generated,
            files_scanned: stats.files_scanned,
            chunks_processed: stats.chunks_created,
        });

        // Ensure databank exists
        let dimension = embedder.dimension() as u64;
        if let Err(e) = rro.create_databank(databanks::CODE, dimension).await {
            let msg = format!("Failed to create databank: {}", e);
            warn!("{}", msg);
            stats.errors.push(msg);
        }

        // Batch upload in chunks of 100
        let batch_size = 100;
        for (batch_idx, batch) in points.chunks(batch_size).enumerate() {
            match rro.upsert(databanks::CODE, batch.to_vec()).await {
                Ok(_) => {
                    stats.points_uploaded += batch.len() as u32;
                }
                Err(e) => {
                    let msg = format!("Failed to upsert batch {}: {}", batch_idx, e);
                    warn!("{}", msg);
                    stats.errors.push(msg);
                }
            }

            on_progress(IndexProgress {
                stage: IndexStage::Uploading,
                current: stats.points_uploaded,
                total: stats.embeddings_generated,
                files_scanned: stats.files_scanned,
                chunks_processed: stats.chunks_created,
            });
        }

        info!("Uploaded {} points to RRO", stats.points_uploaded);

        // Store chunks to libSQL as well (for backup/debugging)
        if let Err(e) = self.store_chunks_to_db(project_id, &all_chunks).await {
            warn!("Failed to store chunks to DB: {}", e);
        }

        stats.duration_ms = start.elapsed().as_millis() as u64;

        // Log completion to analytics
        if let Some(analytics) = &self.analytics {
            let _ = analytics.record_event("indexer.complete", &serde_json::json!({
                "project_id": project_id,
                "files_scanned": stats.files_scanned,
                "chunks_created": stats.chunks_created,
                "embeddings_generated": stats.embeddings_generated,
                "points_uploaded": stats.points_uploaded,
                "duration_ms": stats.duration_ms,
                "error_count": stats.errors.len(),
            }));
        }

        on_progress(IndexProgress {
            stage: IndexStage::Complete,
            current: stats.points_uploaded,
            total: stats.points_uploaded,
            files_scanned: stats.files_scanned,
            chunks_processed: stats.chunks_created,
        });

        Ok(stats)
    }

    /// Scan directory for indexable files
    async fn scan_files(&self, root: &Path) -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();
        self.scan_dir_recursive(root, root, &mut files)?;
        Ok(files)
    }

    fn scan_dir_recursive(&self, dir: &Path, root: &Path, files: &mut Vec<PathBuf>) -> Result<()> {
        if !dir.is_dir() {
            return Ok(());
        }

        // Check if dir should be excluded
        if let Some(dir_name) = dir.file_name().and_then(|n| n.to_str()) {
            if self.config.exclude_dirs.contains(&dir_name.to_string()) {
                debug!("Skipping excluded directory: {:?}", dir);
                return Ok(());
            }
        }

        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                self.scan_dir_recursive(&path, root, files)?;
            } else if path.is_file() {
                // Check extension
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if self.config.include_extensions.contains(&ext.to_string()) {
                        // Check file size
                        if let Ok(metadata) = std::fs::metadata(&path) {
                            if metadata.len() <= self.config.max_file_size as u64 {
                                files.push(path);
                            } else {
                                debug!("Skipping large file: {:?} ({} bytes)", path, metadata.len());
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }

    /// Chunk a file into semantic pieces
    async fn chunk_file(&self, file_path: &Path, project_root: &Path) -> Result<Vec<CodeChunk>> {
        let content = tokio::fs::read_to_string(file_path).await?;
        let relative_path = file_path
            .strip_prefix(project_root)
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|_| file_path.to_string_lossy().to_string());

        let language = file_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("txt")
            .to_string();

        let lines: Vec<&str> = content.lines().collect();
        let mut chunks = Vec::new();

        // Simple chunking by lines (semantic chunking would be better but this works)
        let chunk_size = 50; // lines per chunk
        let overlap = self.config.chunk_overlap_lines;

        let mut i = 0;
        while i < lines.len() {
            let end = (i + chunk_size).min(lines.len());
            let chunk_lines = &lines[i..end];
            let chunk_content = chunk_lines.join("\n");

            // Skip empty or tiny chunks
            if chunk_content.trim().len() > 20 {
                chunks.push(CodeChunk {
                    file_path: relative_path.clone(),
                    content: chunk_content,
                    start_line: (i + 1) as u32, // 1-indexed
                    end_line: end as u32,
                    language: language.clone(),
                });
            }

            // Move forward with overlap
            i = if end >= lines.len() {
                lines.len()
            } else {
                end.saturating_sub(overlap)
            };
        }

        Ok(chunks)
    }

    /// Store chunks to libSQL for persistence/debugging
    async fn store_chunks_to_db(&self, project_id: &str, chunks: &[CodeChunk]) -> Result<()> {
        let project_uuid = project_id.parse::<uuid::Uuid>()?;

        for (i, chunk) in chunks.iter().enumerate() {
            // Encode start/end line in source_path for now
            let source_with_lines = format!("{}:{}:{}", chunk.file_path, chunk.start_line, chunk.end_line);
            self.db.store_chunk(
                &project_uuid,
                &source_with_lines,
                &chunk.content,
                i as i32, // chunk_index
                None,     // embedding_id (filled when we upload to RRO)
            ).await?;
        }

        info!("Stored {} chunks to libSQL", chunks.len());
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_scan_files() {
        let temp = tempdir().unwrap();
        std::fs::write(temp.path().join("test.rs"), "fn main() {}").unwrap();
        std::fs::write(temp.path().join("readme.md"), "# Test").unwrap();
        std::fs::create_dir(temp.path().join("node_modules")).unwrap();
        std::fs::write(temp.path().join("node_modules/skip.js"), "skip").unwrap();

        let db = Database::open(temp.path().join("test.db")).await.unwrap();
        let indexer = ProjectIndexer::new(None, None, Arc::new(db), None);

        let files = indexer.scan_files(temp.path()).await.unwrap();

        // Should find test.rs and readme.md, but not node_modules/skip.js
        assert_eq!(files.len(), 2);
    }

    #[tokio::test]
    async fn test_chunk_file() {
        let temp = tempdir().unwrap();
        let file_path = temp.path().join("test.rs");

        // Create a file with 100 lines
        let content = (1..=100).map(|i| format!("// Line {}", i)).collect::<Vec<_>>().join("\n");
        std::fs::write(&file_path, &content).unwrap();

        let db = Database::open(temp.path().join("test.db")).await.unwrap();
        let indexer = ProjectIndexer::new(None, None, Arc::new(db), None);

        let chunks = indexer.chunk_file(&file_path, temp.path()).await.unwrap();

        // Should have at least 2 chunks for 100 lines with chunk_size=50
        assert!(chunks.len() >= 2);
        assert_eq!(chunks[0].language, "rs");
    }
}
