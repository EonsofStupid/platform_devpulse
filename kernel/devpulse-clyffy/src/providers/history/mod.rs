//! Your sessions with each agent, found on this machine (plan 0009 R3a,
//! plan 0001 B5.1): bounded, read-only discovery and paging of the history
//! files Claude Code and Codex keep.
//!
//! Authored from your `dpl-chat-store`
//! (`recovered/devpulselabs/crates/chat/store/src/lib.rs`) onto `DevPulse`'s
//! [`ProviderId`]. Each provider's reader owns its format ([`claude`],
//! [`codex`]); this module owns the filesystem jail (nothing outside a
//! history root is read, symlinks are not followed), the resource ceilings,
//! opaque session identity, and cursor paging from the newest record back.
//! Where each provider keeps its history is its definition's `[history]`.

pub mod claude;
pub mod codex;
pub mod events;
mod record;

use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::ops::RangeInclusive;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};
use std::time::{SystemTime, UNIX_EPOCH};

use self::events::{
    BoundedNativePayload, ChatEvent, ChatEventContent, ChatEventId, ChatSessionId,
    ProviderSessionId, SessionGroup, SessionState, SessionSummary, TokenUsage, TurnId,
};
use crate::providers::ProviderId;
use crate::providers::definition::{HistoryFormat, HistorySpec, ProviderDefinition, expand};

/// Where a definition's history is on this machine: under the vendor's moved
/// home when its variable is set (`CLAUDE_CONFIG_DIR`, `CODEX_HOME`), else
/// its root, `~` expanded.
#[must_use]
pub fn root_of(spec: &HistorySpec, home: Option<&Path>) -> Option<PathBuf> {
    if let (Some(var), Some(subdir)) = (&spec.home_env, &spec.subdir)
        && let Some(moved) = std::env::var_os(var).filter(|v| !v.is_empty())
    {
        return Some(PathBuf::from(moved).join(subdir));
    }
    expand(&spec.root, home)
}

/// One provider's history, as looked for on this machine.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FoundSource {
    /// Whose.
    pub provider_id: ProviderId,
    /// The folder looked in; `None` when it could not be named (no home
    /// folder).
    pub root: Option<PathBuf>,
    /// The folder exists, so the provider has been used here.
    pub present: bool,
    /// Why it could not be read, when it could not.
    pub problem: Option<String>,
}

/// Every provider whose definition says where its history is, read from
/// this machine: refresh source configuration while retaining unchanged
/// sources and their indexes. Absent or changed sources are invalidated.
#[must_use]
pub fn catalog(
    catalog: &mut HistoryCatalog,
    definitions: &[ProviderDefinition],
    home: Option<&Path>,
    limits: HistoryLimits,
) -> Vec<FoundSource> {
    let mut found = Vec::new();
    for definition in definitions {
        let Some(spec) = &definition.history else {
            continue;
        };
        let root = root_of(spec, home);
        let present = root.as_deref().is_some_and(Path::is_dir);
        let mut problem = None;
        if let (true, Some(root)) = (present, root.as_deref()) {
            let limits = HistoryLimits {
                prefix_bytes: spec.prefix_bytes.unwrap_or(limits.prefix_bytes),
                ..limits
            };
            let opened = catalog.configure(definition.id, root, spec, limits);
            problem = opened.err().map(|e| e.to_string());
        } else if root.is_none() {
            problem = Some("the home folder is unknown".to_owned());
        }
        found.push(FoundSource {
            provider_id: definition.id,
            root,
            present,
            problem,
        });
    }
    catalog.sources.retain(|source| {
        found.iter().any(|report| {
            report.provider_id == source.provider_id() && report.present && report.problem.is_none()
        })
    });
    catalog.configurations.retain(|provider, _| {
        catalog
            .sources
            .iter()
            .any(|source| source.provider_id() == *provider)
    });
    found
}

/// The bytes a source may read from a file's start to name it.
pub const PREFIX_BYTES: RangeInclusive<usize> = 1024..=1024 * 1024;

/// The ceilings one history source works within.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HistoryLimits {
    /// Folder depth walked below the root.
    pub max_depth: u8,
    /// History files looked at.
    pub max_files: usize,
    /// Bytes read from a file's start to name it.
    pub prefix_bytes: usize,
    /// Bytes read per page.
    pub page_bytes: usize,
    /// Events per page.
    pub page_events: usize,
    /// The longest record read.
    pub max_line_bytes: usize,
}

impl Default for HistoryLimits {
    fn default() -> Self {
        Self {
            max_depth: 6,
            max_files: 512,
            prefix_bytes: 64 * 1024,
            page_bytes: 256 * 1024,
            page_events: 200,
            max_line_bytes: 1024 * 1024,
        }
    }
}

impl HistoryLimits {
    fn normalized(self) -> Self {
        Self {
            max_depth: self.max_depth.max(1),
            max_files: self.max_files.max(1),
            prefix_bytes: self
                .prefix_bytes
                .clamp(*PREFIX_BYTES.start(), *PREFIX_BYTES.end()),
            page_bytes: self.page_bytes.clamp(4 * 1024, 4 * 1024 * 1024),
            page_events: self.page_events.clamp(1, 1_000),
            max_line_bytes: self.max_line_bytes.clamp(4 * 1024, 4 * 1024 * 1024),
        }
    }
}

/// Evidence of who started a stored session, separate from its identity.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub enum HistorySessionKind {
    /// Positively identified as a session started by the person.
    UserStarted,
    /// Spawned by an agent, even when its parent cannot be identified.
    SubAgent,
    /// Incomplete or unrecognized metadata; not eligible for continuation.
    Unknown,
}

/// What a reader finds at the start of a history file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HistoryIndexMetadata {
    /// The provider's own session id.
    pub native_id: ProviderSessionId,
    /// How this session was started, independently of parent availability.
    pub kind: HistorySessionKind,
    /// Its parent's native id, not an artifact locator.
    pub parent_native_id: Option<ProviderSessionId>,
    /// Its first real request, or a fallback.
    pub title: String,
    /// The folder it ran in.
    pub workspace: String,
    /// When it started, as the provider wrote it.
    pub started_at: String,
}

/// One record, decoded.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DecodedHistoryEvent {
    /// The turn it belongs to, when the provider says.
    pub turn_id: Option<TurnId>,
    /// What happened.
    pub content: ChatEventContent,
}

/// What a reader made of one record.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DecodeOutcome {
    /// An event.
    Event(DecodedHistoryEvent),
    /// A record the reader knows and deliberately does not show.
    IgnoreKnown,
}

/// One provider's history format.
///
/// `Send` is a genuine requirement, not a formality: the host owns the
/// catalog and the host's shared state must be `Send`. A decoder is a pure
/// function over lines and a source is a path plus a decoder, so nothing
/// here is legitimately thread-bound.
pub trait HistoryDecoder: Send + Sync {
    /// Whose format it is.
    fn provider_id(&self) -> ProviderId;
    /// Name a session from its file's start.
    fn index_metadata(&self, path: &Path, prefix: &str) -> Option<HistoryIndexMetadata>;
    /// Decode one record.
    fn decode_line(&self, line: &str) -> DecodeOutcome;
}

/// What a provider is ABLE to report about token usage.
///
/// Declared, never discovered. This is the honesty mechanism: a surface
/// can say "Grok does not report an input/output split" instead of
/// rendering a silent zero, and a half-implemented provider stays legible
/// instead of looking broken.
#[allow(
    clippy::struct_excessive_bools,
    reason = "each flag is one independent fact a provider declares"
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct UsageReporting {
    /// Separate prompt and completion counts.
    pub input_output_split: bool,
    /// A single combined total.
    pub total_tokens: bool,
    /// Context-window occupancy (used / size).
    pub context_window: bool,
    /// The provider computes real money itself — trusted over our table.
    pub provider_priced: bool,
    /// The provider names the model it is running.
    pub model: bool,
    /// Counts are CUMULATIVE — each report restates the running total for
    /// the session (Codex's `total_token_usage`), so the last report is
    /// the whole picture and reports must NOT be summed. When false, each
    /// report covers one turn (Claude's per-message `usage`) and a
    /// session total is the SUM. Getting this backwards silently
    /// under- or over-counts real spend.
    pub counts_are_cumulative: bool,
    /// Usage can be recovered from ALREADY-STORED sessions, so the
    /// backfill pass can walk this provider's history and recover cost
    /// already spent. False for live-only transports.
    pub history_backfill: bool,
}

impl UsageReporting {
    /// A provider that reports nothing yet. A truthful state, not a bug —
    /// it makes "not implemented" legible and turns adding support into
    /// filling in one file rather than discovering an absence.
    pub const NOTHING: Self = Self {
        input_output_split: false,
        total_tokens: false,
        context_window: false,
        provider_priced: false,
        model: false,
        counts_are_cumulative: false,
        history_backfill: false,
    };

    /// It reports at least one count.
    #[must_use]
    pub const fn reports_anything(self) -> bool {
        self.input_output_split || self.total_tokens || self.context_window
    }
}

/// ONE provider's usage dialect.
///
/// Providers report different things, in different shapes, and CHANGE
/// them between releases. Each reader owns its own dialect so a new
/// provider — or a new release of an existing one — extends HERE without
/// touching any other provider's code.
pub trait ProviderUsage: Send + Sync {
    /// Whose dialect.
    fn provider_id(&self) -> ProviderId;

    /// What this provider can report. Callers consult this BEFORE
    /// treating an absent number as meaningful.
    fn reports(&self) -> UsageReporting;

    /// Token accounting carried by one native record, if any.
    fn usage_from_line(&self, line: &str) -> Option<TokenUsage>;

    /// The model named by one native record, if any.
    fn model_from_line(&self, _line: &str) -> Option<String> {
        None
    }

    /// Cost the PROVIDER itself computed, in micros. When a provider
    /// reports real money (Claude does), it is authoritative over any
    /// price table of ours — it knows its own billing, we infer it.
    fn cost_micros_from_line(&self, _line: &str) -> Option<u64> {
        None
    }
}

/// One stored session's recovered accounting.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SessionUsage {
    /// The provider's id for the session.
    pub native_id: ProviderSessionId,
    /// Merged across every record that carried accounting.
    pub usage: TokenUsage,
    /// The model it ran.
    pub model: Option<String>,
    /// Provider-reported money, when the provider prices itself.
    pub cost_micros: Option<u64>,
    /// How many records carried accounting — zero means this session had
    /// nothing to recover, which is a fact, not a failure.
    pub records: usize,
}

impl SessionUsage {
    /// Nothing to recover.
    #[must_use]
    pub const fn is_empty(&self) -> bool {
        self.records == 0
    }
}

/// Where the next older page ends.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HistoryCursor {
    before_byte: u64,
}

impl HistoryCursor {
    /// A cursor handed back by a caller (it is checked against the file).
    #[must_use]
    pub const fn before(before_byte: u64) -> Self {
        Self { before_byte }
    }

    /// The byte the next older page ends before.
    #[must_use]
    pub const fn before_byte(self) -> u64 {
        self.before_byte
    }
}

/// Opaque store-owned identity for one provider history artifact.
///
/// Provider-native session ids are metadata, not unique file locators: a
/// provider may persist the same logical session across multiple artifacts.
/// Callers can keep this value, but cannot use it to name arbitrary paths.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HistoryLocator(u64);

impl HistoryLocator {
    /// Its value (for a caller to hand back).
    #[must_use]
    pub const fn value(self) -> u64 {
        self.0
    }

    /// A locator handed back by a caller; it only names a file the source
    /// itself finds under its root.
    #[must_use]
    pub const fn from_value(value: u64) -> Self {
        Self(value)
    }
}

impl std::fmt::Display for HistoryLocator {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "history-{}", self.0)
    }
}

/// One found session.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IndexedSession {
    /// Where it is, opaquely.
    pub locator: HistoryLocator,
    /// As a list shows it.
    pub summary: SessionSummary,
    /// How this session was started.
    pub kind: HistorySessionKind,
    /// Its parent's native id, when the reader can establish it.
    pub parent_native_id: Option<ProviderSessionId>,
    /// When it started, as the provider wrote it.
    pub started_at: String,
    /// When its file last changed (Unix milliseconds).
    pub modified_millis: u64,
    /// Its file's size.
    pub source_bytes: u64,
}

/// Every session one provider has, newest first.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HistoryIndex {
    /// Whose.
    pub provider_id: ProviderId,
    /// The sessions.
    pub sessions: Vec<IndexedSession>,
    /// History files looked at.
    pub scanned_files: usize,
    /// Transcript prefixes actually read during this listing (cache misses).
    pub prefix_reads: usize,
    /// Transcript bytes actually read to index this listing.
    pub prefix_bytes: usize,
    /// A ceiling was reached; there are more.
    pub truncated: bool,
}

/// One page of a session, oldest event first.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HistoryPage {
    /// Whose.
    pub provider_id: ProviderId,
    /// Which session file.
    pub locator: HistoryLocator,
    /// `DevPulse`'s id for the session.
    pub session_id: ChatSessionId,
    /// The provider's id for it.
    pub native_id: ProviderSessionId,
    /// The events.
    pub events: Vec<ChatEvent>,
    /// Where the next older page ends, if there is one.
    pub next_cursor: Option<HistoryCursor>,
    /// The file's size.
    pub source_bytes: u64,
    /// Older events exist.
    pub truncated_before: bool,
}

/// Why history could not be read.
#[derive(Debug)]
pub enum StoreError {
    /// A provider's history cannot be read.
    SourceUnavailable {
        /// Whose.
        provider: ProviderId,
        /// Why.
        reason: String,
    },
    /// A provider's source was registered twice.
    DuplicateSource(ProviderId),
    /// No source is registered for the provider.
    UnknownSource(ProviderId),
    /// The root is not a readable folder.
    InvalidRoot(PathBuf),
    /// An entry resolves outside its root.
    EscapedRoot(PathBuf),
    /// No such session.
    SessionMissing {
        /// Whose.
        provider: ProviderId,
        /// Which.
        locator: HistoryLocator,
    },
    /// The session's file shrank while it was being paged.
    SessionChanged {
        /// Which.
        native_id: ProviderSessionId,
    },
    /// A record exceeds the line ceiling.
    RecordTooLarge {
        /// Which session.
        native_id: ProviderSessionId,
        /// Where.
        at_byte: u64,
        /// The ceiling.
        limit: usize,
    },
    /// Two files produced the same identity.
    IdentityCollision {
        /// Whose.
        provider: ProviderId,
        /// The identity.
        session_id: ChatSessionId,
    },
    /// The filesystem said no.
    Io {
        /// Doing what.
        operation: &'static str,
        /// What it said.
        message: String,
    },
}

impl std::fmt::Display for StoreError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::SourceUnavailable { provider, reason } => {
                write!(f, "{} history is unavailable: {reason}", provider.key())
            }
            Self::DuplicateSource(provider) => {
                write!(f, "history source {} was registered twice", provider.key())
            }
            Self::UnknownSource(provider) => {
                write!(f, "history source {} is not registered", provider.key())
            }
            Self::InvalidRoot(path) => {
                write!(
                    f,
                    "history root is not a readable directory: {}",
                    path.display()
                )
            }
            Self::EscapedRoot(path) => {
                write!(
                    f,
                    "history entry escapes its canonical root: {}",
                    path.display()
                )
            }
            Self::SessionMissing { provider, locator } => {
                write!(f, "{} {locator} is not available", provider.key())
            }
            Self::SessionChanged { native_id } => {
                write!(
                    f,
                    "session {:?} changed while it was being paged",
                    native_id.0
                )
            }
            Self::RecordTooLarge {
                native_id,
                at_byte,
                limit,
            } => write!(
                f,
                "session {:?} has a record larger than {limit} bytes near byte {at_byte}",
                native_id.0
            ),
            Self::IdentityCollision {
                provider,
                session_id,
            } => write!(
                f,
                "{} history produced duplicate identity {session_id}",
                provider.key()
            ),
            Self::Io { operation, message } => write!(f, "{operation}: {message}"),
        }
    }
}

impl std::error::Error for StoreError {}

/// One provider's history.
pub trait HistorySource: Send + Sync {
    /// Whose.
    fn provider_id(&self) -> ProviderId;
    /// Every session, newest first; `workspace_filter` keeps those whose
    /// folder contains it (any case).
    ///
    /// # Errors
    /// When the history cannot be read.
    fn list(&self, workspace_filter: Option<&str>) -> Result<HistoryIndex, StoreError>;
    /// One page of a session, ending before `cursor` (the newest page when
    /// `None`).
    ///
    /// # Errors
    /// When the session is gone, changed, or cannot be read.
    fn page(
        &self,
        locator: HistoryLocator,
        cursor: Option<HistoryCursor>,
    ) -> Result<HistoryPage, StoreError>;
}

struct ReadJail {
    canonical_root: PathBuf,
}

impl ReadJail {
    fn open(root: impl AsRef<Path>) -> Result<Self, StoreError> {
        let root = root.as_ref();
        if !root.is_dir() {
            return Err(StoreError::InvalidRoot(root.to_path_buf()));
        }
        let canonical_root = root.canonicalize().map_err(|error| StoreError::Io {
            operation: "canonicalize history root",
            message: error.to_string(),
        })?;
        Ok(Self { canonical_root })
    }

    fn checked_file(&self, path: &Path) -> Result<PathBuf, StoreError> {
        let canonical = path.canonicalize().map_err(|error| StoreError::Io {
            operation: "canonicalize history entry",
            message: error.to_string(),
        })?;
        if !canonical.starts_with(&self.canonical_root) {
            return Err(StoreError::EscapedRoot(canonical));
        }
        Ok(canonical)
    }

    fn jsonl_files(&self, limits: HistoryLimits) -> Result<(Vec<PathBuf>, bool), StoreError> {
        let mut files = Vec::new();
        let mut truncated = false;
        self.walk(
            &self.canonical_root,
            limits.max_depth,
            limits.max_files,
            &mut files,
            &mut truncated,
        )?;
        Ok((files, truncated))
    }

    fn walk(
        &self,
        directory: &Path,
        depth: u8,
        max_files: usize,
        files: &mut Vec<PathBuf>,
        truncated: &mut bool,
    ) -> Result<(), StoreError> {
        if depth == 0 || *truncated {
            return Ok(());
        }
        let entries = std::fs::read_dir(directory).map_err(|error| StoreError::Io {
            operation: "read history directory",
            message: error.to_string(),
        })?;
        let mut entries =
            entries
                .collect::<Result<Vec<_>, _>>()
                .map_err(|error| StoreError::Io {
                    operation: "read history entry",
                    message: error.to_string(),
                })?;
        entries.sort_by_key(|right| std::cmp::Reverse(right.file_name()));
        for entry in entries {
            let file_type = entry.file_type().map_err(|error| StoreError::Io {
                operation: "inspect history entry",
                message: error.to_string(),
            })?;
            if file_type.is_symlink() {
                continue;
            }
            let path = entry.path();
            if file_type.is_dir() {
                let canonical = path.canonicalize().map_err(|error| StoreError::Io {
                    operation: "canonicalize history directory",
                    message: error.to_string(),
                })?;
                if !canonical.starts_with(&self.canonical_root) {
                    return Err(StoreError::EscapedRoot(canonical));
                }
                self.walk(&canonical, depth - 1, max_files, files, truncated)?;
            } else if file_type.is_file()
                && path.extension().and_then(|value| value.to_str()) == Some("jsonl")
            {
                if files.len() == max_files {
                    *truncated = true;
                    return Ok(());
                }
                files.push(self.checked_file(&path)?);
            }
        }
        Ok(())
    }
}

/// A provider's history as JSON-lines files under one root.
pub struct JsonlHistorySource {
    jail: ReadJail,
    decoder: Box<dyn HistoryDecoder>,
    limits: HistoryLimits,
    index: Mutex<HashMap<PathBuf, CachedMetadata>>,
}

/// Full filesystem timestamps, not the rounded timestamp displayed by the UI.
/// A rewrite preserving size and all timestamps cannot be detected without
/// reading content; this index does not claim content-hash freshness.
#[derive(Clone, PartialEq, Eq)]
struct FileFingerprint {
    bytes: u64,
    modified: SystemTime,
    created: Option<SystemTime>,
}

impl FileFingerprint {
    fn read(path: &Path) -> Result<Self, StoreError> {
        let metadata = std::fs::metadata(path).map_err(|error| StoreError::Io {
            operation: "inspect history file",
            message: error.to_string(),
        })?;
        Ok(Self {
            bytes: metadata.len(),
            modified: metadata.modified().map_err(|error| StoreError::Io {
                operation: "read history modification time",
                message: error.to_string(),
            })?,
            created: metadata.created().ok(),
        })
    }
}

#[derive(Clone)]
struct CachedMetadata {
    fingerprint: FileFingerprint,
    metadata: Option<HistoryIndexMetadata>,
}

#[derive(Default)]
struct PrefixReads {
    files: usize,
    bytes: usize,
}

impl JsonlHistorySource {
    /// The history under `root`, read with `decoder`.
    ///
    /// # Errors
    /// When `root` is not a readable folder.
    pub fn open(
        root: impl AsRef<Path>,
        decoder: impl HistoryDecoder + 'static,
        limits: HistoryLimits,
    ) -> Result<Self, StoreError> {
        Ok(Self {
            jail: ReadJail::open(root)?,
            decoder: Box::new(decoder),
            limits: limits.normalized(),
            index: Mutex::default(),
        })
    }

    fn index(&self) -> Result<MutexGuard<'_, HashMap<PathBuf, CachedMetadata>>, StoreError> {
        self.index
            .lock()
            .map_err(|error| StoreError::SourceUnavailable {
                provider: self.provider_id(),
                reason: format!("history index lock poisoned: {error}"),
            })
    }

    fn files(
        &self,
        index: &mut HashMap<PathBuf, CachedMetadata>,
    ) -> Result<(Vec<PathBuf>, bool), StoreError> {
        let inventory = self.jail.jsonl_files(self.limits);
        match &inventory {
            Ok((files, _)) => {
                let present: HashSet<_> = files.iter().collect();
                index.retain(|path, _| present.contains(path));
            }
            Err(_) => index.clear(),
        }
        inventory
    }

    fn metadata_for(
        &self,
        path: &Path,
        index: &mut HashMap<PathBuf, CachedMetadata>,
        reads: &mut PrefixReads,
    ) -> Result<CachedMetadata, StoreError> {
        for _ in 0..2 {
            // A cached path is never permission to bypass the read jail.
            self.jail.checked_file(path)?;
            let fingerprint = FileFingerprint::read(path)?;
            if let Some(cached) = index.get(path).filter(|c| c.fingerprint == fingerprint) {
                return Ok(cached.clone());
            }
            index.remove(path);
            let prefix = read_prefix(path, self.limits.prefix_bytes)?;
            reads.files += 1;
            reads.bytes += prefix.len();
            let metadata = self
                .decoder
                .index_metadata(path, &String::from_utf8_lossy(&prefix));
            self.jail.checked_file(path)?;
            if FileFingerprint::read(path)? != fingerprint {
                continue;
            }
            let cached = CachedMetadata {
                fingerprint,
                metadata,
            };
            index.insert(path.to_path_buf(), cached.clone());
            return Ok(cached);
        }
        Err(StoreError::SourceUnavailable {
            provider: self.provider_id(),
            reason: "a history file kept changing while its prefix was read; retry the listing"
                .into(),
        })
    }

    /// Recover one stored session's accounting.
    ///
    /// Walks records already on disk through the provider's own usage
    /// dialect, inside this source's jail, so past cost already spent
    /// becomes queryable without re-running anything. Merges field-by-field
    /// across the session: providers report usage in pieces, and the last
    /// word on each field wins.
    ///
    /// # Errors
    /// When the session is gone or cannot be read.
    pub fn scan_usage(
        &self,
        locator: HistoryLocator,
        usage: &dyn ProviderUsage,
    ) -> Result<SessionUsage, StoreError> {
        let cumulative = usage.reports().counts_are_cumulative;
        let (path, metadata) = self.resolve(locator)?;
        let mut file = File::open(&path).map_err(|error| StoreError::Io {
            operation: "open history file for usage scan",
            message: error.to_string(),
        })?;
        let mut raw = String::new();
        file.read_to_string(&mut raw)
            .map_err(|error| StoreError::Io {
                operation: "read history file for usage scan",
                message: error.to_string(),
            })?;

        let mut out = SessionUsage {
            native_id: metadata.native_id,
            usage: TokenUsage::default(),
            model: None,
            cost_micros: None,
            records: 0,
        };
        for line in raw.lines() {
            // The same ceiling the paging path honours — one pathological
            // line never becomes unbounded work.
            if line.len() > self.limits.max_line_bytes {
                continue;
            }
            let mut carried = false;
            if let Some(found) = usage.usage_from_line(line) {
                out.usage = if cumulative {
                    // Each report restates the running total — the last
                    // word is the whole session.
                    out.usage.merge(found)
                } else {
                    // Each report covers one turn — the session is the sum.
                    out.usage.accumulate(found)
                };
                carried = true;
            }
            if let Some(model) = usage.model_from_line(line) {
                out.model = Some(model);
                carried = true;
            }
            // Provider-reported money is cumulative per session; the last
            // statement is the whole bill, not one to sum.
            if let Some(cost) = usage.cost_micros_from_line(line) {
                out.cost_micros = Some(cost);
                carried = true;
            }
            if carried {
                out.records += 1;
            }
        }
        Ok(out)
    }

    fn resolve(
        &self,
        locator: HistoryLocator,
    ) -> Result<(PathBuf, HistoryIndexMetadata), StoreError> {
        let mut index = self.index()?;
        let (files, _) = self.files(&mut index)?;
        let mut reads = PrefixReads::default();
        for path in files {
            if self.locator_for(&path)? != locator {
                continue;
            }
            if let Some(metadata) = self.metadata_for(&path, &mut index, &mut reads)?.metadata {
                return Ok((path, metadata));
            }
        }
        Err(StoreError::SessionMissing {
            provider: self.provider_id(),
            locator,
        })
    }

    /// Read back from `before` to the start of a record: the window grows
    /// (up to the line ceiling) until it holds a record boundary. Returns
    /// where the window's first whole record starts in the file, the bytes,
    /// and that record's offset within them.
    fn aligned_window(
        &self,
        file: &mut File,
        before: u64,
        native_id: &ProviderSessionId,
    ) -> Result<(u64, Vec<u8>, usize), StoreError> {
        let mut window_bytes = self.limits.page_bytes;
        loop {
            let requested_start = before.saturating_sub(window_bytes as u64);
            file.seek(SeekFrom::Start(requested_start))
                .map_err(|error| StoreError::Io {
                    operation: "seek history page",
                    message: error.to_string(),
                })?;
            let byte_count = (before - requested_start) as usize;
            let mut buffer = vec![0_u8; byte_count];
            file.read_exact(&mut buffer)
                .map_err(|error| StoreError::Io {
                    operation: "read history page",
                    message: error.to_string(),
                })?;
            if requested_start == 0 {
                return Ok((0, buffer, 0));
            }
            if let Some(newline) = buffer.iter().position(|byte| *byte == b'\n') {
                let offset = newline + 1;
                return Ok((requested_start + offset as u64, buffer, offset));
            }
            if window_bytes == self.limits.max_line_bytes {
                return Err(StoreError::RecordTooLarge {
                    native_id: native_id.clone(),
                    at_byte: requested_start,
                    limit: self.limits.max_line_bytes,
                });
            }
            window_bytes = window_bytes
                .saturating_mul(2)
                .min(self.limits.max_line_bytes);
        }
    }

    fn locator_for(&self, path: &Path) -> Result<HistoryLocator, StoreError> {
        let relative = path
            .strip_prefix(&self.jail.canonical_root)
            .map_err(|_| StoreError::EscapedRoot(path.to_path_buf()))?;
        let normalized = relative
            .components()
            .map(|component| component.as_os_str().to_string_lossy())
            .collect::<Vec<_>>()
            .join("/");
        // Windows paths are case-insensitive; lowercase only there.
        #[cfg(windows)]
        let normalized = normalized.to_ascii_lowercase();
        // A locator is scoped to its source: changing the configured root
        // must never make an old card resolve to an unrelated transcript.
        // Keep native path bytes so non-Unicode roots remain distinct.
        let root = self.jail.canonical_root.as_os_str().as_encoded_bytes();
        #[cfg(windows)]
        let root = root.to_ascii_lowercase();
        #[cfg(windows)]
        let root = root.as_slice();
        Ok(HistoryLocator(stable_hash(&[
            self.provider_id().key().as_bytes(),
            b"\0history\0",
            root,
            b"\0",
            normalized.as_bytes(),
        ])))
    }
}

impl HistorySource for JsonlHistorySource {
    fn provider_id(&self) -> ProviderId {
        self.decoder.provider_id()
    }

    fn list(&self, workspace_filter: Option<&str>) -> Result<HistoryIndex, StoreError> {
        // One source refresh at a time: callers share parsed prefixes, even
        // when several windows request their initial listing concurrently.
        let mut index = self.index()?;
        let (files, truncated) = self.files(&mut index)?;
        let mut reads = PrefixReads::default();
        let scanned_files = files.len();
        let normalized_filter = workspace_filter.map(str::to_lowercase);
        let mut sessions = Vec::new();
        let mut ids = HashSet::new();

        for path in files {
            let cached = self.metadata_for(&path, &mut index, &mut reads)?;
            let Some(metadata) = cached.metadata else {
                continue;
            };
            if normalized_filter
                .as_ref()
                .is_some_and(|filter| !metadata.workspace.to_lowercase().contains(filter.as_str()))
            {
                continue;
            }
            let locator = self.locator_for(&path)?;
            let session_id = stable_session_id(self.provider_id(), locator);
            if !ids.insert(session_id) {
                return Err(StoreError::IdentityCollision {
                    provider: self.provider_id(),
                    session_id,
                });
            }
            let modified_millis = cached
                .fingerprint
                .modified
                .duration_since(UNIX_EPOCH)
                .ok()
                .map_or(0, |duration| duration.as_millis() as u64);
            sessions.push(IndexedSession {
                locator,
                kind: metadata.kind,
                parent_native_id: metadata.parent_native_id,
                summary: SessionSummary {
                    id: session_id,
                    provider_id: self.provider_id(),
                    provider_session_id: Some(metadata.native_id),
                    title: metadata.title,
                    workspace: metadata.workspace,
                    group: SessionGroup::Recent,
                    state: SessionState::ReadOnly,
                },
                started_at: metadata.started_at,
                modified_millis,
                source_bytes: cached.fingerprint.bytes,
            });
        }
        // Newest first — `Reverse` says descending in the signature rather
        // than by which side of `cmp` the arguments landed on.
        sessions.sort_by_key(|s| std::cmp::Reverse(s.modified_millis));
        Ok(HistoryIndex {
            provider_id: self.provider_id(),
            sessions,
            scanned_files,
            prefix_reads: reads.files,
            prefix_bytes: reads.bytes,
            truncated,
        })
    }

    fn page(
        &self,
        locator: HistoryLocator,
        cursor: Option<HistoryCursor>,
    ) -> Result<HistoryPage, StoreError> {
        let (path, metadata) = self.resolve(locator)?;
        let native_id = metadata.native_id;
        let mut file = File::open(&path).map_err(|error| StoreError::Io {
            operation: "open history file",
            message: error.to_string(),
        })?;
        let source_bytes = file
            .metadata()
            .map_err(|error| StoreError::Io {
                operation: "inspect history file",
                message: error.to_string(),
            })?
            .len();
        let before = cursor.map_or(source_bytes, |value| value.before_byte);
        if before > source_bytes {
            return Err(StoreError::SessionChanged {
                native_id: native_id.clone(),
            });
        }

        let (aligned_start, buffer, data_offset) =
            self.aligned_window(&mut file, before, &native_id)?;
        let data = &buffer[data_offset..];

        let records = line_records(data, aligned_start);
        let session_id = stable_session_id(self.provider_id(), locator);
        let mut events = Vec::new();
        let mut next_before = if aligned_start > 0 {
            Some(aligned_start)
        } else {
            None
        };

        for record in records.iter().rev() {
            if record.bytes.len() > self.limits.max_line_bytes {
                return Err(StoreError::RecordTooLarge {
                    native_id: native_id.clone(),
                    at_byte: record.offset,
                    limit: self.limits.max_line_bytes,
                });
            }
            let outcome = match std::str::from_utf8(record.bytes) {
                Ok(line) => self.decoder.decode_line(line),
                Err(_) => DecodeOutcome::Event(DecodedHistoryEvent {
                    turn_id: None,
                    content: ChatEventContent::Unknown(BoundedNativePayload::redacted(
                        "invalid-utf8",
                        format!("invalid UTF-8 record at byte {}", record.offset),
                    )),
                }),
            };
            if let DecodeOutcome::Event(decoded) = outcome {
                events.push(ChatEvent {
                    id: stable_event_id(self.provider_id(), locator, record.offset),
                    provider_id: self.provider_id(),
                    session_id,
                    turn_id: decoded.turn_id,
                    content: decoded.content,
                });
                if events.len() == self.limits.page_events {
                    next_before = Some(record.offset);
                    break;
                }
            }
        }
        events.reverse();
        let next_cursor = next_before
            .filter(|offset| *offset > 0)
            .map(|before_byte| HistoryCursor { before_byte });
        Ok(HistoryPage {
            provider_id: self.provider_id(),
            locator,
            session_id,
            native_id,
            events,
            next_cursor,
            source_bytes,
            truncated_before: next_cursor.is_some(),
        })
    }
}

/// Every provider's history, one source each.
/// Clones share sources and their caches; configuration refresh changes only
/// the catalog being refreshed, so in-flight readers retain their snapshot.
#[derive(Clone, Default)]
pub struct HistoryCatalog {
    sources: Vec<Arc<dyn HistorySource>>,
    configurations: HashMap<ProviderId, SourceConfiguration>,
}

#[derive(Clone, PartialEq, Eq)]
struct SourceConfiguration {
    canonical_root: PathBuf,
    created: Option<SystemTime>,
    spec: HistorySpec,
    limits: HistoryLimits,
}

impl HistoryCatalog {
    /// Add a provider's source.
    ///
    /// # Errors
    /// When the provider already has one.
    pub fn register(&mut self, source: impl HistorySource + 'static) -> Result<(), StoreError> {
        let provider = source.provider_id();
        if self
            .sources
            .iter()
            .any(|existing| existing.provider_id() == provider)
        {
            return Err(StoreError::DuplicateSource(provider));
        }
        self.sources.push(Arc::new(source));
        Ok(())
    }

    fn configure(
        &mut self,
        provider: ProviderId,
        root: &Path,
        spec: &HistorySpec,
        limits: HistoryLimits,
    ) -> Result<(), StoreError> {
        let jail = ReadJail::open(root)?;
        let configuration = SourceConfiguration {
            created: std::fs::metadata(&jail.canonical_root)
                .ok()
                .and_then(|m| m.created().ok()),
            canonical_root: jail.canonical_root,
            spec: spec.clone(),
            limits: limits.normalized(),
        };
        if self.configurations.get(&provider) == Some(&configuration) {
            return Ok(());
        }
        self.sources
            .retain(|source| source.provider_id() != provider);
        self.configurations.remove(&provider);
        match spec.format {
            HistoryFormat::ClaudeCode => self.register(JsonlHistorySource::open(
                root,
                claude::ClaudeHistoryDecoder,
                limits,
            )?)?,
            HistoryFormat::Codex => self.register(JsonlHistorySource::open(
                root,
                codex::CodexHistoryDecoder,
                limits,
            )?)?,
        }
        self.configurations.insert(provider, configuration);
        Ok(())
    }

    /// The provider has a source.
    #[must_use]
    pub fn has_source(&self, provider: ProviderId) -> bool {
        self.sources
            .iter()
            .any(|source| source.provider_id() == provider)
    }

    /// The providers with a source.
    pub fn provider_ids(&self) -> impl Iterator<Item = ProviderId> + '_ {
        self.sources.iter().map(|source| source.provider_id())
    }

    /// One provider's sessions.
    ///
    /// # Errors
    /// When it has no source, or its history cannot be read.
    pub fn list(
        &self,
        provider: ProviderId,
        workspace_filter: Option<&str>,
    ) -> Result<HistoryIndex, StoreError> {
        self.source(provider)?.list(workspace_filter)
    }

    /// One page of one provider's session.
    ///
    /// # Errors
    /// When it has no source, or the session cannot be read.
    pub fn page(
        &self,
        provider: ProviderId,
        locator: HistoryLocator,
        cursor: Option<HistoryCursor>,
    ) -> Result<HistoryPage, StoreError> {
        self.source(provider)?.page(locator, cursor)
    }

    fn source(&self, provider: ProviderId) -> Result<&dyn HistorySource, StoreError> {
        self.sources
            .iter()
            .find(|source| source.provider_id() == provider)
            .map(AsRef::as_ref)
            .ok_or(StoreError::UnknownSource(provider))
    }
}

struct LineRecord<'a> {
    offset: u64,
    bytes: &'a [u8],
}

fn line_records(data: &[u8], base_offset: u64) -> Vec<LineRecord<'_>> {
    let mut records = Vec::new();
    let mut start = 0;
    for (index, byte) in data.iter().enumerate() {
        if *byte == b'\n' {
            let mut end = index;
            if end > start && data[end - 1] == b'\r' {
                end -= 1;
            }
            if end > start {
                records.push(LineRecord {
                    offset: base_offset + start as u64,
                    bytes: &data[start..end],
                });
            }
            start = index + 1;
        }
    }
    if start < data.len() {
        records.push(LineRecord {
            offset: base_offset + start as u64,
            bytes: &data[start..],
        });
    }
    records
}

fn read_prefix(path: &Path, limit: usize) -> Result<Vec<u8>, StoreError> {
    let file = File::open(path).map_err(|error| StoreError::Io {
        operation: "open history prefix",
        message: error.to_string(),
    })?;
    let mut bytes = Vec::new();
    file.take(limit as u64)
        .read_to_end(&mut bytes)
        .map_err(|error| StoreError::Io {
            operation: "read history prefix",
            message: error.to_string(),
        })?;
    Ok(bytes)
}

fn stable_session_id(provider: ProviderId, locator: HistoryLocator) -> ChatSessionId {
    ChatSessionId(stable_hash(&[
        provider.key().as_bytes(),
        b"\0session\0",
        &locator.0.to_le_bytes(),
    ]))
}

fn stable_event_id(provider: ProviderId, locator: HistoryLocator, byte_offset: u64) -> ChatEventId {
    ChatEventId(stable_hash(&[
        provider.key().as_bytes(),
        b"\0event\0",
        &locator.0.to_le_bytes(),
        &byte_offset.to_le_bytes(),
    ]))
}

/// FNV-1a over the parts: stable across runs and machines.
fn stable_hash(parts: &[&[u8]]) -> u64 {
    let mut hash = 0xcbf2_9ce4_8422_2325_u64;
    for part in parts {
        for byte in *part {
            hash ^= u64::from(*byte);
            hash = hash.wrapping_mul(0x0100_0000_01b3);
        }
    }
    hash
}

#[cfg(test)]
mod tests {
    #![allow(clippy::expect_used, clippy::unwrap_used, reason = "test assertions")]

    use super::*;
    use std::fmt::Write as _;
    use std::fs;
    use std::sync::atomic::{AtomicU64, Ordering};

    const TEST_PROVIDER: ProviderId = ProviderId::ClaudeCode;

    struct FixtureDecoder;

    impl HistoryDecoder for FixtureDecoder {
        fn provider_id(&self) -> ProviderId {
            TEST_PROVIDER
        }

        fn index_metadata(&self, path: &Path, _prefix: &str) -> Option<HistoryIndexMetadata> {
            Some(HistoryIndexMetadata {
                native_id: ProviderSessionId(path.file_stem()?.to_string_lossy().into_owned()),
                kind: HistorySessionKind::Unknown,
                parent_native_id: None,
                title: path.file_stem()?.to_string_lossy().into_owned(),
                workspace: "C:/fixture".into(),
                started_at: "2026-07-23T00:00:00Z".into(),
            })
        }

        fn decode_line(&self, line: &str) -> DecodeOutcome {
            DecodeOutcome::Event(DecodedHistoryEvent {
                turn_id: None,
                content: ChatEventContent::AssistantMessage(line.to_owned()),
            })
        }
    }

    struct TestTree {
        root: PathBuf,
    }

    impl TestTree {
        fn new() -> Self {
            static NEXT: AtomicU64 = AtomicU64::new(1);
            let id = NEXT.fetch_add(1, Ordering::Relaxed);
            let root =
                std::env::temp_dir().join(format!("devpulse-history-{}-{id}", std::process::id()));
            fs::create_dir_all(&root).expect("create test tree");
            Self { root }
        }
    }

    impl Drop for TestTree {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    fn source(tree: &TestTree, page_events: usize) -> JsonlHistorySource {
        JsonlHistorySource::open(
            &tree.root,
            FixtureDecoder,
            HistoryLimits {
                page_events,
                page_bytes: 4 * 1024,
                ..HistoryLimits::default()
            },
        )
        .expect("open fixture history")
    }

    fn definition(id: &str, format: &str, root: &Path) -> ProviderDefinition {
        ProviderDefinition::parse(&format!(
            "id = \"{id}\"\n[detect]\nexecutables = [\"x\"]\n[history]\nformat = \"{format}\"\nroot = {:?}\n",
            root.display().to_string()
        ))
        .unwrap()
    }

    #[test]
    fn cached_parent_metadata_refreshes_without_merging_artifacts() {
        let tree = TestTree::new();
        let path = tree.root.join("child.jsonl");
        let prefix = "{\"isSidechain\":true,\"sessionId\":\"parent\"}\n";
        fs::write(&path, prefix).expect("child");
        let source = JsonlHistorySource::open(
            &tree.root,
            claude::ClaudeHistoryDecoder,
            HistoryLimits::default(),
        )
        .expect("source");
        let first = source.list(None).expect("first");
        assert_eq!(first.sessions[0].kind, HistorySessionKind::SubAgent);
        assert_eq!(
            first.sessions[0].parent_native_id,
            Some(ProviderSessionId("parent".into()))
        );
        let cached = source.list(None).expect("cached");
        assert_eq!(cached.prefix_reads, 0);
        assert_eq!(cached.sessions, first.sessions);
        fs::write(&path, prefix.replace("parent", "other-parent")).expect("update");
        let refreshed = source.list(None).expect("refresh");
        assert_eq!(refreshed.prefix_reads, 1);
        assert_eq!(refreshed.sessions[0].locator, first.sessions[0].locator);
        assert_eq!(
            refreshed.sessions[0].parent_native_id,
            Some(ProviderSessionId("other-parent".into()))
        );
    }

    #[test]
    fn a_definition_reads_only_its_own_providers_history() {
        let err = ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[history]\nformat = \"claude-code\"\nroot = \"~/.claude/projects\"\n",
        )
        .expect_err("refused");
        assert!(
            format!("{err:#}").contains("claude-code's files"),
            "{err:#}"
        );
        assert!(ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[history]\nformat = \"codex\"\nroot = \"~/.codex/sessions\"\nhome_env = \"CODEX_HOME\"\n",
        )
        .is_err(), "home_env without subdir");
        let err = ProviderDefinition::parse(
            "id = \"codex\"\n[detect]\nexecutables = [\"codex\"]\n[history]\nformat = \"codex\"\nroot = \"~/.codex/sessions\"\nprefix_bytes = 8388608\n",
        )
        .expect_err("past the ceiling");
        assert!(
            format!("{err:#}").contains("history.prefix_bytes is 8388608"),
            "{err:#}"
        );
    }

    #[test]
    fn a_request_behind_long_instructions_is_reached_by_the_definitions_prefix() {
        let tree = TestTree::new();
        let instructions = "x".repeat(100 * 1024);
        fs::write(
            tree.root.join("rollout-01a15559-e2ce-7360-b81d-1bc44c6328d4.jsonl"),
            format!(
                "{{\"type\":\"session_meta\",\"payload\":{{\"id\":\"01a15559-e2ce-7360-b81d-1bc44c6328d4\",\"cwd\":\"C:/rrflow\"}}}}\n\
                 {{\"type\":\"response_item\",\"payload\":{{\"type\":\"message\",\"role\":\"developer\",\"content\":[{{\"type\":\"input_text\",\"text\":\"{instructions}\"}}]}}}}\n\
                 {{\"type\":\"response_item\",\"payload\":{{\"type\":\"message\",\"role\":\"user\",\"content\":[{{\"type\":\"input_text\",\"text\":\"Wire the board\"}}]}}}}\n"
            ),
        )
        .unwrap();
        let title = |extra: &str| {
            let definition = ProviderDefinition::parse(&format!(
                "id = \"codex\"\n[detect]\nexecutables = [\"x\"]\n[history]\nformat = \"codex\"\nroot = {:?}\n{extra}",
                tree.root.display().to_string()
            ))
            .unwrap();
            let mut catalog = HistoryCatalog::default();
            let found = super::catalog(&mut catalog, &[definition], None, HistoryLimits::default());
            assert!(found.iter().all(|source| source.problem.is_none()));
            let index = catalog.list(ProviderId::Codex, None).unwrap();
            index.sessions[0].summary.title.clone()
        };
        assert_eq!(
            title(""),
            "Codex · rrflow",
            "64 KiB stops inside the instructions"
        );
        assert_eq!(title("prefix_bytes = 524288\n"), "Wire the board");
    }

    #[test]
    fn the_catalog_holds_the_histories_this_machine_has() {
        let tree = TestTree::new();
        let claude_root = tree.root.join("projects");
        fs::create_dir_all(claude_root.join("C--repo")).unwrap();
        fs::write(
            claude_root.join("C--repo").join("s-1.jsonl"),
            "{\"type\":\"user\",\"cwd\":\"C:/repo\",\"message\":{\"content\":\"Ship it\"}}\n",
        )
        .unwrap();
        let definitions = [
            definition("claude-code", "claude-code", &claude_root),
            definition("codex", "codex", &tree.root.join("never-used")),
        ];
        let mut catalog = HistoryCatalog::default();
        let found = super::catalog(&mut catalog, &definitions, None, HistoryLimits::default());
        assert!(catalog.has_source(ProviderId::ClaudeCode));
        assert!(
            !catalog.has_source(ProviderId::Codex),
            "no folder, no source"
        );
        assert!(found.iter().all(|f| f.problem.is_none()), "{found:?}");
        assert!(
            found
                .iter()
                .any(|f| f.provider_id == ProviderId::Codex && !f.present)
        );
        let index = catalog.list(ProviderId::ClaudeCode, None).unwrap();
        assert_eq!(index.sessions.len(), 1);
        assert_eq!(index.sessions[0].summary.title, "Ship it");
        assert_eq!(index.sessions[0].summary.workspace, "C:/repo");
    }

    #[test]
    fn discovery_and_pages_are_bounded_and_stable() {
        let tree = TestTree::new();
        fs::write(tree.root.join("session-a.jsonl"), "one\ntwo\nthree\nfour\n")
            .expect("write fixture");
        let source = source(&tree, 2);
        let index = source.list(None).expect("list");
        assert_eq!(index.sessions.len(), 1);
        let locator = index.sessions[0].locator;

        let newest = source.page(locator, None).expect("newest page");
        assert_eq!(newest.events.len(), 2);
        assert!(newest.truncated_before);
        let older = source
            .page(locator, newest.next_cursor)
            .expect("older page");
        assert_eq!(older.events.len(), 2);
        assert!(!older.truncated_before);

        let all: Vec<_> = older
            .events
            .iter()
            .chain(newest.events.iter())
            .map(|event| match &event.content {
                ChatEventContent::AssistantMessage(text) => text.as_str(),
                _ => panic!("unexpected event"),
            })
            .collect();
        assert_eq!(all, ["one", "two", "three", "four"]);
        assert_ne!(older.events[0].id, newest.events[0].id);
    }

    #[test]
    fn cursors_fail_when_a_file_shrinks() {
        let tree = TestTree::new();
        let path = tree.root.join("session-a.jsonl");
        fs::write(&path, "one\ntwo\nthree\n").expect("write fixture");
        let source = source(&tree, 1);
        let locator = source.list(None).expect("index").sessions[0].locator;
        let page = source.page(locator, None).expect("page");
        fs::write(path, "one\n").expect("shrink fixture");
        assert!(matches!(
            source.page(locator, page.next_cursor),
            Err(StoreError::SessionChanged { .. })
        ));
    }

    #[test]
    fn catalogs_reject_duplicate_provider_sources() {
        let left = TestTree::new();
        let right = TestTree::new();
        let mut catalog = HistoryCatalog::default();
        catalog.register(source(&left, 2)).expect("first");
        assert!(matches!(
            catalog.register(source(&right, 2)),
            Err(StoreError::DuplicateSource(TEST_PROVIDER))
        ));
    }

    #[test]
    fn file_count_limits_report_truncation() {
        let tree = TestTree::new();
        fs::write(tree.root.join("a.jsonl"), "a\n").expect("a");
        fs::write(tree.root.join("b.jsonl"), "b\n").expect("b");
        let source = JsonlHistorySource::open(
            &tree.root,
            FixtureDecoder,
            HistoryLimits {
                max_files: 1,
                ..HistoryLimits::default()
            },
        )
        .expect("source");
        let index = source.list(None).expect("index");
        assert_eq!(index.scanned_files, 1);
        assert!(index.truncated);
    }

    #[test]
    fn listings_read_only_added_or_changed_prefixes_and_evict_removed_paths() {
        let tree = TestTree::new();
        fs::write(tree.root.join("a.jsonl"), "one\n").unwrap();
        fs::write(tree.root.join("b.jsonl"), "two\n").unwrap();
        let source = source(&tree, 2);
        let first = source.list(None).unwrap();
        assert_eq!((first.prefix_reads, first.prefix_bytes), (2, 8));
        let unchanged = source.list(None).unwrap();
        assert_eq!(unchanged.sessions, first.sessions);
        assert_eq!((unchanged.prefix_reads, unchanged.prefix_bytes), (0, 0));
        let filtered = source.list(Some("different-folder")).unwrap();
        assert_eq!(filtered.sessions.len(), 0);
        assert_eq!(filtered.prefix_reads, 0);
        assert_eq!(source.list(Some("FIXTURE")).unwrap().sessions.len(), 2);

        fs::write(tree.root.join("a.jsonl"), "one\nmore\n").unwrap();
        let changed = source.list(None).unwrap();
        assert_eq!((changed.prefix_reads, changed.prefix_bytes), (1, 9));
        fs::write(tree.root.join("c.jsonl"), "new\n").unwrap();
        assert_eq!(source.list(None).unwrap().prefix_reads, 1);
        fs::rename(tree.root.join("b.jsonl"), tree.root.join("renamed.jsonl")).unwrap();
        assert_eq!(source.list(None).unwrap().prefix_reads, 1);

        let removed = first
            .sessions
            .iter()
            .find(|s| s.summary.title == "a")
            .unwrap()
            .locator;
        fs::remove_file(tree.root.join("a.jsonl")).unwrap();
        let remaining = source.list(None).unwrap();
        assert_eq!((remaining.sessions.len(), remaining.prefix_reads), (2, 0));
        assert!(matches!(
            source.page(removed, None),
            Err(StoreError::SessionMissing { .. })
        ));
    }

    #[test]
    fn same_size_rewrites_use_full_timestamps_instead_of_display_milliseconds() {
        let tree = TestTree::new();
        let path = tree.root.join("s.jsonl");
        let message =
            |text| format!("{{\"type\":\"user\",\"message\":{{\"content\":\"{text}\"}}}}\n");
        let timestamp = UNIX_EPOCH + std::time::Duration::from_secs(1_700_000_000);
        fs::write(&path, message("first")).unwrap();
        File::options()
            .write(true)
            .open(&path)
            .unwrap()
            .set_modified(timestamp)
            .unwrap();
        let source = JsonlHistorySource::open(
            &tree.root,
            claude::ClaudeHistoryDecoder,
            HistoryLimits::default(),
        )
        .unwrap();
        let first = source.list(None).unwrap();
        fs::write(&path, message("other")).unwrap();
        File::options()
            .write(true)
            .open(&path)
            .unwrap()
            .set_modified(timestamp + std::time::Duration::from_micros(100))
            .unwrap();
        let changed = source.list(None).unwrap();
        assert_eq!(
            first.sessions[0].source_bytes,
            changed.sessions[0].source_bytes
        );
        assert_eq!(
            first.sessions[0].modified_millis,
            changed.sessions[0].modified_millis
        );
        assert_eq!(changed.sessions[0].summary.title, "other");
        assert_eq!(changed.prefix_reads, 1);
    }

    #[test]
    fn concurrent_listings_share_prefix_reads() {
        let tree = TestTree::new();
        for name in ["a", "b", "c"] {
            fs::write(tree.root.join(format!("{name}.jsonl")), "one\n").unwrap();
        }
        let source = source(&tree, 2);
        let barrier = std::sync::Barrier::new(8);
        let indexes = std::thread::scope(|scope| {
            let threads: Vec<_> = (0..8)
                .map(|_| {
                    scope.spawn(|| {
                        barrier.wait();
                        source.list(None).unwrap()
                    })
                })
                .collect();
            threads
                .into_iter()
                .map(|thread| thread.join().unwrap())
                .collect::<Vec<_>>()
        });
        assert_eq!(
            indexes
                .iter()
                .map(|index| index.prefix_reads)
                .sum::<usize>(),
            3
        );
        assert_eq!(
            indexes
                .iter()
                .map(|index| index.prefix_bytes)
                .sum::<usize>(),
            12
        );
        assert!(
            indexes
                .iter()
                .all(|index| index.sessions == indexes[0].sessions)
        );
    }

    #[test]
    fn paging_reuses_the_index_and_refreshes_after_truncation() {
        struct CountingDecoder(Arc<AtomicU64>);
        impl HistoryDecoder for CountingDecoder {
            fn provider_id(&self) -> ProviderId {
                TEST_PROVIDER
            }
            fn index_metadata(&self, path: &Path, prefix: &str) -> Option<HistoryIndexMetadata> {
                self.0.fetch_add(1, Ordering::SeqCst);
                FixtureDecoder.index_metadata(path, prefix)
            }
            fn decode_line(&self, line: &str) -> DecodeOutcome {
                FixtureDecoder.decode_line(line)
            }
        }
        let tree = TestTree::new();
        let path = tree.root.join("s.jsonl");
        fs::write(&path, "one\ntwo\nthree\n").unwrap();
        let decoded = Arc::new(AtomicU64::new(0));
        let source = JsonlHistorySource::open(
            &tree.root,
            CountingDecoder(Arc::clone(&decoded)),
            HistoryLimits {
                page_events: 1,
                ..HistoryLimits::default()
            },
        )
        .unwrap();
        let locator = source.list(None).unwrap().sessions[0].locator;
        let newest = source.page(locator, None).unwrap();
        source.page(locator, newest.next_cursor).unwrap();
        assert_eq!(decoded.load(Ordering::SeqCst), 1);
        fs::write(&path, "one\n").unwrap();
        assert!(matches!(
            source.page(locator, newest.next_cursor),
            Err(StoreError::SessionChanged { .. })
        ));
        assert_eq!(decoded.load(Ordering::SeqCst), 2);
        assert_eq!(source.list(None).unwrap().prefix_reads, 0);
    }

    #[test]
    fn changing_files_are_retried_boundedly_and_failures_are_not_cached() {
        struct ChangingDecoder(Arc<AtomicU64>);
        impl HistoryDecoder for ChangingDecoder {
            fn provider_id(&self) -> ProviderId {
                TEST_PROVIDER
            }
            fn index_metadata(&self, path: &Path, prefix: &str) -> Option<HistoryIndexMetadata> {
                let remaining = self.0.load(Ordering::SeqCst);
                if remaining > 0 {
                    self.0.fetch_sub(1, Ordering::SeqCst);
                    fs::write(path, format!("{prefix}changed\n")).unwrap();
                }
                FixtureDecoder.index_metadata(path, prefix)
            }
            fn decode_line(&self, line: &str) -> DecodeOutcome {
                FixtureDecoder.decode_line(line)
            }
        }
        let tree = TestTree::new();
        let path = tree.root.join("s.jsonl");
        fs::write(&path, "one\n").unwrap();
        let changes = Arc::new(AtomicU64::new(1));
        let source = JsonlHistorySource::open(
            &tree.root,
            ChangingDecoder(Arc::clone(&changes)),
            HistoryLimits::default(),
        )
        .unwrap();
        let stable = source.list(None).unwrap();
        assert_eq!(stable.prefix_reads, 2);
        assert_eq!(
            stable.sessions[0].source_bytes,
            fs::metadata(&path).unwrap().len()
        );
        assert_eq!(source.list(None).unwrap().prefix_reads, 0);

        fs::write(&path, "new\ncontent\n").unwrap();
        changes.store(2, Ordering::SeqCst);
        assert!(matches!(
            source.list(None),
            Err(StoreError::SourceUnavailable { .. })
        ));
        assert_eq!(
            changes.load(Ordering::SeqCst),
            0,
            "both bounded attempts used"
        );
        assert_eq!(
            source.list(None).unwrap().prefix_reads,
            1,
            "retry after a failed refresh"
        );
        assert_eq!(source.list(None).unwrap().prefix_reads, 0);
    }

    #[test]
    fn a_partial_record_is_refreshed_when_the_writer_finishes_it() {
        let tree = TestTree::new();
        let path = tree.root.join("s.jsonl");
        fs::write(&path, "{\"type\":\"user\",\"message\":{").unwrap();
        let source = JsonlHistorySource::open(
            &tree.root,
            claude::ClaudeHistoryDecoder,
            HistoryLimits::default(),
        )
        .unwrap();
        source.list(None).unwrap();
        assert_eq!(source.list(None).unwrap().prefix_reads, 0);
        fs::write(
            &path,
            "{\"type\":\"user\",\"message\":{\"content\":\"Finished\"}}\n",
        )
        .unwrap();
        let complete = source.list(None).unwrap();
        assert_eq!(complete.prefix_reads, 1);
        assert_eq!(complete.sessions[0].summary.title, "Finished");
    }

    #[test]
    fn catalog_refresh_retains_sources_but_invalidates_changed_configuration() {
        let left = TestTree::new();
        let right = TestTree::new();
        fs::write(left.root.join("s.jsonl"), "{}\n").unwrap();
        fs::write(right.root.join("other.jsonl"), "{}\n").unwrap();
        let mut definitions = [definition("claude-code", "claude-code", &left.root)];
        let mut catalog = HistoryCatalog::default();
        let refresh = |catalog: &mut HistoryCatalog, definitions: &[ProviderDefinition], limits| {
            let found = super::catalog(catalog, definitions, None, limits);
            assert!(found.iter().all(|source| source.problem.is_none()));
        };
        refresh(&mut catalog, &definitions, HistoryLimits::default());
        assert_eq!(catalog.list(TEST_PROVIDER, None).unwrap().prefix_reads, 1);
        refresh(&mut catalog, &definitions, HistoryLimits::default());
        assert_eq!(
            catalog
                .clone()
                .list(TEST_PROVIDER, None)
                .unwrap()
                .prefix_reads,
            0
        );
        definitions[0].history.as_mut().unwrap().prefix_bytes = Some(1024);
        refresh(&mut catalog, &definitions, HistoryLimits::default());
        assert_eq!(catalog.list(TEST_PROVIDER, None).unwrap().prefix_reads, 1);
        refresh(
            &mut catalog,
            &definitions,
            HistoryLimits {
                max_files: 1,
                ..HistoryLimits::default()
            },
        );
        let exact_limit = catalog.list(TEST_PROVIDER, None).unwrap();
        assert_eq!(exact_limit.prefix_reads, 1);
        assert!(
            !exact_limit.truncated,
            "exactly the limit is not evidence of more files"
        );
        definitions[0] = definition("claude-code", "claude-code", &right.root);
        refresh(&mut catalog, &definitions, HistoryLimits::default());
        let moved = catalog.list(TEST_PROVIDER, None).unwrap();
        assert_eq!(moved.prefix_reads, 1);
        assert_eq!(
            moved.sessions[0]
                .summary
                .provider_session_id
                .as_ref()
                .unwrap()
                .0,
            "other"
        );
        refresh(&mut catalog, &[], HistoryLimits::default());
        assert!(!catalog.has_source(TEST_PROVIDER));
    }

    #[test]
    fn missing_roots_can_appear_disappear_and_return() {
        let tree = TestTree::new();
        let root = tree.root.join("history");
        let moved = tree.root.join("moved");
        let definitions = [definition("claude-code", "claude-code", &root)];
        let mut catalog = HistoryCatalog::default();
        let refresh = |catalog: &mut HistoryCatalog| {
            super::catalog(catalog, &definitions, None, HistoryLimits::default())
        };
        assert!(!refresh(&mut catalog)[0].present);
        assert!(!catalog.has_source(TEST_PROVIDER));
        fs::create_dir(&root).unwrap();
        fs::write(root.join("s.jsonl"), "{}\n").unwrap();
        assert!(refresh(&mut catalog)[0].present);
        assert_eq!(catalog.list(TEST_PROVIDER, None).unwrap().prefix_reads, 1);
        fs::rename(&root, &moved).unwrap();
        assert!(!refresh(&mut catalog)[0].present);
        assert!(!catalog.has_source(TEST_PROVIDER));
        fs::rename(&moved, &root).unwrap();
        assert!(refresh(&mut catalog)[0].present);
        assert_eq!(catalog.list(TEST_PROVIDER, None).unwrap().prefix_reads, 1);
    }

    #[test]
    fn fifty_thousand_records_stay_in_one_bounded_page() {
        let tree = TestTree::new();
        let mut transcript = String::new();
        for index in 0..50_000 {
            writeln!(transcript, "event-{index}").expect("write to a String");
        }
        fs::write(tree.root.join("large.jsonl"), transcript).expect("large fixture");
        let source = source(&tree, 200);
        let locator = source.list(None).expect("index").sessions[0].locator;
        let page = source.page(locator, None).expect("bounded page");
        assert_eq!(page.events.len(), 200);
        assert!(page.truncated_before);
        assert!(page.next_cursor.is_some());
    }

    #[test]
    fn identical_filenames_in_different_roots_have_distinct_artifact_identity() {
        let left_tree = TestTree::new();
        let right_tree = TestTree::new();
        fs::write(left_tree.root.join("same.jsonl"), "left\n").unwrap();
        fs::write(right_tree.root.join("same.jsonl"), "right\n").unwrap();
        let left = source(&left_tree, 200);
        let right = source(&right_tree, 200);
        let left_entry = left.list(None).unwrap().sessions.remove(0);
        let right_entry = right.list(None).unwrap().sessions.remove(0);

        assert_ne!(left_entry.locator, right_entry.locator);
        assert_ne!(left_entry.summary.id, right_entry.summary.id);
        assert!(matches!(
            right.page(left_entry.locator, None),
            Err(StoreError::SessionMissing { .. })
        ));
        let left_page = left.page(left_entry.locator, None).unwrap();
        let right_page = right.page(right_entry.locator, None).unwrap();
        assert_ne!(left_page.events[0].id, right_page.events[0].id);

        let reopened = JsonlHistorySource::open(
            left_tree.root.join("."),
            FixtureDecoder,
            HistoryLimits::default(),
        )
        .unwrap();
        let reopened_entry = reopened.list(None).unwrap().sessions.remove(0);
        assert_eq!(reopened_entry.locator, left_entry.locator);
        assert_eq!(reopened_entry.summary.id, left_entry.summary.id);
    }

    #[test]
    fn repeated_provider_native_ids_remain_distinct_history_artifacts() {
        struct RepeatedNativeIdDecoder;

        impl HistoryDecoder for RepeatedNativeIdDecoder {
            fn provider_id(&self) -> ProviderId {
                TEST_PROVIDER
            }

            fn index_metadata(&self, path: &Path, _prefix: &str) -> Option<HistoryIndexMetadata> {
                Some(HistoryIndexMetadata {
                    native_id: ProviderSessionId("shared-native-id".into()),
                    kind: HistorySessionKind::Unknown,
                    parent_native_id: None,
                    title: path.file_stem()?.to_string_lossy().into_owned(),
                    workspace: "C:/fixture".into(),
                    started_at: "2026-07-23T00:00:00Z".into(),
                })
            }

            fn decode_line(&self, line: &str) -> DecodeOutcome {
                DecodeOutcome::Event(DecodedHistoryEvent {
                    turn_id: None,
                    content: ChatEventContent::AssistantMessage(line.to_owned()),
                })
            }
        }

        let tree = TestTree::new();
        fs::write(tree.root.join("first.jsonl"), "first\n").expect("first");
        fs::write(tree.root.join("second.jsonl"), "second\n").expect("second");
        let source = JsonlHistorySource::open(
            &tree.root,
            RepeatedNativeIdDecoder,
            HistoryLimits::default(),
        )
        .expect("source");

        let index = source.list(None).expect("index");
        assert_eq!(index.sessions.len(), 2);
        assert_ne!(index.sessions[0].locator, index.sessions[1].locator);
        assert_ne!(index.sessions[0].summary.id, index.sessions[1].summary.id);
        assert_eq!(
            index.sessions[0].summary.provider_session_id,
            index.sessions[1].summary.provider_session_id
        );

        let left = source
            .page(index.sessions[0].locator, None)
            .expect("left page");
        let right = source
            .page(index.sessions[1].locator, None)
            .expect("right page");
        assert_ne!(left.session_id, right.session_id);
        assert_ne!(left.events[0].id, right.events[0].id);
    }
}
