//! `DuckDB` schema diagnostic harness.
//!
//! # Why this exists
//!
//! Schemas grow. When one breaks — whether by SQL syntax, type-system
//! mismatch, or native heap corruption — we need to know **which chunk**
//! is at fault. A single `execute_batch` over the whole schema gives only
//! "all-or-nothing" feedback. This harness splits the schema into labeled
//! statements, applies them cumulatively to a fresh `DuckDB` file, and emits
//! a streaming pass/fail report.
//!
//! # What it diagnoses
//!
//! - **SQL errors** — surfaces the offending chunk with the `DuckDB` error.
//! - **Native crashes** (e.g. `STATUS_HEAP_CORRUPTION` on Windows) — the
//!   harness flushes stdout after every chunk, so the **last printed line
//!   names the chunk in flight when the process died**.
//! - **Idempotency regressions** — see [`assert_schema_idempotent`].
//!
//! # Output
//!
//! ```text
//! ── SCHEMA BISECT: SYSTEM_ANALYTICS_SCHEMA (17 chunks) ──
//! [01/17] table kv_store ........................ ✓   (412µs)
//! [02/17] table model_calls ...................... ✓   (286µs)
//! ...
//! [16/17] table vision_embeddings ................ ✓   (519µs)
//! [17/17] index idx_vision_embeddings_session .... ✓   (104µs)
//! ── 17/17 chunks loaded cleanly (8.4ms) ──
//! ```
//!
//! # Reusable for future schemas
//!
//! Generic over schema content. The same harness runs against the upcoming
//! `cortex::policy::a2ui` and `cortex::policy::agui` schemas without any
//! per-schema scaffolding — pass the schema string and a label.

use std::fmt;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use anyhow::{Context, Result};

// ════════════════════════════════════════════════════════════════════
// Schema chunk parser
// ════════════════════════════════════════════════════════════════════

/// One SQL statement extracted from a schema string, with a human-readable
/// label derived from its leading `CREATE TABLE` / `CREATE INDEX` clause.
#[derive(Debug, Clone)]
pub struct SchemaChunk {
    /// Rendered label, e.g. `"table vision_embeddings"`,
    /// `"index idx_lane_traces_lane"`, or a 40-char SQL preview when the
    /// statement isn't a CREATE.
    pub label: String,
    /// The full SQL statement including the trailing `;`.
    pub sql: String,
}

/// Split a schema string at top-level `;` boundaries.
///
/// Tracks state across:
/// - single-quoted string literals (with `''` escape)
/// - `--` line comments
/// - `/* … */` block comments
///
/// Empty or comment-only chunks are dropped. Returned chunks preserve their
/// original whitespace + comments so the executed SQL matches the source.
#[must_use]
pub fn parse_schema_chunks(schema: &str) -> Vec<SchemaChunk> {
    let mut chunks = Vec::new();
    let mut current = String::new();
    let mut state = ParseState::Normal;
    let bytes: Vec<char> = schema.chars().collect();
    let mut i = 0;

    while i < bytes.len() {
        let ch = bytes[i];
        match state {
            ParseState::Normal => {
                if ch == '\'' {
                    state = ParseState::InString;
                    current.push(ch);
                } else if ch == '-' && bytes.get(i + 1) == Some(&'-') {
                    state = ParseState::InLineComment;
                    current.push(ch);
                } else if ch == '/' && bytes.get(i + 1) == Some(&'*') {
                    state = ParseState::InBlockComment;
                    current.push(ch);
                    current.push('*');
                    i += 1;
                } else if ch == ';' {
                    current.push(ch);
                    push_chunk_if_meaningful(&mut chunks, &current);
                    current.clear();
                } else {
                    current.push(ch);
                }
            }
            ParseState::InString => {
                current.push(ch);
                if ch == '\'' {
                    if bytes.get(i + 1) == Some(&'\'') {
                        // Escaped quote: stay in string, consume both.
                        current.push('\'');
                        i += 1;
                    } else {
                        state = ParseState::Normal;
                    }
                }
            }
            ParseState::InLineComment => {
                current.push(ch);
                if ch == '\n' {
                    state = ParseState::Normal;
                }
            }
            ParseState::InBlockComment => {
                current.push(ch);
                if ch == '*' && bytes.get(i + 1) == Some(&'/') {
                    current.push('/');
                    i += 1;
                    state = ParseState::Normal;
                }
            }
        }
        i += 1;
    }
    push_chunk_if_meaningful(&mut chunks, &current);
    chunks
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ParseState {
    Normal,
    InString,
    InLineComment,
    InBlockComment,
}

fn push_chunk_if_meaningful(chunks: &mut Vec<SchemaChunk>, raw: &str) {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return;
    }
    if is_only_comments(trimmed) {
        return;
    }
    chunks.push(SchemaChunk {
        label: extract_label(trimmed),
        sql: trimmed.to_string(),
    });
}

fn is_only_comments(sql: &str) -> bool {
    let mut state = ParseState::Normal;
    let bytes: Vec<char> = sql.chars().collect();
    let mut i = 0;
    while i < bytes.len() {
        let ch = bytes[i];
        match state {
            ParseState::Normal => {
                if ch.is_whitespace() {
                    // skip
                } else if ch == '-' && bytes.get(i + 1) == Some(&'-') {
                    state = ParseState::InLineComment;
                } else if ch == '/' && bytes.get(i + 1) == Some(&'*') {
                    state = ParseState::InBlockComment;
                    i += 1;
                } else {
                    return false;
                }
            }
            ParseState::InLineComment => {
                if ch == '\n' {
                    state = ParseState::Normal;
                }
            }
            ParseState::InBlockComment => {
                if ch == '*' && bytes.get(i + 1) == Some(&'/') {
                    i += 1;
                    state = ParseState::Normal;
                }
            }
            ParseState::InString => return false,
        }
        i += 1;
    }
    true
}

fn extract_label(sql: &str) -> String {
    // Drop leading comments and blank lines, then look at the first
    // meaningful word group.
    let head = strip_leading_comments(sql);
    let head_upper: String = head.chars().take(64).collect::<String>().to_uppercase();

    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE TABLE IF NOT EXISTS ") {
        return format!("table {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE TABLE ") {
        return format!("table {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE UNIQUE INDEX IF NOT EXISTS ")
    {
        return format!("unique index {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE UNIQUE INDEX ") {
        return format!("unique index {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE INDEX IF NOT EXISTS ") {
        return format!("index {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE INDEX ") {
        return format!("index {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE VIEW IF NOT EXISTS ") {
        return format!("view {name}");
    }
    if let Some(name) = label_after_prefix(&head_upper, head, "CREATE VIEW ") {
        return format!("view {name}");
    }

    // Fallback: a single-line preview.
    let preview: String = head
        .replace('\n', " ")
        .chars()
        .take(40)
        .collect::<String>()
        .trim_end()
        .to_string();
    if preview.is_empty() {
        "(empty)".to_string()
    } else {
        preview
    }
}

fn strip_leading_comments(sql: &str) -> &str {
    let mut bytes = sql.as_bytes();
    loop {
        // Skip whitespace.
        let leading_ws = bytes.iter().take_while(|b| b.is_ascii_whitespace()).count();
        bytes = &bytes[leading_ws..];
        // Line comment.
        if bytes.starts_with(b"--") {
            if let Some(nl) = bytes.iter().position(|b| *b == b'\n') {
                bytes = &bytes[nl + 1..];
                continue;
            }
            return "";
        }
        // Block comment.
        if bytes.starts_with(b"/*") {
            if let Some(end) = bytes.windows(2).position(|w| w == b"*/") {
                bytes = &bytes[end + 2..];
                continue;
            }
            return "";
        }
        return std::str::from_utf8(bytes).unwrap_or("");
    }
}

fn label_after_prefix(head_upper: &str, head: &str, prefix: &str) -> Option<String> {
    if !head_upper.starts_with(prefix) {
        return None;
    }
    let after = &head[prefix.len()..];
    let name: String = after
        .chars()
        .take_while(|c| !c.is_whitespace() && *c != '(')
        .collect();
    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}

// ════════════════════════════════════════════════════════════════════
// On-disk fixture with Drop cleanup
// ════════════════════════════════════════════════════════════════════

/// Auto-cleanup wrapper around a unique on-disk `DuckDB` file.
///
/// On `Drop`, removes both the `.duckdb` file and any companion `.duckdb.wal`
/// even if the test panics. Path uniqueness combines monotonic nanos with a
/// per-process counter so rapid creation in the same test binary doesn't
/// collide.
pub struct DuckDbFixture {
    path: PathBuf,
}

impl DuckDbFixture {
    /// Create a fresh fixture under the OS temp dir, labeled for readability.
    pub fn new(label: &str) -> Self {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let seq = COUNTER.fetch_add(1, Ordering::Relaxed);
        let safe_label: String = label
            .chars()
            .map(|c| if c.is_ascii_alphanumeric() { c } else { '_' })
            .collect();
        let path = std::env::temp_dir().join(format!("dpd_{safe_label}_{nanos}_{seq}.duckdb"));
        Self { path }
    }

    /// Filesystem path to the (not-yet-created) `DuckDB` file.
    #[must_use]
    pub fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for DuckDbFixture {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.path);
        let wal = self.path.with_extension("duckdb.wal");
        let _ = std::fs::remove_file(&wal);
    }
}

// ════════════════════════════════════════════════════════════════════
// Bisection
// ════════════════════════════════════════════════════════════════════

/// Outcome of running a single chunk.
#[derive(Debug, Clone)]
pub enum ChunkOutcome {
    /// Chunk executed cleanly.
    Ok,
    /// `DuckDB` returned an error from the chunk's SQL.
    SqlError(String),
}

/// Per-chunk record kept for the final report.
#[derive(Debug, Clone)]
pub struct ChunkRecord {
    /// Zero-based position of this chunk in the original schema.
    pub index: usize,
    /// The chunk that was executed.
    pub chunk: SchemaChunk,
    /// Whether the chunk ran cleanly or returned a SQL error.
    pub outcome: ChunkOutcome,
    /// Wall-clock time `execute_batch` spent on this chunk, in microseconds.
    pub elapsed_us: u128,
}

/// Streaming visual report from [`bisect_schema`].
#[derive(Debug, Clone)]
pub struct BisectReport {
    /// Caller-supplied label for the schema (used in headers + panic
    /// messages). Free-form; conventionally the constant name in
    /// `SCREAMING_SNAKE_CASE`.
    pub schema_name: String,
    /// Total number of chunks parsed from the schema.
    pub total: usize,
    /// Number of chunks that loaded cleanly before either completion or
    /// the first failure.
    pub passed: usize,
    /// Per-chunk records, in execution order. Includes the failing chunk
    /// if any.
    pub records: Vec<ChunkRecord>,
    /// The first chunk that failed, if any. `None` means the whole schema
    /// loaded cleanly.
    pub failure: Option<ChunkRecord>,
    /// Wall-clock time the entire run took, in microseconds (open + every
    /// chunk + report formatting).
    pub total_elapsed_us: u128,
}

impl BisectReport {
    /// Panic with a clean message if any chunk failed.
    ///
    /// Use in `#[test]` functions that should treat any failure as a
    /// regression. The panic message names the failing chunk, its index,
    /// and the underlying error.
    ///
    /// # Panics
    /// Panics with a structured "schema X failed at chunk Y" message
    /// when [`Self`] holds a recorded failure. Cleanly-applied reports
    /// (`failure == None`) are silent.
    pub fn assert_clean(&self) {
        if let Some(rec) = &self.failure {
            let err = match &rec.outcome {
                ChunkOutcome::SqlError(e) => e.as_str(),
                ChunkOutcome::Ok => "<no error>",
            };
            panic!(
                "schema {} failed at chunk [{:02}/{:02}] {} → {}",
                self.schema_name,
                rec.index + 1,
                self.total,
                rec.chunk.label,
                err,
            );
        }
    }
}

impl fmt::Display for BisectReport {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        writeln!(
            f,
            "── SCHEMA BISECT: {} ({} chunks) ──",
            self.schema_name, self.total
        )?;
        for rec in &self.records {
            let mark = match &rec.outcome {
                ChunkOutcome::Ok => "✓",
                ChunkOutcome::SqlError(_) => "✗",
            };
            let label_dots = render_label_with_dots(&rec.chunk.label, 40);
            writeln!(
                f,
                "[{:02}/{:02}] {} {}   ({})",
                rec.index + 1,
                self.total,
                label_dots,
                mark,
                render_micros(rec.elapsed_us),
            )?;
            if let ChunkOutcome::SqlError(e) = &rec.outcome {
                writeln!(f, "        ↳ {e}")?;
            }
        }
        match &self.failure {
            None => writeln!(
                f,
                "── {}/{} chunks loaded cleanly ({}) ──",
                self.passed,
                self.total,
                render_micros(self.total_elapsed_us),
            )?,
            Some(rec) => writeln!(
                f,
                "── FAILED at chunk {} ({} of {}) ──",
                rec.chunk.label,
                rec.index + 1,
                self.total
            )?,
        }
        Ok(())
    }
}

fn render_label_with_dots(label: &str, width: usize) -> String {
    if label.len() >= width {
        return label.to_string();
    }
    let padding = width - label.len();
    let dots = ".".repeat(padding.saturating_sub(1));
    format!("{label} {dots}")
}

/// Convert a microsecond count to a one-line human duration string.
///
/// `u128 → f64` is intentional for display: timing samples never
/// approach `2^52` microseconds (≈ 142 years), so the precision loss
/// is structurally impossible for every value the schema-bisect
/// harness will ever produce.
#[expect(
    clippy::cast_precision_loss,
    reason = "u128 microsecond timer values stay well inside f64 mantissa; \
              cast feeds `{:.N}` display formatting only."
)]
fn render_micros(us: u128) -> String {
    if us < 1_000 {
        format!("{us}µs")
    } else if us < 1_000_000 {
        format!("{:.1}ms", us as f64 / 1_000.0)
    } else {
        format!("{:.2}s", us as f64 / 1_000_000.0)
    }
}

/// Run each statement of `schema` in cumulative order against a fresh
/// `DuckDB` file, streaming a chunk-by-chunk report to stdout.
///
/// **The streaming property is load-bearing**: stdout is flushed after each
/// chunk so the last printed line survives a hard process abort
/// (e.g. `STATUS_HEAP_CORRUPTION` on Windows). When investigating native
/// crashes, the chunk in flight at the time of the crash is the smoking gun.
///
/// Returns the [`BisectReport`] regardless of outcome; pair with
/// [`BisectReport::assert_clean`] in tests.
pub fn bisect_schema(name: &str, schema: &str) -> BisectReport {
    let chunks = parse_schema_chunks(schema);
    let total = chunks.len();
    let started = Instant::now();
    let mut records = Vec::with_capacity(total);
    let mut passed = 0;
    let mut failure: Option<ChunkRecord> = None;

    println!();
    println!("── SCHEMA BISECT: {name} ({total} chunks) ──");
    let _ = std::io::stdout().flush();

    let fixture = DuckDbFixture::new(name);
    let conn = match duckdb::Connection::open(fixture.path()) {
        Ok(c) => c,
        Err(e) => {
            println!("✗ failed to open DuckDB: {e}");
            let _ = std::io::stdout().flush();
            let rec = ChunkRecord {
                index: 0,
                chunk: SchemaChunk {
                    label: "(open connection)".to_string(),
                    sql: String::new(),
                },
                outcome: ChunkOutcome::SqlError(e.to_string()),
                elapsed_us: started.elapsed().as_micros(),
            };
            return BisectReport {
                schema_name: name.to_string(),
                total,
                passed: 0,
                records: vec![rec.clone()],
                failure: Some(rec),
                total_elapsed_us: started.elapsed().as_micros(),
            };
        }
    };

    for (i, chunk) in chunks.iter().enumerate() {
        let label_dots = render_label_with_dots(&chunk.label, 40);
        print!("[{:02}/{:02}] {} ", i + 1, total, label_dots);
        let _ = std::io::stdout().flush();

        let chunk_start = Instant::now();
        let outcome = match conn.execute_batch(&chunk.sql) {
            Ok(()) => {
                passed += 1;
                ChunkOutcome::Ok
            }
            Err(e) => ChunkOutcome::SqlError(e.to_string()),
        };
        let elapsed_us = chunk_start.elapsed().as_micros();

        match &outcome {
            ChunkOutcome::Ok => println!("✓   ({})", render_micros(elapsed_us)),
            ChunkOutcome::SqlError(e) => {
                println!("✗   ({})", render_micros(elapsed_us));
                println!("        ↳ {e}");
            }
        }
        let _ = std::io::stdout().flush();

        let record = ChunkRecord {
            index: i,
            chunk: chunk.clone(),
            outcome: outcome.clone(),
            elapsed_us,
        };
        records.push(record.clone());

        if matches!(outcome, ChunkOutcome::SqlError(_)) {
            failure = Some(record);
            break;
        }
    }

    let total_elapsed_us = started.elapsed().as_micros();
    match &failure {
        None => println!(
            "── {}/{} chunks loaded cleanly ({}) ──",
            passed,
            total,
            render_micros(total_elapsed_us)
        ),
        Some(rec) => println!(
            "── FAILED at chunk {} ({} of {}) ──",
            rec.chunk.label,
            rec.index + 1,
            total
        ),
    }
    let _ = std::io::stdout().flush();

    BisectReport {
        schema_name: name.to_string(),
        total,
        passed,
        records,
        failure,
        total_elapsed_us,
    }
}

// ════════════════════════════════════════════════════════════════════
// Column-level bisection
// ════════════════════════════════════════════════════════════════════

/// One candidate column definition tested in isolation by
/// [`bisect_columns`].
///
/// `sql` is the column fragment (no leading or trailing comma), e.g.
/// `"metadata JSON"` or `"created_at TIMESTAMP DEFAULT now()"`.
#[derive(Debug, Clone)]
pub struct ColumnSpec {
    /// Short human-readable label (rendered in the report).
    pub label: String,
    /// The column SQL fragment (no commas, no parentheses).
    pub sql: String,
}

impl ColumnSpec {
    /// Convenience: build from `&'static str` literals.
    #[must_use]
    pub fn new(label: impl Into<String>, sql: impl Into<String>) -> Self {
        Self {
            label: label.into(),
            sql: sql.into(),
        }
    }
}

/// Per-candidate outcome from [`bisect_columns`].
#[derive(Debug, Clone)]
pub struct ColumnRecord {
    /// Zero-based position in the candidate list.
    pub index: usize,
    /// The candidate column.
    pub column: ColumnSpec,
    /// Whether `DuckDB` accepted the `CREATE TABLE` containing this column.
    pub outcome: ChunkOutcome,
    /// Wall-clock microseconds the create took.
    pub elapsed_us: u128,
}

/// Visual report from [`bisect_columns`].
#[derive(Debug, Clone)]
pub struct ColumnBisectReport {
    /// Caller-supplied label naming the test (e.g. `"model_calls columns"`).
    pub label: String,
    /// Total number of candidates tested.
    pub total: usize,
    /// Number of candidates that loaded cleanly.
    pub passed: usize,
    /// Per-candidate records, in test order.
    pub records: Vec<ColumnRecord>,
    /// Wall-clock microseconds the entire bisection took.
    pub total_elapsed_us: u128,
}

impl ColumnBisectReport {
    /// Panic with a clean message if any candidate failed. Use in `#[test]`
    /// functions that should treat any column-level failure as a regression.
    ///
    /// # Panics
    /// Panics with a `"{label} column bisect: N of M columns failed: [...]"`
    /// message when at least one [`ColumnRecord`] in [`Self::records`]
    /// did not land [`ChunkOutcome::Ok`]. Clean reports are silent.
    pub fn assert_clean(&self) {
        let failures: Vec<&ColumnRecord> = self
            .records
            .iter()
            .filter(|r| !matches!(r.outcome, ChunkOutcome::Ok))
            .collect();
        if !failures.is_empty() {
            let names: Vec<String> = failures.iter().map(|r| r.column.label.clone()).collect();
            panic!(
                "{} column bisect: {} of {} columns failed: [{}]",
                self.label,
                failures.len(),
                self.total,
                names.join(", ")
            );
        }
    }
}

/// Test each `candidate` column in isolation against a fresh `DuckDB`.
///
/// For each candidate, opens a new on-disk DB and runs:
///
/// ```sql
/// CREATE TABLE bisect_x (id INTEGER PRIMARY KEY, <candidate>);
/// ```
///
/// Streams a per-candidate pass/fail report to stdout with stdout flushed
/// after every line, so a hard process abort during one candidate's run
/// leaves a definitive trail naming exactly which column triggered it.
///
/// Used to diagnose heap-corruption-class bugs where `DuckDB` extension
/// types (e.g. `JSON`, `DOUBLE[]`) interact badly with the host process's
/// allocator state — at column granularity, not whole-statement.
pub fn bisect_columns(label: &str, candidates: &[ColumnSpec]) -> ColumnBisectReport {
    let total = candidates.len();
    let started = Instant::now();
    let mut records = Vec::with_capacity(total);
    let mut passed = 0;

    println!();
    println!("── COLUMN BISECT: {label} ({total} candidates) ──");
    let _ = std::io::stdout().flush();

    for (i, candidate) in candidates.iter().enumerate() {
        let label_dots = render_label_with_dots(&candidate.label, 40);
        print!("[{:02}/{:02}] {} ", i + 1, total, label_dots);
        let _ = std::io::stdout().flush();

        let fixture = DuckDbFixture::new(&format!("col_bisect_{i:02}"));
        let chunk_start = Instant::now();

        let outcome = match duckdb::Connection::open(fixture.path()) {
            Err(e) => ChunkOutcome::SqlError(format!("open: {e}")),
            Ok(conn) => {
                let sql = format!(
                    "CREATE TABLE bisect_x (id INTEGER PRIMARY KEY, {});",
                    candidate.sql
                );
                match conn.execute_batch(&sql) {
                    Ok(()) => {
                        passed += 1;
                        ChunkOutcome::Ok
                    }
                    Err(e) => ChunkOutcome::SqlError(e.to_string()),
                }
            }
        };
        let elapsed_us = chunk_start.elapsed().as_micros();

        match &outcome {
            ChunkOutcome::Ok => println!("✓   ({})", render_micros(elapsed_us)),
            ChunkOutcome::SqlError(e) => {
                println!("✗   ({})", render_micros(elapsed_us));
                println!("        ↳ {e}");
            }
        }
        let _ = std::io::stdout().flush();

        records.push(ColumnRecord {
            index: i,
            column: candidate.clone(),
            outcome,
            elapsed_us,
        });
    }

    let total_elapsed_us = started.elapsed().as_micros();
    println!(
        "── {}/{} columns accepted ({}) ──",
        passed,
        total,
        render_micros(total_elapsed_us)
    );
    let _ = std::io::stdout().flush();

    ColumnBisectReport {
        label: label.to_string(),
        total,
        passed,
        records,
        total_elapsed_us,
    }
}

/// Assert that loading `schema` twice in succession on the same database
/// is a no-op — the schema must use `CREATE … IF NOT EXISTS` consistently.
///
/// Used to catch regressions where a new chunk forgets the `IF NOT EXISTS`
/// guard, which would crash boot whenever `DevPulse` restarts against an
/// existing data dir.
///
/// Streams phase markers (`open`, `first load`, `second load`) to stdout
/// with flushes between each, so a hard process abort during a phase leaves
/// a definitive trail naming where it died.
///
/// # Errors
///
/// Returns the underlying `DuckDB` error if either load fails.
pub fn assert_schema_idempotent(name: &str, schema: &str) -> Result<()> {
    println!();
    println!("── IDEMPOTENCY CHECK: {name} ──");
    let _ = std::io::stdout().flush();

    let phase_open = Instant::now();
    print!("  [phase 1/3] open connection ... ");
    let _ = std::io::stdout().flush();
    let fixture = DuckDbFixture::new(&format!("{name}_idempotent"));
    let conn = duckdb::Connection::open(fixture.path())
        .with_context(|| format!("open DuckDB for {name} idempotency check"))?;
    println!("✓   ({})", render_micros(phase_open.elapsed().as_micros()));
    let _ = std::io::stdout().flush();

    let phase_first = Instant::now();
    print!("  [phase 2/3] first load ........ ");
    let _ = std::io::stdout().flush();
    conn.execute_batch(schema)
        .with_context(|| format!("first load of {name}"))?;
    println!("✓   ({})", render_micros(phase_first.elapsed().as_micros()));
    let _ = std::io::stdout().flush();

    let phase_second = Instant::now();
    print!("  [phase 3/3] second load ....... ");
    let _ = std::io::stdout().flush();
    conn.execute_batch(schema)
        .with_context(|| format!("second load of {name} (idempotency)"))?;
    println!(
        "✓   ({})",
        render_micros(phase_second.elapsed().as_micros())
    );
    let _ = std::io::stdout().flush();

    println!("── idempotency holds ──");
    let _ = std::io::stdout().flush();
    Ok(())
}

// ════════════════════════════════════════════════════════════════════
// Tests for the harness itself
// ════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    #![expect(
        clippy::expect_used,
        clippy::unwrap_used,
        reason = "assert the expected success or failure of database fixtures"
    )]

    use super::*;

    #[test]
    fn parse_chunks_splits_on_top_level_semicolons() {
        let schema = r"
            CREATE TABLE a (x INTEGER);
            CREATE TABLE b (y TEXT);
        ";
        let chunks = parse_schema_chunks(schema);
        assert_eq!(chunks.len(), 2);
        assert!(chunks[0].sql.contains("CREATE TABLE a"));
        assert!(chunks[1].sql.contains("CREATE TABLE b"));
    }

    #[test]
    fn parse_chunks_ignores_semicolons_inside_string_literals() {
        let schema = "INSERT INTO a VALUES ('x;y;z'); INSERT INTO b VALUES ('q');";
        let chunks = parse_schema_chunks(schema);
        assert_eq!(chunks.len(), 2);
        assert!(chunks[0].sql.contains("'x;y;z'"));
    }

    #[test]
    fn parse_chunks_handles_escaped_quotes_in_strings() {
        let schema = "INSERT INTO a VALUES ('it''s; fine'); INSERT INTO b VALUES (1);";
        let chunks = parse_schema_chunks(schema);
        assert_eq!(chunks.len(), 2);
        assert!(chunks[0].sql.contains("'it''s; fine'"));
    }

    #[test]
    fn parse_chunks_skips_line_comments() {
        let schema = r"
            -- top-level comment with a ; in it
            CREATE TABLE a (x INTEGER);
            -- trailing comment
        ";
        let chunks = parse_schema_chunks(schema);
        assert_eq!(chunks.len(), 1);
        assert!(chunks[0].sql.contains("CREATE TABLE a"));
    }

    #[test]
    fn parse_chunks_skips_block_comments() {
        let schema = r"
            /* block ; comment */
            CREATE TABLE a (x INTEGER);
        ";
        let chunks = parse_schema_chunks(schema);
        assert_eq!(chunks.len(), 1);
    }

    #[test]
    fn extract_label_finds_table_name() {
        let chunk = SchemaChunk {
            label: extract_label("CREATE TABLE IF NOT EXISTS vision_embeddings (foo INTEGER)"),
            sql: String::new(),
        };
        assert_eq!(chunk.label, "table vision_embeddings");
    }

    #[test]
    fn extract_label_finds_index_name() {
        let label =
            extract_label("CREATE INDEX IF NOT EXISTS idx_lane_traces_lane ON lane_traces(lane);");
        assert_eq!(label, "index idx_lane_traces_lane");
    }

    #[test]
    fn fixture_drop_removes_files() {
        let path = {
            let f = DuckDbFixture::new("drop_test");
            let _ = std::fs::write(f.path(), b"sentinel").ok();
            assert!(f.path().exists());
            f.path().to_path_buf()
        };
        // After fixture drops, the file must be gone.
        assert!(!path.exists(), "DuckDbFixture did not clean up its file");
    }

    #[test]
    fn bisect_reports_sql_error_with_chunk_label() {
        // Last chunk has invalid SQL; harness must surface it.
        let bad_schema = r"
            CREATE TABLE good (x INTEGER);
            CREATE TABLE bad (BAD SYNTAX HERE);
        ";
        let report = bisect_schema("bad_schema_test", bad_schema);
        let failure = report
            .failure
            .as_ref()
            .expect("expected failure on the bad table");
        assert_eq!(failure.chunk.label, "table bad");
    }

    #[test]
    fn bisect_clean_schema_reports_all_passed() {
        let clean = r"
            CREATE TABLE alpha (id INTEGER);
            CREATE TABLE beta (id INTEGER);
        ";
        let report = bisect_schema("clean_test", clean);
        report.assert_clean();
        assert_eq!(report.passed, 2);
        assert_eq!(report.total, 2);
    }

    #[test]
    fn idempotent_load_passes_for_create_if_not_exists() {
        let schema = "CREATE TABLE IF NOT EXISTS k (id INTEGER);";
        assert_schema_idempotent("idempotent_test", schema).expect("should be idempotent");
    }

    #[test]
    fn idempotent_load_fails_when_create_lacks_if_not_exists() {
        let schema = "CREATE TABLE k (id INTEGER);";
        let err = assert_schema_idempotent("non_idempotent_test", schema).unwrap_err();
        let msg = format!("{err:#}");
        assert!(msg.contains("idempotency"), "unexpected error: {msg}");
    }
}
