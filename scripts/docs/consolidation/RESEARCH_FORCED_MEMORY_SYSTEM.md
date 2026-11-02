# Cutting-Edge Research: Forced Memory + Hierarchical Sub-Rows


| Field | Value |
|-------|-------|
| Compiled | 2026-05-08 |
| Question | What are the 2026 cutting-edge approaches for: forced memory enforcement, hierarchical memory tiers (global + project) with sub-rows, strict mandatory memory injection? |
| Source coverage | Mar-May 2026 papers + production framework docs |

---

## TL;DR — Owner's vision matches state-of-the-art

The owner's directive (LOCK P-5):
> "We want a system that works strictly and my hub should discuss this but we actually force the use of memories, and we can do the same for global and those will have sub rows"

This is **exactly** the architectural pattern that Letta (formerly MemGPT) productionized as "Memory Blocks" — and what the broader 2026 research literature calls **"Adaptive Memory Systems with Explicit Hierarchical Memory Management."** Owner's intuition is current state-of-the-art.

---

## A. THE MEMORY BLOCKS PATTERN (Letta / MemGPT canonical architecture)

Memory blocks are the production-proven pattern for FORCED memory injection. The mechanics:

| Property | Behavior |
|----------|----------|
| **Pinned to context** | Always visible in every LLM call. Forced. Not optional. |
| **Structured + labeled** | Each block has a name and a purpose (e.g., "human", "persona", "project_state") |
| **Character-limited** | Default 2000 chars per block. Customizable. Caps token cost. |
| **Editable by agent** | Agent calls memory_insert / memory_replace tools to update |
| **Editable externally** | External scripts can sync blocks (e.g., file watcher syncs file content into a block) |
| **Shareable across agents** | Multiple agents can read same block, see live updates |
| **Read-only flag available** | Per-block lock — agent reads but cannot modify |

**Critical insight:** Memory blocks are NOT retrieved-then-injected. They are **already in the context window every turn.** The agent doesn't "decide to remember" — the block is forced into every prompt by the runtime.

This is exactly the "force the use of memories" requirement. The runtime injects the block. The LLM has no choice.

---

## B. THE TWO-TIER PATTERN MATCHES OWNER'S VISION

The Letta AI Memory SDK formalizes the two-tier pattern with sub-rows. Their terminology:

`
SUBJECTS (top-level scope)
    │
    ├── BLOCKS (sub-rows within a subject)
    │
    └── BLOCKS
`

Direct mapping to owner's vision:

| Owner's term | Letta / 2026 research term | What it is |
|--------------|---------------------------|------------|
| **Global tier** | Subject = "global" | Cross-project, platform-wide memory scope |
| **Project tier** | Subject = "project_<id>" | Per-project memory scope |
| **Sub-rows** | Memory blocks within a subject | Named, character-limited slots inside a tier |

Real Letta example from their docs:
`
Subject: project_alpha
  Block: human          (who's working on this)
  Block: summary        (current state)
  Block: policies       (rules & constraints)
  Block: history        (decision log)
  Block: preferences    (style, conventions)
`

For owner's DevPulse stack, this could become:
`
GLOBAL SUBJECT
  Block: persona        (Clyffy character & voice)
  Block: dev_iq         (cross-project competency level)
  Block: ai_resources   (which API keys / subscriptions are active)
  Block: global_patterns (cross-project learned patterns)
  Block: prefs          (user preferences platform-wide)

PROJECT_<id> SUBJECT
  Block: project_state  (current state, tech stack)
  Block: build_plan     (what's being built, sprint)
  Block: constitution   (project constraints, never-do rules)
  Block: recent_decisions (last N decisions made)
  Block: open_loops     (unresolved items)
  Block: anchors        (must-keep facts)
`

---

## C. STRICT ENFORCEMENT — THE 2026 ADVANCES

The owner's "strict" requirement maps to recent papers:

### MemArchitect (March 2026) — Policy-Driven Memory Governance
arxiv.org/pdf/2603.18330

Key insight: **memory hallucination** is when an agent retrieves conflicting outdated facts (e.g., "user is single" from 2024 alongside "user is married" from 2025). Strict enforcement requires:
- Policy-driven write rules (not all writes accepted)
- Conflict detection at read time
- Versioned facts with timestamps
- Forced expiration policies per block type

### AgentSys (Feb 2026) — Explicit Hierarchical Memory Management
arxiv.org/pdf/2602.07398

Key insight: **indiscriminate memory accumulation** is a security and quality vulnerability. Old systems just append everything to context. Strict enforcement requires:
- Selective injection per turn (not everything always)
- Hierarchical memory with explicit promotion/demotion gates
- Read-only locks on critical content (prompt injection defense)
- Per-tier write policies

### Mem0 vs Letta architectural philosophy split
vectorize.io/articles/mem0-vs-letta

- **Mem0 = retrieval philosophy.** Memory stored externally, retrieved on demand. NOT what owner wants.
- **Letta = pinned-context philosophy.** Memory blocks always in window, forced. WHAT OWNER WANTS.

The "force the use of memories" directive specifically points away from RAG-style retrieval and toward Letta's pinned-block model.

---

## D. HIERARCHICAL SUB-ROW MECHANICS — THE SPEC

Per Letta + 2026 research, the sub-row pattern needs:

| Property | Details |
|----------|---------|
| **Tier name** | "global" or "project_<id>" |
| **Block name** | Human-readable label (persona, build_plan, etc.) |
| **Block description** | Tells the agent what the block is for |
| **Block value** | The actual content, character-limited |
| **Block character limit** | Hard cap (default 2000, customizable per block) |
| **Block read-only flag** | Boolean, defaults false |
| **Block last_updated** | Timestamp |
| **Block updater_id** | Who/what wrote this last (agent ID, external script ID, user) |
| **Block conflict_with** | Optional list of block IDs that this conflicts with |
| **Block force_load** | Boolean — must this be in every context? Default true. |

**Sub-block / sub-row mechanic:**
Letta does NOT support nested blocks-within-blocks natively. The 2026 research refers to "structured" sub-content INSIDE a block — JSON or YAML payload with sub-fields, but the BLOCK itself is the leaf.

**Two ways to do "sub-rows":**

| Approach | Pros | Cons |
|----------|------|------|
| **(1) Flat blocks per concept**: persona, dev_iq, ai_resources, ... all separate blocks at tier level | Simple. Each block independently editable. Letta-native. | More blocks = more context cost. No grouping affordance. |
| **(2) Grouped blocks with structured payload**: "persona" block contains JSON {name, traits, voice, ...} | Logical grouping. Less context overhead. | Edits require parsing+re-emitting JSON. Brittle if model formatting drifts. |

**Owner's "sub-rows" comment likely means approach 1** — multiple flat blocks per tier, each with its own purpose and character limit. The "rows" are the blocks at the tier level. Owner can confirm.

---

## E. WHAT'S CUTTING-EDGE BEYOND LETTA (May 2026)

### Sleep-Time Compute (Letta's newer pattern)
Memory updates run ASYNC in a "subconscious agent" — between user turns, a background agent processes the conversation and updates blocks. Non-blocking. Maps directly to owner's "Subconscious / Layer 1" vision in RRO architecture (LOCK A-7).

### MemoryAgent-Bench, MemoryArena (2026 benchmarks)
Test suites that measure whether agents actually use injected memory correctly under adversarial pressure. Directly relevant to "strict enforcement" claims.

### G-Memory (June 2025) — Hierarchical Memory for Multi-Agent Systems
For council-style architectures (Clyffy + 9 minions), G-Memory provides shared-memory blocks across agents with isolation guarantees. Each minion can have its own scope but reference the global tier. Aligns with owner's Council architecture.

### Memory-R1 (2025) — Reinforcement-Learned Memory Management
Beyond rule-based eviction. Uses RL to learn what to write/promote/forget. Long-term option once owner's stack is stable enough to bootstrap data.

---

## F. RECOMMENDATIONS FOR OWNER'S DEVPULSE PLATFORM

| Recommendation | Why |
|----------------|-----|
| Adopt Letta's "memory blocks" terminology | Industry standard 2026, maps to owner's "sub-rows" |
| Two top-level subjects: "global" and "project_<id>" | Maps to owner's two tiers |
| Force-inject every block in every turn | Owner directive: "force the use of memories" |
| Per-block character limits | Cap context cost per tier independently |
| Read-only flag on Constitution + critical persona | Prompt injection defense (per AgentSys) |
| Separate "sleep-time" agent that updates blocks async | Don't block user turns with memory writes |
| Block conflict detection at write time | Prevents memory hallucination (per MemArchitect) |
| Storage layer = libSQL for block metadata, content as TEXT field | Aligns with LOCK E-1 libSQL SSOT |
| Cross-tier reference rule: project blocks can REFERENCE global blocks but never WRITE to them | Aligns with LOCK O-4 (project pulls from global, never pushes) |

---

## G. RUST IMPLEMENTATION NOTES

For owner's Rust stack, this is well-trodden ground:

| Component | Rust crate / approach |
|-----------|----------------------|
| Block storage | libSQL via libsql crate, block content as TEXT, metadata as JSON |
| Async block updates | tokio::spawn with broadcast channel for "block updated" events |
| Force-injection in prompt assembly | A Rust function that pulls all blocks for tier, formats with block descriptions, prepends to system message |
| Character limit enforcement | Validate at write time, reject if over limit (no silent truncation) |
| Conflict detection | Optional cross-block consistency check at write — Cortex level, not RRO level |
| Read-only locks | Boolean flag in libSQL row, write API rejects if locked |

This is straightforward. Letta proves the pattern works. The Rust implementation is just porting the pattern.

---

## H. CITATIONS

- Letta Memory Blocks docs — docs.letta.com/guides/core-concepts/memory/memory-blocks/
- Letta Context Hierarchy — docs.letta.com/guides/agents/context-hierarchy/
- Letta Shared Memory — docs.letta.com/guides/core-concepts/memory/shared-memory/
- Letta AI Memory SDK — github.com/letta-ai/ai-memory-sdk
- MemArchitect (Mar 2026) — arxiv.org/pdf/2603.18330
- AgentSys (Feb 2026) — arxiv.org/pdf/2602.07398
- Memory for Autonomous LLM Agents survey (Mar 2026) — arxiv.org/pdf/2603.07670
- GAM Hierarchical Graph-based Agentic Memory — arxiv.org/html/2604.12285v1
- Mem0 vs Letta comparison (Mar 2026) — vectorize.io/articles/mem0-vs-letta
- Best AI Agent Memory Systems 2026 — vectorize.io/articles/best-ai-agent-memory-systems

---

*End of research. Use alongside LOCKED_DECISIONS.md Section P when speccing the forced memory system.*
