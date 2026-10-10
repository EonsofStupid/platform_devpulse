# PROJECT SCANNER + SUGGESTION BROWSER — Harrier-Powered System Analysis
> Status: `ACTIVE` | Version: `1.0.0` | Owner: `@jesse`
> Module: `kernel/devpulse-clyffy/src/cortex/scanner/`
> UI: `interfaces/desktop/src/lib/scanner/`
> Related: `ROSETTA-FOX-SPEC.md`, `MINION_BRAIN_SPEC.md`, `safety/patterns.rs`

---

## Core Principle

Scan once, explain everything, apply selectively.

Vibe coders don't want an AI that silently changes their code. They want
an AI that shows them what's wrong, explains why in plain language, lets
them browse one issue at a time, and only modifies files when they say so.

Harrier does the heavy lifting. User stays in control. Every suggestion
is browse-first, preview-always, apply-on-demand.

```
SCAN (background, Harrier embeds everything)
    │
    ▼
CATALOG (all findings stored, nothing applied)
    │
    ▼
BROWSE (user clicks through findings one at a time)
    │
    ▼
PREVIEW (diff view shows exactly what would change)
    │
    ▼
APPLY (user chooses: Apply · Skip · Ignore Forever · Edit First)
    │
    ▼
VERIFY (GUARDIAN re-scans, confirms fix landed clean)
```

---

## Part 1 — Harrier Deployment Strategy

Harrier-OSS-v1 is Microsoft's decoder-only multilingual embedding family.
Released March 30, 2026 under MIT license. Three variants:

| Model | Params | Dim | Context | MTEB-v2 | Role in DevPulse |
|---|---|---|---|---|---|
| Harrier-0.6B | 600M | 1024 | 32,768 | 69.0 | **Primary embedder** (rag.embedder slot) |
| Harrier-270M | 270M | 1024 | 32,768 | 66.5 | Fallback for 8GB-VRAM / CPU-only preset |
| Harrier-27B | 27B | 5376 | 32,768 | 74.3 | Lab-only — NOT shipped to consumers |

### Architecture note

Harrier uses **decoder-only transformers with last-token pooling and
L2-normalized output**. This is different from BERT-style bi-encoders
like BGE or E5. Key implications:

- **Queries need an instruction prefix.** Documents do not.
  Format: `Instruct: {task}\nQuery: {text}`
- **L2-normalized 1024-dim output** (0.6B and 270M). Cosine similarity
  via dot product.
- **32k context window** means most DevPulse chunks never need splitting.

### Three roles for Harrier in DevPulse

```
┌─────────────────────────────────────────────────────────────────┐
│  ROLE 1 — RAG EMBEDDER (rag.embedder slot)                       │
│  Model: Harrier-0.6B (default), Harrier-270M (8GB fallback)      │
│  Where: Cortex (Qdrant fork) — every chunk, every query          │
│  Runtime: CPU, fastembed-rs via ONNX Runtime                     │
│  Task prefix: "Retrieve relevant code chunks..."                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ROLE 2 — ROSETTA SEMANTIC ENCODER (Layer 3)                     │
│  Model: Harrier-270M (small, fast, CPU-only)                     │
│  Where: Pre-cognitive expression normalization                    │
│  Runtime: CPU, ONNX Runtime, always hot                          │
│  Task prefix: "Normalize user expression to canonical form..."   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ROLE 3 — MINION / STS SEMANTIC CACHE                            │
│  Model: Harrier-0.6B (shared with rag.embedder — one instance)   │
│  Where: Minion context retrieval, STS session continuity         │
│  Runtime: CPU, refcount-shared with rag.embedder                 │
│  Task prefix: varies per minion                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural win:** rag.embedder and minion-shared use the SAME
Harrier-0.6B instance. One model in memory, two consumers.

---

## Part 2 — CRITICAL: fastembed-rs Does Not Yet Support Harrier

Reality check before implementation:

As of April 2026, fastembed-rs's `EmbeddingModel` enum does NOT include
Harrier. fastembed-rs ships with quantized ONNX models for supported
architectures — Harrier is decoder-only (not encoder-only like BGE).

### Three path options

**Path A — Export Harrier to ONNX, register as custom model in fastembed-rs**
Requires Optimum CLI export on Jesse's dev machine. fastembed-rs has a
"bring your own ONNX" escape hatch via `UserDefinedEmbeddingModel`.
Last-token pooling + L2 normalize must be implemented in Rust since
fastembed-rs's default is mean pooling.

**Path B — Use Candle directly with Harrier safetensors**
Load model via `candle-transformers` manually. Full control over
last-token pooling and instruction-prefix handling. Higher
implementation cost but cleaner architecture fit.

**Path C — Wait for upstream fastembed-rs PR**
File issue, wait for maintainer. Not viable for DevPulse timeline.

### Recommended: Path A with Path B fallback

```rust
// kernel/devpulse-clyffy/src/cortex/adapters/embedder/harrier.rs

use fastembed::{UserDefinedEmbeddingModel, TextEmbedding, InitOptionsUserDefined};

pub struct HarrierEmbedder {
    model: TextEmbedding,
    variant: HarrierVariant,
}

#[derive(Debug, Clone, Copy)]
pub enum HarrierVariant {
    V0_6B,   // primary — 600M params, 1024-dim
    V270M,   // fallback — 270M params, 1024-dim (CPU-only preset)
}

impl HarrierEmbedder {
    /// Load Harrier from ONNX. Model files live in
    /// D:/localdev/platform_devpulse/models/Harrier-{variant}/
    pub fn load(variant: HarrierVariant, models_dir: &Path) -> Result<Self> {
        let model_path = models_dir.join(variant.dir_name());
        let onnx_bytes = std::fs::read(model_path.join("model.onnx"))?;
        let tokenizer_bytes = std::fs::read(model_path.join("tokenizer.json"))?;

        let udm = UserDefinedEmbeddingModel::new(onnx_bytes, /* tokenizer */);
        let model = TextEmbedding::try_new_from_user_defined(
            udm,
            InitOptionsUserDefined::default(),
        )?;
        Ok(Self { model, variant })
    }

    /// Embed a query — prepends task instruction.
    pub fn embed_query(&self, task: &str, query: &str) -> Result<Vec<f32>> {
        let prefixed = format!("Instruct: {}\nQuery: {}", task, query);
        let raw = self.model.embed(vec![prefixed], None)?;
        // fastembed-rs default is mean pooling — we need last-token.
        // Apply last-token pooling + L2 normalize externally.
        Ok(last_token_pool_and_normalize(&raw[0]))
    }

    /// Embed a document — NO task instruction.
    pub fn embed_document(&self, doc: &str) -> Result<Vec<f32>> {
        let raw = self.model.embed(vec![doc.to_string()], None)?;
        Ok(last_token_pool_and_normalize(&raw[0]))
    }
}
```

**Decision gate:** If Path A proves too lossy (last-token pooling
accuracy drops when applied post-hoc), fall back to Path B with direct
Candle inference. Benchmark against MTEB-v2 English subset before
committing to production.

---

## Part 3 — Methodical Scanner Architecture

### Phase-based scan pipeline

The scanner is staged disclosure applied to code analysis. Seven phases,
each independently cancellable, each with its own progress indicator.

```rust
// kernel/devpulse-clyffy/src/cortex/scanner/mod.rs

pub enum ScanPhase {
    /// Phase 1: Walk filesystem, respect .gitignore, catalog file types.
    /// Fast — ignore-walk crate, no content reading yet.
    Discovery,

    /// Phase 2: Tree-sitter parse every file for its language.
    /// Reuses existing safety::language registry (7 languages).
    Structure,

    /// Phase 3: Run GUARDIAN vulnerability patterns (existing).
    /// Reuses safety::patterns::PATTERNS — no new work here.
    Security,

    /// Phase 4: Harrier-embed every chunk into Cortex (RRO).
    /// This is the expensive phase — batched, CPU-bound.
    Embedding,

    /// Phase 5: Detect duplicates via cosine similarity over embeddings.
    /// "Scattered code consolidation" from the product philosophy.
    Duplication,

    /// Phase 6: Cross-reference with best-practice rules.
    /// e.g. "no /core dumping ground", "components match pattern".
    BestPractices,

    /// Phase 7: Rank all findings by severity + affected surface area.
    /// Produces the final FindingCatalog the UI browses.
    Ranking,
}

pub struct ScanProgress {
    pub phase: ScanPhase,
    pub phase_idx: u8,        // 1-7
    pub items_total: usize,
    pub items_done: usize,
    pub eta_seconds: Option<u64>,
    pub cancellable: bool,
}
```

### Core finding type — the unit of browsing

Every single thing the scanner surfaces is one of these:

```rust
// kernel/devpulse-clyffy/src/cortex/scanner/finding.rs

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Finding {
    /// Stable ID — user can reference, ignore, or bookmark.
    pub id: String,

    /// Which scan phase surfaced this.
    pub phase: ScanPhase,

    /// Finding taxonomy.
    pub kind: FindingKind,

    /// Severity drives UI color + default sort.
    pub severity: Severity,

    /// Location in user's code.
    pub location: CodeLocation,

    /// Two-tier explanation: layman first, dev second.
    pub explanation: Explanation,

    /// What Clyffy suggests doing. Always a preview — never applied yet.
    pub suggestion: Option<Suggestion>,

    /// How confident Clyffy is this is actually a problem (0.0-1.0).
    pub confidence: f32,

    /// User can mark these permanently.
    pub status: FindingStatus,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum FindingKind {
    Vulnerability { pattern_id: String },  // GUARDIAN
    Duplication { similar_to: Vec<String> },
    AntiPattern { rule_id: String },
    MissingTest { for_function: String },
    DeadCode,
    ScatteredImplementation { fragments: Vec<String> },
    PoorNaming { suggested: String },
    Documentation { missing_for: String },
}

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum Severity {
    Critical,    // security vulnerability, data loss risk
    High,        // bug, crash potential
    Medium,      // maintainability, technical debt
    Low,         // style, documentation
    Info,        // observation, no action required
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CodeLocation {
    pub file_path: PathBuf,
    pub line_start: u32,
    pub line_end: u32,
    pub col_start: u32,
    pub col_end: u32,
    /// Full context span for diff preview (±5 lines typical).
    pub context_range: (u32, u32),
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Explanation {
    /// Plain-language summary — for the layman mode UI.
    /// "Your login form has a password field that isn't masked."
    pub layman: String,

    /// Technical detail — for the dev mode UI.
    /// "G018-TS-001: <input type='text'> receives password; should be type='password'"
    pub technical: String,

    /// Why this matters — TEACHER minion feeds this.
    /// "Browsers won't hide the characters, and password managers
    ///  won't auto-fill correctly. This is a common accessibility issue."
    pub why_it_matters: String,

    /// Link to more info if user wants to go deeper.
    pub learn_more_url: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Suggestion {
    /// The proposed change as a diff the user can preview.
    pub diff: UnifiedDiff,

    /// One-sentence description of what the change does.
    pub summary: String,

    /// What will be affected if applied.
    pub impact: SuggestionImpact,

    /// Other findings this suggestion would also resolve.
    /// (One fix often addresses multiple problems.)
    pub also_resolves: Vec<String>,

    /// Whether Fox compiled this or it came from a rule template.
    pub source: SuggestionSource,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SuggestionSource {
    /// Deterministic — from a rule template, safe to apply confidently.
    RuleTemplate { rule_id: String },
    /// LLM-generated — Fox compiled a COSTAR+ prompt and got a patch.
    FoxCompiled { template_id: String },
    /// Multi-file consolidation — output of Phase 5 scattered code detection.
    ConsolidationPlan { affected_files: Vec<PathBuf> },
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SuggestionImpact {
    pub files_touched: u32,
    pub lines_added: u32,
    pub lines_removed: u32,
    /// Does this suggestion alter any public APIs? User deserves a heads-up.
    pub breaks_public_api: bool,
    /// Does this require running tests afterward?
    pub tests_required: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum FindingStatus {
    Fresh,                      // never seen by user
    Reviewed,                   // user looked at it, no action
    Applied { at_ms: i64 },     // suggestion was applied
    Skipped,                    // this session only
    IgnoredForever,             // user said never show again
    Bookmarked,                 // come back to this later
}
```

---

## Part 4 — The Scan Itself (Harrier-Powered)

```rust
// kernel/devpulse-clyffy/src/cortex/scanner/scan.rs

pub struct ProjectScanner {
    /// Harrier-0.6B shared with rag.embedder (refcount).
    embedder: Arc<HarrierEmbedder>,
    /// Existing GUARDIAN infrastructure — reused, not duplicated.
    guardian: Arc<GuardianScanner>,
    /// CAG pipeline — embeddings land here.
    cag: Arc<CagPipeline>,
    /// Tree-sitter language registry.
    languages: Arc<LangRegistry>,
}

impl ProjectScanner {
    pub async fn scan(
        &self,
        project_root: &Path,
        progress_tx: broadcast::Sender<ScanProgress>,
        cancel: CancellationToken,
    ) -> Result<FindingCatalog> {
        // Phase 1: Discovery — walk filesystem
        let files = self.discover_files(project_root, &progress_tx).await?;
        if cancel.is_cancelled() { return Err(Cancelled); }

        // Phase 2: Structure — tree-sitter parse
        let parsed = self.parse_structure(&files, &progress_tx).await?;
        if cancel.is_cancelled() { return Err(Cancelled); }

        // Phase 3: Security — existing GUARDIAN patterns
        let vuln_findings = self.guardian.scan_all(&parsed).await?;
        if cancel.is_cancelled() { return Err(Cancelled); }

        // Phase 4: Embedding — Harrier batched over all chunks
        let embeddings = self.embed_chunks(&parsed, &progress_tx).await?;
        if cancel.is_cancelled() { return Err(Cancelled); }

        // Phase 5: Duplication — cosine similarity over embeddings
        let dup_findings = self.detect_duplicates(&embeddings).await?;
        if cancel.is_cancelled() { return Err(Cancelled); }

        // Phase 6: Best Practices — rule engine
        let bp_findings = self.check_best_practices(&parsed, &embeddings).await?;
        if cancel.is_cancelled() { return Err(Cancelled); }

        // Phase 7: Ranking — sort, deduplicate, attach suggestions
        let catalog = self.rank_and_catalog(
            vuln_findings,
            dup_findings,
            bp_findings,
        ).await?;

        Ok(catalog)
    }

    /// Phase 4 detail — Harrier batched embedding.
    /// This is the most expensive phase. Batch size matters.
    async fn embed_chunks(
        &self,
        parsed: &[ParsedFile],
        progress_tx: &broadcast::Sender<ScanProgress>,
    ) -> Result<ChunkEmbeddings> {
        const BATCH_SIZE: usize = 32;
        let total = parsed.iter().map(|f| f.chunks.len()).sum::<usize>();
        let mut done = 0;
        let mut embeddings = ChunkEmbeddings::new();

        for batch in parsed.chunks(BATCH_SIZE) {
            let texts: Vec<&str> = batch.iter()
                .flat_map(|f| f.chunks.iter().map(|c| c.text.as_str()))
                .collect();

            // Documents get NO instruction prefix per Harrier spec.
            let vecs = self.embedder.embed_documents_batch(&texts).await?;

            for (chunk, vec) in batch.iter().flat_map(|f| &f.chunks).zip(vecs) {
                embeddings.insert(chunk.id.clone(), vec);
            }

            done += texts.len();
            let _ = progress_tx.send(ScanProgress {
                phase: ScanPhase::Embedding,
                phase_idx: 4,
                items_total: total,
                items_done: done,
                eta_seconds: estimate_eta(done, total),
                cancellable: true,
            });
        }

        Ok(embeddings)
    }
}
```

---

## Part 5 — The Browse/Apply/Save UI

### Principle: one finding at a time, no batch operations in the primary flow

Vibe coders get overwhelmed by long lists. The primary browse surface
shows ONE finding. Batch operations live behind an explicit "Advanced"
toggle.

### Main Scanner Dashboard

```
┌─ Project Scanner ─────────────────────────────────────────────────┐
│                                                                    │
│  Scanning complete — found 47 things to review                     │
│                                                                    │
│  ┌──────────────┬─────────┬────────┬────────┐                     │
│  │              │ Count   │ Fresh  │ Action │                     │
│  ├──────────────┼─────────┼────────┼────────┤                     │
│  │ Critical     │    3    │   3    │  [→]   │                     │
│  │ High         │   12    │  12    │  [→]   │                     │
│  │ Medium       │   24    │  22    │  [→]   │                     │
│  │ Low          │    8    │   8    │  [→]   │                     │
│  └──────────────┴─────────┴────────┴────────┘                     │
│                                                                    │
│  [▶ Review findings one at a time]  [🔍 Search]  [⚙ Advanced]     │
│                                                                    │
│  Clyffy recommends: start with the 3 critical issues first.       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Single-Finding Browse View (the primary UX)

```
┌─ Finding 1 of 47 ── Critical ─────────────────────── [✗ Close] ─┐
│                                                                   │
│  ╔════════════════════════════════════════════════════════════╗  │
│  ║  Password field not masked                                 ║  │
│  ║  src/features/auth/components/LoginForm.tsx · line 42      ║  │
│  ╚════════════════════════════════════════════════════════════╝  │
│                                                                   │
│  What's happening                                                │
│  ─────────────                                                   │
│  Your login form has a password field, but the browser will      │
│  show the characters as the user types them. This means anyone   │
│  standing behind them can read their password.                   │
│                                                                   │
│  Why it matters                                                  │
│  ─────────────                                                   │
│  Password managers won't auto-fill this field correctly either,  │
│  which frustrates users. This is one of the most common          │
│  beginner mistakes in web forms.                                 │
│                                                                   │
│  [ℹ Show technical details]                                      │
│                                                                   │
│  ╭── Current code ──────────────────────────────────────────╮   │
│  │  40:  <label>Password</label>                             │   │
│  │  41:  <input                                              │   │
│  │  42:    type="text"                      ← the issue      │   │
│  │  43:    name="password"                                   │   │
│  │  44:    onChange={handleChange}                           │   │
│  │  45:  />                                                  │   │
│  ╰───────────────────────────────────────────────────────────╯   │
│                                                                   │
│  ╭── Suggested change ─────────────────────────────────────╮    │
│  │  42:  - type="text"                                      │    │
│  │  42:  + type="password"                                  │    │
│  ╰─────────────────────────────────────────────────────────╯    │
│                                                                   │
│  Impact: 1 file · 1 line changed · no API breaks · no tests req  │
│                                                                   │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────────────┐    │
│  │ ✓ Apply  │  │ Skip →  │  │ ✎ Edit   │  │ 🚫 Never again │    │
│  └──────────┘  └─────────┘  └──────────┘  └────────────────┘    │
│                                                                   │
│  [← Previous]    Progress: ████░░░░░░ 1 of 47    [Next →]        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Action Buttons — What Each Does

| Button | Behavior | Undo? |
|---|---|---|
| **✓ Apply** | Writes the diff to disk. Git stages change. GUARDIAN re-scans to confirm fix. | Yes, Ctrl+Z within session |
| **Skip →** | Marks finding as Skipped for this session only. Reappears next scan. | Yes, go back with ← |
| **✎ Edit** | Opens the suggested diff in an inline editor. User tweaks, then applies. | Yes |
| **🚫 Never again** | Marks finding as IgnoredForever in libSQL. Never surfaces on rescan. | Settings → Ignored findings |

### Edit-First Flow

When the user clicks **Edit**, the suggestion isn't silently applied.
They get a proper diff editor with Clyffy's suggestion loaded:

```
┌─ Edit Suggestion ──────────────────────────────────────────────┐
│                                                                 │
│  You can adjust Clyffy's suggestion before applying it.        │
│                                                                 │
│  ╭─ src/features/auth/components/LoginForm.tsx ─────────────╮ │
│  │  40:   <label>Password</label>                            │ │
│  │  41:   <input                                             │ │
│  │  42:     type="password"       ← you can edit this line   │ │
│  │  43:     name="password"                                  │ │
│  │  44:     autoComplete="current-password"  ← you added     │ │
│  │  45:     onChange={handleChange}                          │ │
│  │  46:   />                                                 │ │
│  ╰───────────────────────────────────────────────────────────╯ │
│                                                                 │
│  Clyffy noticed you added autoComplete — that's a great        │
│  addition. Want me to explain why?                             │
│  [Tell me] [Just apply]                                        │
│                                                                 │
│  [✓ Apply my edits]  [↺ Reset to Clyffy's suggestion]          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

This is where the TEACHER minion lives — catches user improvements,
explains why they work.

### Advanced Batch Operations (opt-in)

Hidden behind `[⚙ Advanced]` on the dashboard. Power users only.

```
┌─ Advanced ─────────────────────────────────────────────────────┐
│                                                                 │
│  Batch operations                                              │
│  ─────────                                                     │
│                                                                 │
│  [ ] Apply all Low severity safely auto-applicable (3 matches) │
│  [ ] Mark all Info as Reviewed (8 matches)                     │
│  [ ] Skip this session: all Documentation findings (12)        │
│                                                                 │
│  ⚠  Batch apply never skips the preview step.                  │
│      Every selected change will be shown in a single diff       │
│      review before anything is written to disk.                 │
│                                                                 │
│  [Preview batch changes]  [Cancel]                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Scattered Code Consolidation (Phase 5 output, special UI)

When Harrier finds duplicated or scattered implementations, the browse
view gets a different layout — it must show multiple locations at once:

```
┌─ Finding · Scattered implementation ──────────────────────────────┐
│                                                                    │
│  Similar password validation code in 3 places                      │
│                                                                    │
│  Clyffy noticed you wrote similar password checking logic in       │
│  three different files. Consolidating them into one function       │
│  means you only have to fix bugs once.                             │
│                                                                    │
│  ┌─ src/features/auth/SignupForm.tsx ─── line 34-42 ────────────┐  │
│  │  if (password.length < 8) { ... }                              │ │
│  │  if (!/[A-Z]/.test(password)) { ... }                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─ src/features/auth/LoginForm.tsx ──── line 67-75 ────────────┐  │
│  │  if (password.length < 8) { ... }                              │ │
│  │  // note: missing uppercase check here                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─ src/features/profile/PasswordChange.tsx ── line 22-30 ──────┐  │
│  │  if (password.length < 6) { ... } ← inconsistent!             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Clyffy's plan                                                     │
│  ────                                                              │
│  1. Create src/features/auth/utils/validatePassword.ts            │
│  2. Update all 3 files to import and use it                       │
│  3. Standardize on 8+ char minimum (LoginForm had it right)       │
│                                                                    │
│  [📋 Preview all changes]  [✎ Edit plan]  [Skip]  [🚫 Never]      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Part 6 — Storage Schema (libSQL)

```sql
-- Scan session — one per scan run
CREATE TABLE scan_session (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL,
    started_at      INTEGER NOT NULL,
    completed_at    INTEGER,
    phase_reached   TEXT NOT NULL,          -- last ScanPhase reached
    total_findings  INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL,          -- 'running' | 'complete' | 'cancelled' | 'failed'
    FOREIGN KEY (project_id) REFERENCES project(id)
);

-- Finding — immutable once created
CREATE TABLE finding (
    id              TEXT PRIMARY KEY,
    scan_session_id TEXT NOT NULL,
    phase           TEXT NOT NULL,
    kind            TEXT NOT NULL,          -- JSON-serialized FindingKind
    severity        TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    line_start      INTEGER NOT NULL,
    line_end        INTEGER NOT NULL,
    col_start       INTEGER NOT NULL,
    col_end         INTEGER NOT NULL,
    explanation     TEXT NOT NULL,          -- JSON Explanation struct
    suggestion      TEXT,                   -- JSON Suggestion (nullable)
    confidence      REAL NOT NULL,
    FOREIGN KEY (scan_session_id) REFERENCES scan_session(id)
);

-- Finding status — separate table so it can change without rewriting finding
CREATE TABLE finding_status (
    finding_id      TEXT PRIMARY KEY,
    status          TEXT NOT NULL,          -- FindingStatus enum
    changed_at      INTEGER NOT NULL,
    applied_diff    TEXT,                   -- if Applied, the actual diff used
    FOREIGN KEY (finding_id) REFERENCES finding(id)
);

-- Permanently ignored findings — survives across scans
-- Keyed by (file_path, kind) so rescans don't resurface them.
CREATE TABLE ignored_finding (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    kind_signature  TEXT NOT NULL,          -- stable hash of FindingKind
    reason          TEXT,                   -- optional user note
    ignored_at      INTEGER NOT NULL,
    UNIQUE (project_id, file_path, kind_signature)
);

-- Apply history — audit trail for every applied change
CREATE TABLE apply_history (
    id              TEXT PRIMARY KEY,
    finding_id      TEXT NOT NULL,
    applied_at      INTEGER NOT NULL,
    diff_hash       TEXT NOT NULL,
    user_edited     INTEGER NOT NULL,       -- 0 = raw suggestion, 1 = user modified
    git_commit_sha  TEXT,                   -- if Clyffy staged + committed
    reverted_at     INTEGER,                -- nullable, for undo tracking
    FOREIGN KEY (finding_id) REFERENCES finding(id)
);
```

---

## Part 7 — Module Structure

```
kernel/devpulse-clyffy/src/cortex/scanner/
├── mod.rs                    ← ProjectScanner, ScanProgress, public API
├── scan.rs                   ← phase-by-phase orchestration
├── finding.rs                ← Finding, FindingKind, Severity, all types
├── catalog.rs                ← FindingCatalog, ranking logic
├── duplication.rs            ← Phase 5: cosine similarity dedup
├── best_practices.rs         ← Phase 6: rule engine
└── suggestion.rs             ← Suggestion builder, diff generation

kernel/devpulse-clyffy/src/cortex/adapters/embedder/
├── mod.rs
├── harrier.rs                ← HarrierEmbedder (new)
├── harrier_pooling.rs        ← last-token pool + L2 normalize
└── traits.rs                 ← Embedder trait (existing)

interfaces/desktop/src/lib/scanner/
├── ScannerDashboard.svelte
├── FindingBrowser.svelte     ← single-finding view
├── FindingEditor.svelte      ← Edit-first flow
├── ConsolidationView.svelte  ← Phase 5 multi-location UI
├── BatchAdvanced.svelte      ← advanced batch operations
└── stores/
    ├── scan-session.svelte.ts
    ├── finding-queue.svelte.ts
    └── apply-history.svelte.ts
```

---

## Part 8 — Implementation Order

```
P1: Harrier ONNX export + pooling wrapper
    - Export Harrier-0.6B and Harrier-270M to ONNX via Optimum
    - Implement last-token-pool + L2-normalize in harrier_pooling.rs
    - Benchmark accuracy vs reference Python implementation
    - Gate: accuracy within 1% of reference on MTEB-v2 English subset

P2: HarrierEmbedder integration into model-loader slots
    - Register as rag.embedder slot via fastembed-rs UserDefinedEmbeddingModel
    - Refcount-share instance with minion.shared
    - Gate: existing RRO queries work with Harrier output

P3: Scanner kernel types (mod.rs, finding.rs, catalog.rs)
    - All types in Rust, no UI yet
    - Gate: cargo test passes for type invariants

P4: Phase 1-3 scanner implementation
    - Discovery, Structure, Security (Security reuses existing GUARDIAN)
    - Gate: scanning devpulse-engine itself produces expected findings

P5: Phase 4 Harrier embedding batching
    - CPU-bound, batch size 32, tokio::spawn_blocking on rayon pool
    - Gate: 1000-file project embeds in <60s on 32GB/i9 baseline

P6: Phase 5 duplication detection
    - Cosine similarity over chunk embeddings
    - Threshold 0.85 initial, user-tunable
    - Gate: known duplicates in test fixtures are surfaced

P7: Phase 6 best-practice rule engine
    - TOML-driven rules, live in kernel/devpulse-clyffy/config/rules/
    - Gate: 10 rules shipped, all testable in isolation

P8: Phase 7 ranking + suggestion compilation
    - Fox integration: Fox compiles suggestion prompts when needed
    - Rule-based suggestions don't call Fox (deterministic)
    - Gate: every finding either has a suggestion or is explicitly None

P9: libSQL migration + ignored_finding persistence
    - Schema migration sprint (same pattern as rosetta tables)
    - Gate: IgnoredForever survives DevPulse restart

P10: UI — ScannerDashboard + FindingBrowser
    - Single-finding browse view is priority
    - Gate: full browse flow works end-to-end

P11: UI — FindingEditor (Edit-first flow)
    - Inline diff editor with TEACHER integration
    - Gate: user can edit suggestion, apply modified version

P12: UI — ConsolidationView for Phase 5 findings
    - Multi-location display, plan preview
    - Gate: scattered code consolidation applies correctly across 3+ files

P13: UI — BatchAdvanced
    - Explicit opt-in, always preview before apply
    - Gate: batch apply cannot bypass the preview step
```

---

## Part 9 — What Is NOT In This Spec

| Concern | Lives In |
|---|---|
| Actually running tests after apply | future `SPRINT-TEST-RUNNER.md` |
| Git commit/branch strategy on apply | `SPRINT-SCANNER-GIT-INTEGRATION.md` |
| Continuous re-scanning on file change | `SPRINT-SCANNER-WATCHER.md` (Phase 2) |
| Scanner running on remote projects | out of scope — local-first only |
| Harrier training / fine-tuning | out of scope — use stock weights |
| Training Rosetta semantic encoder | `SPRINT-ML-ROSETTA-ENCODER.md` |
| Vulnerability pattern authoring | `safety/patterns.rs` (existing) |
| Fox prompt compilation internals | `ROSETTA-FOX-SPEC.md` |

---

## Part 10 — Open Questions to Resolve Before Code

1. **Harrier ONNX export quality.** Does Optimum's export preserve
   decoder-only semantics accurately? Benchmark required in P1.

2. **Last-token pooling in fastembed-rs.** fastembed-rs mean-pools by
   default. Can we intercept at the right layer, or does this force
   Path B (Candle direct)? Spike before committing to Path A.

3. **Instruction prefix consistency.** Different scan phases want
   different task instructions. Do we hardcode them or make them
   part of the phase config? Config is cleaner.

4. **Batch size on 8GB-VRAM floor preset.** Harrier-270M on CPU:
   what's the sweet spot? Needs profiling on Jesse's rig first.

5. **IgnoredForever granularity.** Keyed by file_path + kind_signature
   is current design. Should it be keyed by AST-relative location
   instead, so renames don't break the ignore? Defer to P9.

---

*See also: ROSETTA-FOX-SPEC.md (suggestion compilation), MINION_BRAIN_SPEC.md
(GUARDIAN integration), MODEL-LOADER-SPEC-RC3.md (slot registration).*
