# Forced Memory Block Schema — Spec


| Field | Value |
|-------|-------|
| Status | DRAFT - Owner review |
| Version | 0.1.0 |
| Last Updated | 2026-05-08 |
| Owner | @jesse |
| Part of | DevPulse Platform / Cortex |
| Depends on | LOCKED_DECISIONS.md sections O, P, N, B, A; RESEARCH_FORCED_MEMORY_SYSTEM.md |

---

## 1. Purpose

The intelligence layer is the product. Cursor, Gemini, ChatGPT, Claude (this chat) are CONSUMERS that wrap DevPulse. They are interchangeable. The intelligence layer is the moat.

This spec defines the FORCED MEMORY BLOCK system — the structured, character-limited, always-pinned memory that gets injected into every LLM call. It's the foundation of how DevPulse builds a profile of the user over time, distills disposable chat content into durable preferences, and presents a coherent persona across consumer apps.

## 2. Scope

This spec covers:

- The two-tier hierarchy (global, project)
- Flat block schema within each tier
- Block lifecycle (create, update, lock, expire)
- The chat distillation pipeline (chats are raw material, blocks are gold)
- The disposable-but-mineable chat tier
- Cross-consumer behavior (same blocks visible to Cursor, Gemini, ChatGPT, Claude)

This spec does NOT cover:

- The retrieval / RAG path (RRO)
- The minion / Council orchestration
- The Cortex 8-state machine
- Specific UI surfaces
- Provider-specific adapters (those wrap this spec)

## 3. Two-Tier Hierarchy

`
DEVPULSE PLATFORM
│
├── GLOBAL TIER  (one instance, cross-project, cross-consumer)
│   │
│   ├── block: persona
│   ├── block: dev_iq
│   ├── block: ai_resources
│   ├── block: user_preferences
│   ├── block: communication_style
│   ├── block: pinned_facts
│   └── block: cross_project_patterns
│
└── PROJECT TIERS  (one per project)
    │
    project_<id>
    │
    ├── block: project_state
    ├── block: build_plan
    ├── block: constitution
    ├── block: anchors
    ├── block: open_loops
    ├── block: recent_decisions
    └── block: stack_inventory
`

Per LOCK O: Global is the cognition substrate. Project tiers TAP INTO global on demand. Projects pull FROM global, never push contamination INTO global.

## 4. Block Schema (the data type)

`ust
pub struct MemoryBlock {
    // Identity
    pub id: BlockId,                    // UUID
    pub tier: Tier,                     // Global | Project { id: ProjectId }
    pub name: BlockName,                // 'persona', 'build_plan', etc.
    pub description: String,            // What this block is for (used by extractor)

    // Content
    pub value: String,                  // The actual block content (text)
    pub char_limit: usize,              // Hard cap, default 2000
    pub format: BlockFormat,            // PlainText | Markdown | Yaml | Json

    // Governance
    pub read_only: bool,                // If true, agents cannot modify
    pub force_load: bool,               // If true, always in context (default true)
    pub priority: BlockPriority,        // Determines load order if char budget tight

    // Provenance
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub updater: Updater,               // Who/what wrote this last
    pub source_chats: Vec<ChatId>,      // Which chats this was distilled from

    // Conflict / quality
    pub confidence: f32,                // 0.0 to 1.0, how sure are we
    pub conflict_with: Vec<BlockId>,    // Known contradictions
    pub last_verified: Option<DateTime>,

    // Lifecycle
    pub expiry_policy: ExpiryPolicy,    // Never | After(duration) | OnContradiction
    pub revision_count: u32,
}

pub enum Tier {
    Global,
    Project { id: ProjectId },
}

pub enum BlockFormat {
    PlainText,
    Markdown,
    Yaml,           // structured data
    Json,           // structured data
}

pub enum BlockPriority {
    Critical,       // Always loaded, cannot be evicted
    High,           // Loaded unless context budget exhausted
    Normal,         // Loaded if room
    Low,            // Loaded only when explicitly requested
}

pub enum Updater {
    Agent { agent_id: AgentId },
    DistillationPipeline,
    User,
    ExternalScript { script_id: String },
}

pub enum ExpiryPolicy {
    Never,
    After(Duration),
    OnContradiction,
    OnSessionEnd,
}
`

## 5. Standard Global Tier Blocks

| Block name | Purpose | Char limit | Read-only? | Format |
|------------|---------|-----------|-----------|--------|
| persona | Clyffy character, voice, traits, signature behaviors | 2000 | true | Markdown |
| dev_iq | Cross-project competency level, growth narrative, observed strengths | 1500 | false | Yaml |
| ai_resources | Active subscriptions, API keys configured, council member status | 1000 | false | Yaml |
| user_preferences | Style, tone, formatting preferences, communication mode | 2000 | false | Yaml |
| communication_style | How user talks, profanity tolerance, frustration patterns, what NOT to do | 1500 | false | Markdown |
| pinned_facts | User-pinned facts that must never be forgotten or contradicted | 2000 | true (by user only) | Markdown |
| cross_project_patterns | Patterns observed across multiple projects (architectural preferences, tooling choices) | 2000 | false | Yaml |

**Global tier total budget:** 12000 chars / ~3000 tokens. Pinned to every prompt across every consumer.

## 6. Standard Project Tier Blocks

| Block name | Purpose | Char limit | Read-only? | Format |
|------------|---------|-----------|-----------|--------|
| project_state | Current state, tech stack, what's built, what's not | 2000 | false | Markdown |
| build_plan | Active sprint, locked next-steps, parking lot | 2000 | false | Markdown |
| constitution | Project-specific never-do rules, hard constraints | 1500 | true (changes via explicit user action) | Markdown |
| anchors | Must-keep facts, decision junctions for this project | 2000 | false | Yaml |
| open_loops | Unresolved questions, parked items, blockers | 1500 | false | Markdown |
| recent_decisions | Last N decisions made, with rationale and trace links | 2000 | false | Yaml |
| stack_inventory | Languages, frameworks, services, versions in this project | 1000 | false | Yaml |

**Project tier total budget:** 12000 chars / ~3000 tokens. Loaded when in DevForge for that project.

**Combined max load:** 6000 tokens of forced context. Leaves room for retrieval + chat.

## 7. The Chat Distillation Pipeline

> "these chats are supposed to be dumped to a useful but disposable section that we can extract from commonalities and prompts that need to be automated, how i favor things etc building the profile of the customer over time"

**Chats are raw material. Blocks are the distillate.**

`
RAW CHAT (consumer = Cursor / Gemini / Claude / ChatGPT / DevPulse-native)
    │
    ▼
DISPOSABLE CHAT TIER  (Hot, full transcript, time-bound)
    │  • Full message history preserved temporarily
    │  • Indexed for retrieval but not for context injection
    │  • Auto-expires after configurable window (default 30 days)
    │  • Stored in: project DuckDB (analytics) + project libSQL (text body)
    │
    ▼
DISTILLATION PIPELINE  (sleep-time agent)
    │  • Runs async between user turns OR on idle (5+ min)
    │  • Reads recent chats from disposable tier
    │  • Extracts: implicit preferences, frustration patterns, correction signals,
    │              architectural decisions, tooling choices, communication style
    │  • Uses minion 0.6B model (cheap, NEVER blocks user)
    │  • Outputs: candidate block updates with confidence scores
    │
    ▼
GOVERNANCE GATE
    │  • Confidence threshold check (default >= 0.6 to auto-promote)
    │  • Conflict check against existing blocks
    │  • Read-only block protection enforced
    │  • If contested: surface to user via 'memory inbox' for confirm/reject
    │
    ▼
DURABLE BLOCK  (Global tier or Project tier)
    │  • Written to libSQL (SSOT)
    │  • Force-loaded in next prompt
    │  • source_chats[] retains traceability back to raw chats
`

**Disposable tier rules:**

- All raw chats land here regardless of consumer
- Indexed but NOT force-loaded
- Free to delete after extraction window
- Used as evidence trail for block provenance

**Distillation extraction targets:**

| Signal | Extracts to block | Trigger |
|--------|-------------------|---------|
| Repeated phrasing pattern | communication_style | 3+ occurrences |
| User correction ('wrong / no / not that') | user_preferences + project anchors | immediate, high confidence |
| Frustration markers | communication_style (profanity_tolerance, escalation_patterns) | accumulated over session |
| Tooling choice ('use X', 'never use Y') | stack_inventory + cross_project_patterns | first occurrence high-confidence |
| Architectural decision | recent_decisions + anchors | explicit decisions |
| Skill demonstrated | dev_iq | observable from successful task completion |
| Approval pattern ('I like this', 'good') | user_preferences | 2+ occurrences in similar context |
| API key / subscription mentioned | ai_resources | immediate |

## 8. Force-Injection Mechanics

When ANY consumer (Cursor, Gemini, ChatGPT, Claude, DevPulse-native) calls the LLM through DevPulse, the runtime ALWAYS prepends:

`
[SYSTEM PROMPT]
[--- FORCED MEMORY BLOCKS START ---]

# GLOBAL: persona
{persona block content}

# GLOBAL: dev_iq
{dev_iq block content}

# GLOBAL: communication_style
{communication_style block content}

... all global blocks ordered by priority ...

# PROJECT: project_state
{project_state block content}

# PROJECT: build_plan
{build_plan block content}

... all project blocks if in project context ...

[--- FORCED MEMORY BLOCKS END ---]
[USER MESSAGE]
`

Block ordering rule: Critical priority first, then High, Normal, Low. Within same priority, by recency of update.

If total exceeds context budget, drop from lowest priority first. Critical blocks NEVER evicted.

## 9. Cross-Consumer Behavior

The block system is consumer-agnostic. The same Global tier blocks load whether the user is in:

- DevPulse-native chat
- DevPulse → Cursor MCP integration
- DevPulse → Claude Code wrapper
- DevPulse → Gemini API session
- DevPulse → ChatGPT API session
- DevPulse → Groq / OpenRouter / etc.

Each consumer gets the SAME forced memory injected. The user's profile travels with them.

This is the moat: Cursor by itself has session memory. DevPulse-wrapped Cursor has YOUR persistent intelligence.

## 10. Storage

| Data | Backend | Notes |
|------|---------|-------|
| Block content (SSOT) | libSQL (project libSQL for project tier, global libSQL for global tier) | Per LOCK E-1 |
| Disposable chat raw text | Project libSQL (text body) | TTL configurable, default 30d |
| Chat embeddings for distillation | Project Qdrant via RRO | Per LOCK B-2 |
| Block update events | DuckDB (analytics) | Per LOCK E-2 |
| Cross-block relations | SurrealDB (graph) | Per LOCK E-2 |
| Hot block cache | Moka pattern_cache | Per LOCK E-4 |

## 11. Public API (Rust trait)

`ust
#[async_trait]
pub trait MemoryBlockStore: Send + Sync {
    // Read
    async fn get_block(&self, id: &BlockId) -> Result<MemoryBlock>;
    async fn list_blocks_for_tier(&self, tier: &Tier) -> Result<Vec<MemoryBlock>>;
    async fn assemble_forced_context(&self, project_id: Option<ProjectId>) -> Result<ForcedContext>;

    // Write
    async fn create_block(&self, spec: BlockSpec) -> Result<MemoryBlock>;
    async fn update_block(&self, id: &BlockId, value: String, updater: Updater) -> Result<MemoryBlock>;
    async fn lock_block(&self, id: &BlockId) -> Result<()>;
    async fn unlock_block(&self, id: &BlockId, reason: String) -> Result<()>;

    // Lifecycle
    async fn expire_block(&self, id: &BlockId) -> Result<()>;
    async fn detect_conflicts(&self, block: &MemoryBlock) -> Result<Vec<BlockId>>;
}

pub struct ForcedContext {
    pub blocks: Vec<MemoryBlock>,
    pub total_chars: usize,
    pub total_tokens_est: usize,
    pub assembled_prompt_section: String,  // Ready to inject
}

pub struct BlockSpec {
    pub tier: Tier,
    pub name: BlockName,
    pub description: String,
    pub initial_value: String,
    pub char_limit: usize,
    pub read_only: bool,
    pub priority: BlockPriority,
    pub format: BlockFormat,
    pub expiry_policy: ExpiryPolicy,
}
`

## 12. Open Items

- Block name namespace: should names be enum (compile-time) or string (runtime extensible)?
- Distillation cadence: idle-only (5+ min) or also after every Nth turn?
- Conflict resolution UI: surface to user inline or batch in 'memory inbox'?
- Cross-consumer auth: how does Cursor MCP authenticate to read user's blocks?
- Multi-user support: schema currently single-user, but blocks could scope by user_id later
- Promotion path: project block to global block (when does cross-project pattern earn global status)?
- Block versioning: keep history of all values or just current?

## 13. Citations

- Letta Memory Blocks (production-proven base pattern): docs.letta.com/guides/core-concepts/memory/memory-blocks/
- PersonaMem-v2 (implicit profile inference, Dec 2025): arxiv.org/pdf/2512.06688
- CIPHER (preference learning from edits): arxiv.org/pdf/2404.15269
- TrustCall (schema-driven extraction): structured-output extraction pattern
- MemArchitect (policy-driven memory governance, Mar 2026): arxiv.org/pdf/2603.18330
- Mem0 chat distillation pattern: mem0.ai/blog/llm-chat-history-summarization-guide-2025

---

*End of block schema spec. Read alongside RESEARCH_FORCED_MEMORY_SYSTEM.md and LOCKED_DECISIONS.md sections O, P, N, B, A.*
