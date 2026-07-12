# TEACHER / SENSEI — Knowledge Library Consumption Contract

| Field | Value |
|-------|-------|
| **Status** | `DRAFT` |
| **Version** | `1.0.0` |
| **Last Updated** | `2026-04-23` |
| **Depends On** | `00_MASTER_SPEC.md`, `# DevPulse Minion System Specification.md` |

---

## Purpose

Define how TEACHER (minion #7) and SENSEI (minion #9) consume the Knowledge Library. The library is **shared data**. Minions query it; they don't own it.

## Architectural Rule

**Content ≠ Logic.** The knowledge library holds facts, tips, warnings, definitions. The minions hold the intelligence about *when* to surface those facts based on user state.

- TEACHER reads signals (confusion, terminology gap, mastery evidence) → queries library for matching entries → decides whether to surface
- SENSEI reads planning/verification context → queries library for relevant frustrations/insights → applies as guardrails
- Clyffy reads loading-screen context → queries library via weighted selector → narrates

None of them generate library content at runtime. All generation happens in the authoring layer (MD files → JSON via converter).

## TEACHER Consumption Patterns

### Input Signals

TEACHER already fires these per the Minion Spec:

```
terminology_gap        { gap: "borrow checker" }
confusion_signal       { confused_about: "lifetimes" }
mastery_evidence       { mastered: ["async/await"] }
competency_update      { user_level, known_concepts, gaps, suggested_terminology }
```

### Query Patterns

When TEACHER detects a signal, it queries the library:

**Pattern 1: Terminology gap → Glossary lookup**
```sql
SELECT payload_json FROM knowledge_entries
WHERE type = 'gloss'
  AND (
    LOWER(JSON_EXTRACT(payload_json, '$.term')) = LOWER(:gap_term)
    OR :gap_term IN (
      SELECT value FROM JSON_EACH(JSON_EXTRACT(payload_json, '$.see_also'))
    )
  )
LIMIT 1;
```

**Pattern 2: Competency gap → Matching KDrop**
```sql
SELECT k.* FROM knowledge_entries k
LEFT JOIN knowledge_seen s ON k.id = s.entry_id AND s.user_id = :user_id
WHERE k.type = 'kdrop'
  AND k.tier = :user_tier
  AND EXISTS (
    SELECT 1 FROM JSON_EACH(k.tags_csv)
    WHERE value IN (:gap_tags)
  )
  AND (s.last_shown_at IS NULL OR s.last_shown_at < :cooldown_cutoff)
ORDER BY RANDOM()
LIMIT 1;
```

**Pattern 3: Mastery evidence → Mark mastered, advance tier suggestion**
```sql
-- No query; update user profile
UPDATE user_profile 
SET mastered_terms = JSON_INSERT(mastered_terms, '$[#]', :term)
WHERE user_id = :user_id;
```

### Surface Decision

TEACHER does NOT auto-surface every matching entry. Decision logic:

```
IF signal = confusion AND severity >= 0.7:
    surface = Glossary entry (inline, as hover tooltip)
ELSE IF signal = terminology_gap AND user_paused_typing:
    surface = KDrop (as subtle hint in margin)
ELSE IF signal = mastery_evidence:
    surface = NONE (silent profile update)
```

**Progressive disclosure rule:** Same entry never shown in same session. Cooldown respected (default 30d).


## SENSEI Consumption Patterns

### Input Signals

SENSEI's job per the Minion Spec: task.md planning, verification, anti-TODO enforcement, sanity checks.

```
task_planning_started    { project_tool, task_description }
task_verification        { task_id, claimed_complete: true }
pre_code_review          { file_paths, changes_summary }
```

### Query Patterns

**Pattern 1: Tool-specific frustration warnings during planning**
```sql
SELECT payload_json FROM knowledge_entries
WHERE type = 'frust'
  AND tool = :current_tool
  AND JSON_EXTRACT(payload_json, '$.severity') IN ('footgun', 'dealbreaker')
  AND EXISTS (
    SELECT 1 FROM JSON_EACH(k.tags_csv)
    WHERE value IN (:task_tags)
  );
```

**Pattern 2: Cross-tool awareness (warn about same issue elsewhere)**
```sql
SELECT payload_json FROM knowledge_entries
WHERE type = 'frust'
  AND :current_tool IN (
    SELECT value FROM JSON_EACH(JSON_EXTRACT(payload_json, '$.also_affects'))
  )
  AND JSON_EXTRACT(payload_json, '$.severity') = 'dealbreaker';
```

**Pattern 3: Insight retrieval for "why this approach"**
```sql
SELECT payload_json FROM knowledge_entries
WHERE type = 'insight'
  AND tool = :current_tool
  AND EXISTS (
    SELECT 1 FROM JSON_EACH(k.tags_csv)
    WHERE value IN (:decision_tags)
  )
LIMIT 3;
```

### Verification Integration

SENSEI uses Frustration entries as **verification checklists**:

```
Task: "Add user auth to Bolt project"

SENSEI queries: frust WHERE tool='bolt' AND category IN ('integration', 'deployment', 'generation')
Retrieves:
  - FRUST-bolt-003 (RLS omissions)
  - FRUST-bolt-009 (Hardcoded secrets)
  - FRUST-bolt-014 (Supabase auth deadlock)

SENSEI applies each as a verify-step in task.md:
  [ ] Verify RLS policies enabled on all tables
  [ ] Verify no hardcoded secrets in client code
  [ ] Verify auth callbacks don't use async in onAuthStateChange
```

This is the **anti-TODO enforcement** in action — SENSEI doesn't trust the AI's "task complete" until the library-backed checks pass.


## Clyffy Consumption Patterns

Clyffy's role: loading screen narration, natural conversation moments, general knowledge surfacing.

Uses the **default weighted selector** from MASTER_SPEC (60/20/15/5). No signal-driven filtering beyond tool affinity and cooldown.

```sql
SELECT k.*, /* affinity weight logic */ FROM knowledge_entries k
LEFT JOIN knowledge_seen s ON k.id = s.entry_id AND s.user_id = :user_id
WHERE k.type = :weighted_type
  AND k.tier IN (:allowed_tiers)
  AND (s.last_shown_at IS NULL OR s.last_shown_at < :cooldown_cutoff)
  AND (s.reaction IS NULL OR s.reaction != 'not_helpful')
ORDER BY RANDOM() * affinity_weight DESC
LIMIT 1;
```

## Shared Rules Across All Consumers

1. **Never bypass cooldown.** If a query returns empty due to cooldown exhaustion, either widen the window or skip the surface — never re-show within cooldown.

2. **Never mutate payload at runtime.** All entries are read-only from the minion's perspective. Edits happen in MD files → JSON conversion only.

3. **Track every display.** Every query that returns an entry used for UI surface MUST write to `knowledge_seen`:
```sql
INSERT INTO knowledge_seen (entry_id, user_id, first_shown_at, last_shown_at, shown_count)
VALUES (?, ?, ?, ?, 1)
ON CONFLICT(entry_id, user_id) DO UPDATE SET
  last_shown_at = excluded.last_shown_at,
  shown_count = shown_count + 1;
```

4. **Respect reactions.** If user marks entry as `not_helpful`, that entry never surfaces for that user again unless explicitly reset.

5. **Log queries for analytics.** DuckDB captures:
```sql
-- telemetry.knowledge_queries
INSERT INTO telemetry.knowledge_queries
(query_id, minion, signal_type, type_queried, tool_queried, result_count, surfaced_id, timestamp)
VALUES (?, ?, ?, ?, ?, ?, ?, NOW());
```

## Minion API Surface

ClyffyOS's AI layer exposes a generalized function to all minions:

```rust
// ClyffyOS-side (can reference Clyffy, Minion names, etc.)
pub trait KnowledgeConsumer {
    fn query(&self, filter: KnowledgeFilter, context: UserContext) -> Vec<Entry>;
    fn surface(&self, entry: &Entry, placement: Placement) -> Result<(), SurfaceError>;
    fn mark_reaction(&self, entry_id: &str, reaction: Reaction) -> Result<()>;
}

pub struct KnowledgeFilter {
    pub entry_type: Option<EntryType>,
    pub tool: Option<String>,
    pub tier_max: Tier,
    pub tags_any: Vec<String>,
    pub respect_cooldown: bool,
}
```

At the kernel boundary (exposed to engine → UI), only generic types pass through. No `TeacherQuery` or `SenseiRequest` leaks outside kernel.

## Open Questions

1. Should SENSEI's Frustration-as-checklist be a separate table (`task_checklists`) or generated fresh on each task? (Draft: fresh — keeps checklists aligned with current library version.)

2. Should TEACHER's surface decision (inline tooltip vs margin hint vs silent) be configurable per user? (Draft: yes, in `knowledge_config`.)

3. How does TEACHER handle a Glossary entry that references another term the user also doesn't know? (Draft: surface primary entry, cache dependencies for next opportunity.)

4. Does SENSEI block task completion if Frustration checks fail, or just warn? (Draft: blocks `dealbreaker`, warns `footgun`, notes `annoyance`.)
