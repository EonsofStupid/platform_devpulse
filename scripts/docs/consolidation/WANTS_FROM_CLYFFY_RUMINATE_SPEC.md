# Wants and Capabilities Extracted from Clyffy Ruminate Core Spec v1.0


| Field | Value |
|-------|-------|
| Source | Clyffy Ruminate Core Specification v1.0 |
| Extracted | 2026-05-08 |
| Purpose | Capture every WANT / CAPABILITY / PRINCIPLE owner has stated, organized for spec revision |
| Rule | No new content. No architectural decisions. Owner-stated only. |

---

## A. Core Mission Wants

| ID | Want |
|----|------|
| A-1 | Strengthen the user (core mission) |
| A-2 | Clyffy is a TRANSLATOR, not a chatbot |
| A-3 | LLM is the VOICE; Ruminate is the BRAIN |
| A-4 | Prevent architectural debt — block drift before it reaches the repository (Antigravity Principle) |
| A-5 | Enforce pattern consistency |
| A-6 | Transform lazy human prompt into senior-engineer-quality prompt |
| A-7 | Frontier model executes correctly because of pre-structured input |

## B. Philosophical Principles (Capabilities the system must embody)

| ID | Capability |
|----|------------|
| B-1 | SEAMLESS — chat always inviting, no ugly prompts, no boring checkboxes, transparency without friction |
| B-2 | ABSORBING — process screenshot, talk to minions, absorb user input — all in parallel during typing |
| B-3 | TEACHING — subtle education through friction and feedback, user learns COSTAR and patterns over time |
| B-4 | PERSISTENT — memory survives crashes, state persists, system NEVER loses context |
| B-5 | FRUSTRATION-TOLERANT — profanity is SIGNAL not violation, no asterisks, no censoring, absorb-acknowledge-help |

## C. Ruminate Transformation Engine Wants

| ID | Want |
|----|------|
| C-1 | Knows the project — patterns, folder structure, build plan, Constitution |
| C-2 | Knows COSTAR — how to structure prompts so AI succeeds |
| C-3 | Knows industry terminology — kernel, lanes (NOT "clyffy folder") |
| C-4 | Enriches lazy prompt to senior-level structured spec |
| C-5 | Layout requirements: main import declaration, component listing, separation of concerns, nested-under-layout, consistent-with-patterns, modular feature-based folder structure (per before/after example) |

## D. Pre-Prompt Context Loading Wants (parallel during typing)

| ID | Want |
|----|------|
| D-1 | Process screenshot of current IDE state |
| D-2 | Query Qdrant for semantically related files |
| D-3 | Check build plan alignment |
| D-4 | Consult RepoWatcher minion |
| D-5 | Consult Psychiatrist minion |
| D-6 | Load Constitution constraints |

## E. Memory Lifecycle Capabilities (4-tier with importance scoring)

| Tier | Purpose | Storage (per spec) | Action |
|------|---------|--------------------|--------|
| Short-Term | Working memory (current chat) | RAM / Redis | FILTER (drop noise) |
| Medium-Term | Episodic, ~2 weeks | Qdrant Fast Collection | SUMMARIZE (compress) |
| Long-Term | Semantic core knowledge | Qdrant Archive + Postgres | REINFORCE (strengthen) |
| Critical | The Soul (user prefs) | System Prompt / Pinned | PROTECT (never delete) |

**Importance score signals (range 0-100):**
- +5 when injected into prompt (actively used)
- +2 when retrieved but not top result
- -1 when retrieved but ignored by user
- -> 100 when user pins (becomes Critical tier)
- -0.5/day decay if unused

## F. Ruminator State Machine Wants

| State | Behavior |
|-------|----------|
| IDLE | User active. Ruminator waits. 5 min no-input timeout. |
| SCANNING | Collect Short-Term memories with low importance scores |
| AGGREGATING | Group related memories. Identify clusters. |
| DECIDING | Small model evaluates each cluster: PROMOTE / FLAG / DELETE |
| SLEEPING | Cycle complete. Log to Dream Log. Return to IDLE. |

**Decision algorithm — three questions per cluster:**
1. Contradiction Check — does this contradict Long-Term or Critical memory?
2. Value Assessment — does this add new actionable knowledge?
3. Redundancy Check — substantially similar to existing memory?

**Outcomes:**
- PROMOTE: valuable + no conflict -> move to higher tier
- FLAG: contradicts Critical -> alert user for resolution
- DELETE: no value or redundant -> remove

## G. Scribe Output Targets Wants

| Target | Delivery Mechanism |
|--------|--------------------|
| Lovable | Browser extension injects enhanced prompt |
| Bolt | Same browser extension mechanism |
| Replit | Same browser extension mechanism |
| Local IDE — Cursor, VS Code | MCP integration |

**Behavior:** User types casually. Clyffy handles complexity. AI executes correctly.

## H. PeerGuardian / LeftHook Wants (pre-commit drift prevention)

| ID | Want |
|----|------|
| H-1 | Drift Detection — catch code that duplicates existing patterns |
| H-2 | Build Plan Validation — does this commit advance a planned task? |
| H-3 | Pattern Consistency — match established folder structure? |
| H-4 | Blocking — prevent bad code reaching repo, surface as "Clyffy blocked N drift commits" |

## I. ROTI Metrics Wants (user-visible "fun stats")

| ID | Want |
|----|------|
| I-1 | "Clyffy blocked N drift commits this session" — savings |
| I-2 | "Clyffy transformed N prompts" — value delivered |
| I-3 | "Saved X using DevPulse" — user-facing badge |

**Critical framing:** ROTI is NOT about time saved. It is about QUALITY TRANSFORMATION.

## J. Hardware / Model Slot Capabilities (per Section 9 of source spec)

NOTE: model names below are FROM THE SOURCE DOC and are now stale per LOCKED_DECISIONS.md C-7 final stack. Listed here only for completeness of want extraction.

| Slot | Source-doc model | Source-doc VRAM | Source-doc location |
|------|------------------|-----------------|---------------------|
| Ruminator | Qwen2.5-1.5B-Instruct (Q4) | ~1.5GB | 100% LOCAL |
| Embedder | Nomic-Embed 0.6B | ~0.5GB | 100% LOCAL |
| Scribe/Translator | Qwen2.5-7B or 14B | ~8-16GB | LOCAL |
| Heavy Lift | Claude/GPT-4 | N/A | API |

**Critical Design Principle (the WANT, not the model):**
"Ruminator NEVER uses Big Brain. Small fast model runs background without lag. You don't need a genius model to say 'User worked on Auth.'"

## K. Implementation Phase Wants

**Phase 1 — Contracts & Storage:**
- Define MemoryItem, RuminateDecision, DreamLogEntry schemas
- Set up persistence tables for metadata
- Implement MemoryStore trait in Rust
- Unit tests for tier transitions

**Phase 2 — State Machine:**
- RuminatorState enum in Rust
- Idle detection (5 min timeout)
- Cortex Viewer UI panel
- Wire state transitions with telemetry

**Phase 3 — Decision Engine:**
- Integrate small model via inference backend
- Write contradiction-detection prompts
- Implement PROMOTE/FLAG/DELETE logic
- Add Dream Log persistence

**Phase 4 — Proof of Life:**
- "Force Ruminate" button in UI
- Visual state machine transitions
- Decision log display
- End-to-end test: inject memory -> trigger ruminate -> verify promotion

## L. Data Contract Wants

**MemoryItem fields required:**
- id (UUID)
- content
- embedding (vector)
- tier (short / medium / long / critical)
- importance (0-100)
- created_at
- last_accessed
- source (chat / file / commit / screenshot)

**RuminateDecision fields required:**
- memory_id
- action (PROMOTE / FLAG / DELETE)
- reason (model's explanation)
- confidence (0.0-1.0)
- new_tier (optional)
- conflict_with (optional, ID of conflicting memory)

**DreamLogEntry** — referenced as a schema to define, no fields specified in source.

## M. Capabilities NOT in source doc but implied/missing

These are wants the source spec implies but does not detail. Flagged here so they get explicit treatment in the revised spec.

| ID | Implied Capability |
|----|--------------------|
| M-1 | Screenshot acquisition mechanism (mentioned in B-2, D-1, but no code path defined) |
| M-2 | RepoWatcher minion behavior contract (referenced but not specified) |
| M-3 | Psychiatrist minion behavior contract (referenced but not specified) |
| M-4 | Constitution storage and load mechanism (referenced as constraint source) |
| M-5 | Build plan format and parsing (referenced for validation) |
| M-6 | Browser extension architecture (referenced for Lovable/Bolt/Replit injection) |
| M-7 | MCP integration shape for Cursor/VS Code (referenced as delivery mechanism) |
| M-8 | Dream Log schema (referenced but not specified) |
| M-9 | Pattern detection algorithm (referenced for drift detection, not specified) |

## N. Stale References (per LOCKED_DECISIONS.md, do NOT carry forward)

These appear in source doc but contradict locked decisions. Want still valid, IMPLEMENTATION specifically updated:

| Stale | Replace with (per locks) |
|-------|--------------------------|
| Redis (Short-Term storage) | Moka in-process cache |
| Qwen2.5-1.5B-Instruct | minion.shared = Qwen3-0.6B per LOCK C-7 |
| Nomic-Embed 0.6B | rag.embedder = owner's custom 0.5B Burn-baked / Harrier 0.6B bootstrap per LOCK C-7 |
| Qwen2.5-7B or 14B as Scribe/Translator | chat.brain = Phi-4-multimodal-5.6B per LOCK C-7 |
| Claude/GPT-4 as singular Heavy Lift | AI Resources surface (multi-provider council) per LOCK G-3, G-4 |
| llama.cpp for Ruminator | per-format dispatch table per LOCK D-1 |
| Postgres metadata storage | libSQL SSOT per LOCK E-1 |
| TypeScript interfaces as data contracts | Rust struct equivalents as SSOT (per general locked rule: Rust owns policy/logic) |

---

## Summary — what owner WANTS from this spec, distilled

1. **A translator that strengthens the user, not a chatbot that answers them.**
2. **A brain (Ruminate) separate from the voice (LLM).** The LLM speaks; Ruminate decides what to say.
3. **Invisible cognition during typing.** Screenshot, retrieval, minion consultation, all happening before user finishes the sentence.
4. **A four-tier memory with importance decay.** Things matter more or less based on use, not just recency.
5. **A background state machine that thinks while user is idle.** Promotes, flags, deletes — never the user's job.
6. **Output adapters per target tool.** Lovable, Bolt, Replit, Cursor, VS Code — each gets the right shaped prompt.
7. **Pre-commit drift prevention.** Stop bad code reaching repo before it lands.
8. **User-visible quality metrics.** Not "time saved" — quality transformed.
9. **Small fast models for background work.** Genius model never used for "user worked on Auth."
10. **Frustration-tolerant absorption.** Profanity is signal. No censoring. Help anyway.

These are the capabilities. The model names and storage names in the source doc are now overridden by LOCKED_DECISIONS.md, but the WANTS above stand.

---

*End of extraction. Use alongside LOCKED_DECISIONS.md when writing revised spec.*
