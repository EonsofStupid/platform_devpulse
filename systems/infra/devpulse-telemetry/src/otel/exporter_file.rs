//! OTLP JSONL file exporter — writes span data as newline-delimited JSON.
//!
//! This is the local-first sink for `OTel` traces. No gRPC port, no embedded
//! collector, no reqwest. Spans are serialized to JSON and appended to a
//! rotating session file at `{data_dir}/telemetry/spans-{session}.otlp.jsonl`.
//!
//! The `DuckDB` `otlp` community extension can read these files on-demand via
//! `read_otlp_traces()`.

use std::fs::{self, File, OpenOptions};
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use chrono::Utc;
use opentelemetry_sdk::trace::{SpanData, SpanExporter};
use serde_json::json;

/// A [`SpanExporter`] that appends span data as JSONL to a local file.
///
/// Each line is a self-contained JSON object with the span's key fields.
/// This is NOT full OTLP protobuf — it's a simplified JSON representation
/// optimized for `DuckDB` ingestion and human readability.
pub struct FileSpanExporter {
    writer: Mutex<BufWriter<File>>,
    path: PathBuf,
}

impl std::fmt::Debug for FileSpanExporter {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // `writer` is a `Mutex<BufWriter<File>>` — holds the OS handle and
        // any buffered bytes, not user-facing state worth dumping.
        f.debug_struct("FileSpanExporter")
            .field("path", &self.path)
            .finish_non_exhaustive()
    }
}

impl FileSpanExporter {
    /// Create a new file exporter writing to the given directory.
    ///
    /// Creates the directory if it doesn't exist. The file is named
    /// `spans-{timestamp}.otlp.jsonl` using the current UTC time.
    ///
    /// # Errors
    /// Returns an error if the directory cannot be created or the file
    /// cannot be opened.
    pub fn new(telemetry_dir: &Path) -> std::io::Result<Self> {
        fs::create_dir_all(telemetry_dir)?;

        let timestamp = Utc::now().format("%Y%m%d-%H%M%S");
        let filename = format!("spans-{timestamp}.otlp.jsonl");
        let path = telemetry_dir.join(filename);

        let file = OpenOptions::new().create(true).append(true).open(&path)?;

        Ok(Self {
            writer: Mutex::new(BufWriter::new(file)),
            path,
        })
    }

    /// Absolute path of the JSONL file this exporter is currently writing to.
    ///
    /// Exposed so the devtool can show users where their trace data lives
    /// without parsing the directory listing.
    #[must_use]
    pub fn current_path(&self) -> &Path {
        &self.path
    }

    /// Rotate old session files, keeping only the most recent `keep` files.
    ///
    /// # Errors
    /// Returns an error if the directory cannot be read.
    pub fn rotate(telemetry_dir: &Path, keep: usize) -> std::io::Result<()> {
        let mut files: Vec<_> = fs::read_dir(telemetry_dir)?
            .filter_map(std::result::Result::ok)
            .filter(|e| e.file_name().to_string_lossy().starts_with("spans-"))
            .collect();

        if files.len() <= keep {
            return Ok(());
        }

        // Sort by name (timestamp-based, so lexicographic = chronological)
        files.sort_by_key(std::fs::DirEntry::file_name);

        // Remove oldest, keep the last `keep`
        let to_remove = files.len() - keep;
        for entry in files.into_iter().take(to_remove) {
            let _ = fs::remove_file(entry.path());
        }

        Ok(())
    }
}

impl SpanExporter for FileSpanExporter {
    fn export(
        &self,
        batch: Vec<SpanData>,
    ) -> impl std::future::Future<Output = opentelemetry_sdk::error::OTelSdkResult> + Send {
        // Serialize synchronously — file I/O is fast for local JSONL.
        // The BatchSpanProcessor calls this from a background task anyway.
        let mut lines = Vec::with_capacity(batch.len());

        for span in &batch {
            let obj = json!({
                "trace_id": format!("{}", span.span_context.trace_id()),
                "span_id": format!("{}", span.span_context.span_id()),
                "parent_span_id": format!("{}", span.parent_span_id),
                "name": span.name.as_ref(),
                "start_time": span.start_time.duration_since(std::time::SystemTime::UNIX_EPOCH)
                    .unwrap_or_default().as_nanos() as u64,
                "end_time": span.end_time.duration_since(std::time::SystemTime::UNIX_EPOCH)
                    .unwrap_or_default().as_nanos() as u64,
                "status": format!("{:?}", span.status),
                "attributes": span.attributes.iter()
                    .map(|kv| (kv.key.as_str().to_owned(), format!("{}", kv.value)))
                    .collect::<std::collections::HashMap<String, String>>(),
            });
            lines.push(obj);
        }

        let result = (|| {
            let mut writer = self.writer.lock().map_err(|_| {
                opentelemetry_sdk::error::OTelSdkError::InternalFailure(
                    "FileSpanExporter lock poisoned".into(),
                )
            })?;
            for line in &lines {
                serde_json::to_writer(&mut *writer, line).map_err(|e| {
                    opentelemetry_sdk::error::OTelSdkError::InternalFailure(format!(
                        "JSON write error: {e}"
                    ))
                })?;
                writeln!(&mut *writer).map_err(|e| {
                    opentelemetry_sdk::error::OTelSdkError::InternalFailure(format!(
                        "newline write error: {e}"
                    ))
                })?;
            }
            writer.flush().map_err(|e| {
                opentelemetry_sdk::error::OTelSdkError::InternalFailure(format!("flush error: {e}"))
            })?;
            Ok(())
        })();

        async move { result }
    }

    fn shutdown_with_timeout(
        &mut self,
        _timeout: std::time::Duration,
    ) -> opentelemetry_sdk::error::OTelSdkResult {
        if let Ok(mut writer) = self.writer.lock() {
            let _ = writer.flush();
        }
        Ok(())
    }
}
