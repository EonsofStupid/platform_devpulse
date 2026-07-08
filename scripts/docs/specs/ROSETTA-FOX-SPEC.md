# ROSETTA + FOX (GRIFF) — Expression Normalization & Prompt Translation System
> Status: `ACTIVE` | Version: `1.0.0` | Owner: `@jesse`
> Module: `kernel/devpulse-clyffy/src/cortex/rosetta/`
> Neurocortex: Pre-cognitive layer — fires before MAESTRO on every signal
> Related: `interactions/mod.rs`, `minions/types.rs`, `safety/patterns.rs`
> Supersedes: informal Rosetta descriptions across session history

---

## Architecture Overview

Two systems, one pipeline. Architecturally separate, always in sequence.

```
Raw user input (sacred — never modified in UI display)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  ROSETTA — Expression Normalization                  │
│                                                      │
│  Layer 1: Hard replacement  ← lookup table, instant │
│  Layer 2: Vocabulary map    ← user expression-profile│
│  Layer 3: Semantic encoder  ← SafeTensors 0.1-0.3B  │
│  Layer 4: Ontology align    ← canonical name enforce │
│                                                      │
│  Output: NormalizedSignal { canonical, emotional }   │
└───────────────────────┬─────────────────────────────┘
                        │ canonical text only
                        ▼
┌─────────────────────────────────────────────────────┐
│  FOX (GRIFF) — SCRIBE Minion Prompt Compiler         │
│                                                      │
│  Stage 1: Input sanitization                         │
│  Stage 2: Tone rehabilitation                        │
│  Stage 3: Intent extraction → engineer-speak         │
│  Stage 4: Constraint enforcement (GUARDIAN feed)     │
│  Stage 5: COSTAR+ validation                         │
│  Stage 6: Prompt compilation → template injection    │
│                                                      │
│  Output: CompiledPrompt { costar, template_id, vars }│
└─────────────────────────────────────────────────────┘
         │
         ▼
   MAESTRO pipeline (clean canonical signal only)
```

---

## Part 1 — ROSETTA

### Core Types

```rust
// kernel/devpulse-clyffy/src/cortex/rosetta/types.rs

/// Raw user expression — stored in Interpreter Log only.
/// NEVER passed to MAESTRO, NEVER embedded, NEVER in analytics.
#[derive(Debug, Clone)]
pub struct RawExpression {
    pub text: String,
    pub session_id: String,
    pub timestamp_ms: i64,
}

/// What comes out of Rosetta — the only form MAESTRO sees.
#[derive(Debug, Clone)]
pub struct NormalizedSignal {
    /// Canonical clean text — all replacements applied.
    pub canonical: String,
    /// Emotional intensity score 0.0–1.0 (feeds PSYCH minion).
    pub frustration_score: f32,
    /// Detected emotional state for PSYCH voice selection.
    pub emotional_state: EmotionalState,
    /// Which layers fired (for Interpreter Log diff display).
    pub layers_applied: Vec<RosettaLayer>,
    /// Whether a rage review entry was created.
    pub rage_queued: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum EmotionalState {
    Neutral,
    Frustrated,
    Urgent,
    Confused,
    Satisfied,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RosettaLayer {
    HardReplacement,
    VocabularyMap,
    SemanticEncoder,
    OntologyAlignment,
}

### Layer 1 — Hard Replacement (machine-speed lookup)

The zero-tolerance layer. Fires before any model inference.
Exact string match → canonical replacement. No ML, no ambiguity.

```rust
// kernel/devpulse-clyffy/src/cortex/rosetta/hard_block.rs

/// A single hard replacement rule.
/// DevPulse ships a default set. Users can ADD but not remove defaults.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct HardRule {
    /// Exact trigger string (case-insensitive match).
    pub trigger: String,
    /// What it becomes in canonical form.
    pub replacement: String,
    /// Emotional signal to inject alongside replacement.
    pub emotional_signal: EmotionalState,
    /// Whether this rule is a DevPulse default (locked from deletion).
    pub locked: bool,
}

/// The hard block table — loaded from TOML at startup.
/// Location: kernel/devpulse-clyffy/config/rosetta/hard_block.default.toml
/// User overrides: {userdata_dir}/config/rosetta/hard_block.toml (additive only)
pub struct HardBlockTable {
    rules: Vec<HardRule>,
}

impl HardBlockTable {
    /// Apply all rules. O(n*m) but n is small (<500 rules typically).
    /// Returns (canonical_text, Option<EmotionalState>)
    pub fn apply(&self, input: &str) -> (String, Option<EmotionalState>) {
        let mut result = input.to_lowercase();
        let mut detected_emotion = None;
        for rule in &self.rules {
            if result.contains(&rule.trigger) {
                result = result.replace(&rule.trigger, &rule.replacement);
                detected_emotion = Some(rule.emotional_signal.clone());
            }
        }
        (result, detected_emotion)
    }
}
```

Default TOML format:
```toml
# hard_block.default.toml — DevPulse defaults. locked = true.
# These are machine-readable replacement rules, not content policy.

[[rules]]
trigger = "[slur-class-a]"       # stored as enum variant, not literal
replacement = "frustrated"
emotional_signal = "frustrated"
locked = true

[[rules]]
trigger = "this shit"
replacement = "this issue"
emotional_signal = "frustrated"
locked = false   # user can remove non-locked rules
```

### Layer 2 — Vocabulary Map (user expression profile)

Personal aliases. User controls this completely.
`user-expression-profile.toml` — per-user, not shipped.

```toml
# {userdata_dir}/config/rosetta/expression-profile.toml
# User-defined vocabulary translations

[[aliases]]
from = "the thingy"
to = "the model loader"

[[aliases]]
from = "the purple thing"
to = "The Connectome"

[[aliases]]
from = "forge thing"
to = "Forge (JIT context compiler)"
```

### Layer 3 — Semantic Encoder (small model, CPU)

A 0.1–0.3B SafeTensors model trained via Unsloth on DevPulse dev env.
**Not shipped as part of core install** — optional enhancement.
Handles novel phrasings not caught by Layers 1–2.

```rust
// kernel/devpulse-clyffy/src/cortex/rosetta/encoder.rs

pub struct SemanticEncoder {
    model: Option<candle_core::Tensor>, // None = layer disabled
    device: candle_core::Device,
}

impl SemanticEncoder {
    /// Output: (canonical_text, frustration_score 0.0-1.0)
    pub fn encode(&self, text: &str) -> (String, f32) {
        match &self.model {
            None => (text.to_string(), 0.0), // pass-through if not loaded
            Some(_model) => {
                // forward pass → canonical text + scalar frustration score
                todo!("Unsloth-trained encoder forward pass")
            }
        }
    }
}
```

### Layer 4 — Ontology Alignment

Maps user's canonical output to DevPulse's registered component names.
Reads from `ontology.toml` — the same SSOT used everywhere else.

```rust
// Ensures "the graph tool" → "The Connectome"
// Ensures "meistro" → blocked (banned alias)
// Ensures "maestro" → passes (not a banned alias at user layer)
pub fn align_to_ontology(text: &str, ontology: &OntologyRegistry) -> String {
    // replace known aliases with canonical names
    // flag banned aliases for Interpreter Log
    todo!()
}
```

### Rage Review Queue

When PSYCH detects frustration_score > 0.7 on any signal, the raw
expression is parked for structured review rather than immediately
processed at full cognitive cost.

```rust
// kernel/devpulse-clyffy/src/cortex/rosetta/rage_review.rs

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RageReviewEntry {
    pub id: String,
    /// Canonical summary — what Rosetta extracted as technical content.
    pub canonical_summary: String,
    /// Component names mentioned (from ontology alignment pass).
    pub components_mentioned: Vec<String>,
    /// Frustration score at time of capture.
    pub frustration_score: f32,
    /// Session timestamp.
    pub captured_at: i64,
    pub status: RageReviewStatus,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum RageReviewStatus {
    /// Waiting for system idle to process.
    Pending,
    /// Converted to structured GUARDIAN task.
    Converted,
    /// Dismissed by user.
    Dismissed,
}
```

Raw expression is NEVER stored in RageReviewEntry.
Only: emotional score + canonical technical content + components.

### Interpreter Log (UI transparency layer)

The Interpreter Log is the UI surface showing what Rosetta did.
Visible in dev mode. User can see the diff and bypass with "Wrong" button.

```
┌─ Interpreter Log ─────────────────────────────────────────────┐
│                                                                │
│  You said:    "this fucking connectome thing is broken again" │
│  Rosetta:     "frustrated · The Connectome is not responding" │
│                                                               │
│  Layers fired: [Hard replacement] [Ontology alignment]        │
│  Emotional:   frustrated (0.83)                               │
│                                                               │
│  [✓ Correct]  [✗ Wrong — use my original]                     │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

"Wrong" button bypasses Rosetta output and sends raw expression
directly (after stripping Layer 1 hard blocks — those are permanent).

---

## Part 2 — FOX (GRIFF) — SCRIBE Minion

### Identity

Fox (Griff) is the canonical name for the SCRIBE minion persona.
A cunning red fox in ColdLight cel-shaded style. Carries a quill.
Bilingual: speaks vibe AND engineer. Translates between them.

Fox is NOT a censor. Fox is a personal trainer and economic protector.
The user defines their own rehabilitation rules. DevPulse ships defaults.

### Fox Pipeline (6 Stages)

```rust
// kernel/devpulse-clyffy/src/cortex/minions/scribe/fox.rs

pub struct FoxPipeline {
    pub stage1_sanitizer: InputSanitizer,
    pub stage2_rehabilitator: ToneRehabilitator,
    pub stage3_intent: IntentExtractor,
    pub stage4_constraints: ConstraintEnforcer,
    pub stage5_costar: CostarValidator,
    pub stage6_compiler: PromptCompiler,
}

/// The final compiled prompt — what gets sent to MAESTRO / LLM.
#[derive(Debug, Clone)]
pub struct CompiledPrompt {
    /// The assembled COSTAR+ prompt string.
    pub prompt: String,
    /// Which template category was used.
    pub template_id: PromptTemplateId,
    /// COSTAR+ dimensions satisfied.
    pub costar_satisfied: CostarDimensions,
    /// Variables injected into the template.
    pub vars: std::collections::HashMap<String, String>,
    /// Token estimate for budget planning.
    pub estimated_tokens: usize,
}
```

### Stage 3 — Intent Extraction (vibe → engineer)

The core translation. Fox speaks both languages.

```
User says:  "add the login thing"
Fox output: "Create a LoginForm component in src/features/auth/components/
             following the existing pattern in SignupForm.tsx. Use React Hook
             Form for validation. Integrate with authService in src/services/.
             Do not create new abstractions or a /core folder. Match the
             existing error handling pattern in useAuth hook."
```

### Stage 5 — COSTAR+ Validation

Fox enforces all 7 COSTAR+ dimensions before compilation.
Missing dimensions → Fox asks the user (progressive disclosure UI).

```rust
#[derive(Debug, Clone, Default)]
pub struct CostarDimensions {
    pub context: Option<String>,      // repo patterns, recent changes
    pub objective: Option<String>,    // translated from vibe-speak
    pub style: Option<String>,        // industry terminology
    pub tone: Option<String>,         // matched to user competency
    pub audience: Option<String>,     // the AI model, optimized
    pub response: Option<String>,     // format, no-quirks enforcement
    pub instance_context: Option<String>, // IC — replaces ANS dimension
}

impl CostarDimensions {
    pub fn is_satisfied(&self) -> bool {
        self.context.is_some()
            && self.objective.is_some()
            && self.style.is_some()
            && self.tone.is_some()
            && self.audience.is_some()
            && self.response.is_some()
            && self.instance_context.is_some()
    }
}
```

---

## Part 3 — Prompt Template System

### Template Registry

Every prompt category is a named template with typed variable slots.
Templates live in `kernel/devpulse-clyffy/config/prompt_templates/`.
Same load pattern as InteractionTemplate — TOML, include_str!, user override.

```rust
// kernel/devpulse-clyffy/src/cortex/rosetta/templates.rs

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum PromptTemplateId {
    // ── Planning & Brainstorming ──────────────────────────────────
    PlanFeature,
    Brainstorm,
    BreakdownTask,
    SprintPlanning,
    ArchitectureReview,

    // ── Development ───────────────────────────────────────────────
    ImplementFeature,
    RefactorCode,
    WriteTests,
    CodeReview,
    FixBug,
    ExplainCode,
    DocumentCode,

    // ── Security & Guardrails ─────────────────────────────────────
    SecurityAudit,
    VulnerabilityCheck,    // feeds GUARDIAN → safety/patterns.rs
    DependencyReview,
    AuthFlow,
    InputValidation,

    // ── Debugging ─────────────────────────────────────────────────
    DebugError,
    TraceIssue,
    PerformanceProfile,
    InspectState,
    LogAnalysis,

    // ── Project Management ────────────────────────────────────────
    WritePrd,
    StakeholderUpdate,
    TechnicalSpec,
    RiskAssessment,

    // ── Learning & Explanation ────────────────────────────────────
    ExplainConcept,
    TeachBestPractice,
    CompareApproaches,

    // ── DevPulse-specific ─────────────────────────────────────────
    OnboardProject,         // first-run project context gathering
    SlotRecovery,           // guided model slot repair
    PromptReview,           // self-review: "is this prompt good?"
}

/// A single prompt template with typed variable slots.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PromptTemplate {
    pub id: PromptTemplateId,
    /// UI display name for dropdown.
    pub label: String,
    /// UI category for grouping.
    pub category: TemplateCategory,
    /// Short description shown in tooltip.
    pub description: String,
    /// The COSTAR+ template body. Use {{var_name}} for injection slots.
    pub body: String,
    /// Required variables that must be filled before compilation.
    pub required_vars: Vec<TemplateVar>,
    /// Optional variables with defaults.
    pub optional_vars: Vec<TemplateVar>,
    /// Which COSTAR+ dimensions this template pre-fills.
    pub prefills: CostarDimensions,
    /// Complexity hint — drives brain model selection.
    pub complexity: TemplateComplexity,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TemplateCategory {
    Planning,
    Development,
    Security,
    Debugging,
    ProjectManagement,
    Learning,
    DevPulse,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TemplateVar {
    pub name: String,
    pub label: String,          // UI label for the input field
    pub placeholder: String,    // hint text
    pub var_type: VarType,
    pub default: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VarType {
    Text,           // free text input
    CodeBlock,      // multi-line code input
    Dropdown(Vec<String>), // predefined options
    FilePath,       // file picker
    SlotRef,        // model slot selector
    Bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TemplateComplexity {
    Quick,      // voice.brain (1B) handles alone
    Standard,   // SMALL_LLM sufficient
    Deep,       // LARGE_LLM required
    Critical,   // LARGE_LLM + GUARDIAN review
}

---

## Part 4 — UI Interface

### Clyffy Status Bar

Always visible at top of chat surface. Shows current system state.
Layman mode: plain language. Dev mode: canonical slot names + thermal.

```
┌─ Clyffy ─────────────────────────────────────────────────────────────┐
│  ● Active  │  Project: DevPulse v1.2  │  Brain: Phi-4 15B (Hot)       │
│            │  Session: 4h 23m         │  Minions: 8/8 ●               │
│            │  Mode: Developer         │  Voice: ● Live                 │
└──────────────────────────────────────────────────────────────────────┘
```

Dev mode adds:
```
chat.brain: Phi-4-15B [Hot] 9.5GB | minion.shared: Qwen3-0.6B [Hot] |
rag.embedder: [Cold] | voice.stt: [Signal] | GUARDIAN: ● | PSYCH: calm
```

### Mode Selector Tabs

```
[ Developer ] [ Planning ] [ Security ] [ Debug ] [ General ]
```

Each mode tab preloads a default `PromptTemplateId` set in the
template picker and adjusts PSYCH's voice profile.

| Mode | Default Templates | PSYCH Profile | Brain Policy |
|---|---|---|---|
| Developer | ImplementFeature, FixBug, CodeReview | clyffy-focused | LARGE_LLM active |
| Planning | PlanFeature, Brainstorm, SprintPlanning | clyffy-default | SMALL_LLM sufficient |
| Security | SecurityAudit, VulnerabilityCheck | clyffy-focused | LARGE_LLM + GUARDIAN |
| Debug | DebugError, TraceIssue, LogAnalysis | clyffy-focused | LARGE_LLM active |
| General | ExplainConcept, TeachBestPractice | clyffy-casual | SMALL_LLM |

### Template Picker Dropdown

Sits below the mode tabs. Changes the active prompt template.

```
┌─ Prompt Template ──────────────────────────────────────────────┐
│  [Planning ▼]  [Plan a Feature ▼]                              │
│                                                                │
│  Planning                                                      │
│    ● Plan a Feature                                            │
│    ○ Brainstorm                                                │
│    ○ Break Down Task                                           │
│    ○ Sprint Planning                                           │
│    ○ Architecture Review                                       │
│  ─────────────────────────                                     │
│  Development                                                   │
│    ○ Implement Feature                                         │
│    ○ Refactor Code                                             │
│    ○ Write Tests                                               │
│    ○ Code Review                                               │
│    ○ Fix Bug                    ← auto-selected in Debug mode  │
│    ○ Explain Code                                              │
│  ─────────────────────────                                     │
│  Security                                                      │
│    ○ Security Audit                                            │
│    ○ Vulnerability Check                                       │
│    ○ Dependency Review                                         │
│  ─────────────────────────                                     │
│  Debugging                                                     │
│    ○ Debug Error                                               │
│    ○ Trace Issue                                               │
│    ○ Performance Profile                                       │
│    ○ Log Analysis                                              │
└────────────────────────────────────────────────────────────────┘
```

### Template Variable Injection Panel

When a template is selected, the variable slots surface below the
picker. Fox auto-fills what it can from CAG context.

```
┌─ Plan a Feature ──────────────────────────────────────────────────┐
│  Description: Plan feature implementation with COSTAR+ context    │
│  Complexity:  ◉ Standard  ○ Deep  ○ Quick                         │
│                                                                   │
│  Feature name *                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ e.g. "user authentication flow"                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Current component (auto-detected from file context)              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ src/features/auth/  ← Fox detected from active file         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Tech constraints        [+ Add constraint]                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ No new abstractions · Match existing patterns               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Target tool    [Cursor ▼]  [Claude Code ▼]  [Bolt ▼]            │
│                                                                   │
│  COSTAR+ coverage:  ████████░░  6/7 dimensions                   │
│  Missing: Instance Context — [Fill now]                           │
│                                                                   │
│  [🔍 Preview Prompt]  [🚀 Send to Clyffy]                         │
└───────────────────────────────────────────────────────────────────┘
```

### Interpreter Log Panel (Rosetta transparency)

Collapsible panel below the chat input. Visible in dev mode by default.
Layman mode: off by default, user can enable.

```
┌─ Interpreter Log ─ [Show ▼] ─────────────────────────────────────┐
│                                                                   │
│  ● 14:23:01  Layers: [Hard block] [Vocabulary map]               │
│  You:     "the forge thing is being slow as shit"                │
│  Clyffy:  "Forge (JIT context compiler) response time degraded"  │
│  Emotion: frustrated (0.71) → PSYCH: clyffy-focused selected     │
│  [✓ Correct] [✗ Wrong]                                           │
│                                                                   │
│  ● 14:22:44  Layers: [Ontology alignment]                        │
│  You:     "the graph viewer thing"                               │
│  Clyffy:  "The Connectome"                                       │
│  [✓ Correct] [✗ Wrong]                                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Rosetta Config Panel (Settings → Expression)

```
┌─ Settings › Expression ───────────────────────────────────────────┐
│                                                                   │
│  Expression normalization                     [● Enabled]         │
│  ─────────────────────────────────────────────────────────────── │
│  Aggressiveness                                                   │
│  ○ Strict    ● Balanced    ○ Relaxed                              │
│                                                                   │
│  Hard replacement rules                       [● DevPulse defaults]│
│  User rules:  [+ Add rule]                                        │
│  ┌─ "this shit" → "this issue"  [✗] ──────────────────────────┐  │
│  │ emotional: frustrated                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Vocabulary map (personal aliases)            [Edit →]            │
│  "the thingy" → "model loader"                                   │
│  "purple thing" → "The Connectome"                               │
│  [+ Add alias]                                                    │
│                                                                   │
│  Semantic encoder model                                           │
│  ○ Not installed   ● Installed (rosetta-encoder-v1.safetensors)  │
│  [Download 180MB]  [Remove]                                      │
│                                                                   │
│  Rage review queue                                                │
│  3 entries pending review  [Review now →]                        │
│                                                                   │
│  Interpreter Log                              [● Show in chat]    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Part 5 — Module Structure

```
kernel/devpulse-clyffy/src/cortex/rosetta/
├── mod.rs                  ← public API: normalize(), RosettaPipeline
├── types.rs                ← RawExpression, NormalizedSignal, EmotionalState
├── hard_block.rs           ← HardBlockTable, HardRule, apply()
├── vocabulary.rs           ← UserExpressionProfile, VocabularyMap
├── encoder.rs              ← SemanticEncoder (optional Candle model)
├── ontology.rs             ← align_to_ontology(), OntologyRegistry bridge
├── rage_review.rs          ← RageReviewEntry, RageReviewQueue
└── interpreter_log.rs      ← InterpreterLogEntry, diff display types

kernel/devpulse-clyffy/src/cortex/minions/scribe/
├── mod.rs
├── fox.rs                  ← FoxPipeline, CompiledPrompt
├── intent.rs               ← IntentExtractor, vibe→engineer translation
├── costar.rs               ← CostarValidator, CostarDimensions
└── rehabilitator.rs        ← ToneRehabilitator

kernel/devpulse-clyffy/src/cortex/rosetta/
config/rosetta/
├── hard_block.default.toml     ← locked DevPulse defaults
└── prompt_templates/
    ├── planning.default.toml
    ├── development.default.toml
    ├── security.default.toml
    ├── debugging.default.toml
    ├── project_management.default.toml
    ├── learning.default.toml
    └── devpulse.default.toml
```

---

## Part 6 — Data Flow & Storage

```
RawExpression
    │ Layer 1-4
    ▼
NormalizedSignal → libSQL: interpreter_log table (raw NEVER stored)
    │
    ├── frustration_score > 0.7 → libSQL: rage_review table
    │
    ▼
FoxPipeline → CompiledPrompt
    │
    ├── CostarDimensions → libSQL: turns table (prompt metadata)
    ├── template_id → DuckDB: analytics (which templates used)
    └── prompt → MAESTRO → LLM
```

### libSQL Schema Additions

```sql
-- Interpreter log — raw expression NEVER stored here
CREATE TABLE interpreter_log (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    turn_id     TEXT,
    canonical   TEXT NOT NULL,         -- what Rosetta produced
    layers_applied TEXT NOT NULL,      -- JSON array of RosettaLayer
    frustration_score REAL NOT NULL,
    emotional_state TEXT NOT NULL,
    rage_queued INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL
);

-- Rage review queue
CREATE TABLE rage_review (
    id                  TEXT PRIMARY KEY,
    canonical_summary   TEXT NOT NULL,
    components_mentioned TEXT NOT NULL, -- JSON array
    frustration_score   REAL NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending',
    captured_at         INTEGER NOT NULL,
    reviewed_at         INTEGER
);

-- Template usage (for ROTI and learning)
CREATE TABLE prompt_template_usage (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL,
    template_id TEXT NOT NULL,
    mode_tab    TEXT NOT NULL,
    complexity  TEXT NOT NULL,
    costar_satisfied INTEGER NOT NULL,
    created_at  INTEGER NOT NULL
);
```

---

## Part 7 — Implementation Order

```
P1: Rosetta types + hard_block.rs (no model needed, pure logic)
P2: VocabularyMap + TOML loader + user override path
P3: InterpreterLog types + libSQL schema migration
P4: FoxPipeline scaffold + CostarDimensions validator
P5: PromptTemplate registry + TOML files for all 7 categories
P6: UI: Clyffy status bar + mode tabs + template picker dropdown
P7: UI: Template variable injection panel + COSTAR+ coverage meter
P8: UI: Interpreter Log panel + Rosetta settings panel
P9: SemanticEncoder (optional, Unsloth training separate sprint)
P10: RageReviewQueue + rage_review libSQL table + review UI
```

P1-P5 are kernel-only, no UI. P6-P8 are UI sprints.
P9 is a training sprint (separate from this spec).
P10 can run in parallel with P6-P8.

---

## What Is NOT In This Spec

| Concern | Lives In |
|---|---|
| PSYCH voice profile selection | `minions/psych/` |
| GUARDIAN vulnerability scanning | `safety/patterns.rs` (existing) |
| TEACHER terminology disclosure | `minions/teacher/` |
| CAG context assembly | `cortex/cag/pipeline.rs` (existing) |
| Telemetry / ROTI scoring | `systems/infra/devpulse-telemetry` |
| Fox training data format | `SPRINT-ML-ROSETTA-ENCODER.md` (future) |
| Tool-specific frames (Cursor/Bolt) | `cortex/frames/` (future) |

---

*See also: MINION_BRAIN_SPEC.md (escalation), LEXICON_VOICE_SPEC.md
(PSYCH voice selection), SIDECAR.md (DevForge bridge), ADR.md*
