# DevPulse Knowledge Library — Master Spec

| Field | Value |
|-------|-------|
| **Status** | `ACTIVE` |
| **Version** | `1.0.0` |
| **Last Updated** | `2026-04-23` |
| **Owner** | `@jesse` |
| **Governed By** | `PHILOSOPHY.md` + `# DevPulse Minion System Specification.md` |

---

## Purpose

The Knowledge Library is the **content corpus** that TEACHER, SENSEI, and Clyffy consume to surface educational, tactical, and warning content to the user. It is the **foundation** from which minions extend — not something that lives inside a minion.

## Architecture Placement

**Kernel owns this.** Generalized terminology at the boundary. UI/interactions library consumes.

Inside kernel the module can reference Clyffy, TEACHER, SENSEI, Council — whatever. At the kernel boundary and beyond, everything is generic (`Entry`, `type: dyk | kdrop | frust | insight | gloss`, `payload`).

## Content Types (5)

| Type | Code | Purpose | Display Label |
|------|------|---------|---------------|
| **Did You Know** | `dyk` | AI history, concepts, figures, breakthroughs | "Did You Know?" |
| **Knowledge Drops** | `kdrop` | Tactical tips (VS Code, prompting, tool shortcuts) | "Knowledge Drop" |
| **Frustrations** | `frust` | Known issues & quirks per tool | "Heads Up" |
| **Insights** | `insight` | Positive unique strengths per tool | "Pro Tip" |
| **Glossary** | `gloss` | Canonical term dictionary | Import/export only |


## Current Inventory

| Type | Tool-Specific | General | Total |
|------|---------------|---------|-------|
| DYK | 19 | 81 | 100 |
| KDrop | 37 | 63 | 100 |
| FRUST | 58 | 0 | 58 |
| INSIGHT | 49 | 0 | 49 |
| GLOSS | 0 | 100 | 100 |
| **Total** | **163** | **244** | **407** |

Tool-specific content covers: Replit, Lovable, Bolt, Base44. Still to audit: v0, Cursor, Windsurf, Augment, Claude Code, Antigravity, Temple Labs, emergent.sh, Aider, Roark.

## Storage Architecture

**JSON + Turso. Both. From day one.**

```
AUTHORING LAYER          BUILD            RUNTIME LAYER
───────────────          ─────            ─────────────

MD files in         →   converter    →   JSON artifacts
docs/knowledge_          (Node)           ship with binary
library/                                        │
                                                ▼
                                         Boot-time sync
                                                │
                                                ▼
                                         Turso tables
                                         (query layer)
```

### JSON (portable artifact)
- Ships with binary (embedded via `include_str!`)
- Version controlled
- CDN-deliverable for Clyffy webapp
- Source of truth for content

### Turso (runtime)
- Fast indexed queries for selection
- Per-user seen-tracking (cooldowns)
- Reactions (thumbs up/down)
- Analytics (shown count, engagement)
- Source of truth for runtime state


## Turso Schema

```sql
-- Content mirror (refreshed on app update from JSON)
CREATE TABLE knowledge_entries (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,               -- dyk | kdrop | frust | insight | gloss
  tool TEXT,                        -- NULL for general
  category TEXT NOT NULL,
  tier TEXT NOT NULL,               -- beginner | intermediate | advanced
  payload_json TEXT NOT NULL,
  tags_csv TEXT NOT NULL,
  added TEXT NOT NULL,
  content_hash TEXT NOT NULL
);
CREATE INDEX idx_knowledge_type ON knowledge_entries(type);
CREATE INDEX idx_knowledge_tool ON knowledge_entries(tool);
CREATE INDEX idx_knowledge_tier ON knowledge_entries(tier);

-- Per-user seen tracking
CREATE TABLE knowledge_seen (
  entry_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  first_shown_at INTEGER NOT NULL,
  last_shown_at INTEGER NOT NULL,
  shown_count INTEGER NOT NULL DEFAULT 1,
  reaction TEXT,                    -- 'helpful' | 'not_helpful' | NULL
  PRIMARY KEY (entry_id, user_id),
  FOREIGN KEY (entry_id) REFERENCES knowledge_entries(id) ON DELETE CASCADE
);
CREATE INDEX idx_seen_user_time ON knowledge_seen(user_id, last_shown_at);

-- Per-user config
CREATE TABLE knowledge_config (
  user_id TEXT PRIMARY KEY NOT NULL,
  config_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```


## Shared Schema (all entry types)

```
id              stable UUID (deterministic from content_hash)
type            dyk | kdrop | frust | insight | gloss
tool            replit | lovable | bolt | base44 | ... | null
category        type-specific enum
tier            beginner | intermediate | advanced
payload         type-specific (see below)
tags            string[]
added           ISO date
content_hash    sha256 of payload + category
```

### Payload Shapes

**DYK payload:**
- `text` — the "Did you know..." statement
- `source` — attribution (nullable)

**KDrop payload:**
- `title` — short hook
- `body` — actionable tip
- `shortcut` — keyboard shortcut (nullable)

**FRUST payload:**
- `title` — short hook
- `body` — what happens and why it matters
- `severity` — annoyance | footgun | dealbreaker
- `workaround` — mitigation (nullable)
- `also_affects` — tools with same/similar issue
- `confirmed` — ISO date last verified

**INSIGHT payload:**
- `title` — short hook
- `body` — what it does well
- `best_for` — ideal use case

**GLOSS payload:**
- `term` — Title Case
- `definition` — plain-language
- `see_also` — related terms


## Selection Logic (Configurable)

```
1. Pick type by weight (default: kdrop 60%, dyk 20%, frust 15%, insight 5%)
2. Filter candidates:
   - tier <= user_max_tier
   - NOT in cooldown (default 30 days per user)
   - reaction != 'not_helpful'
3. Apply tool affinity:
   - matching tool × 3.0
   - general (tool=null) × 1.0
   - other tool × 0.3
4. Weighted random selection
5. Record display in knowledge_seen
```

SQL query:

```sql
SELECT 
  k.*,
  CASE 
    WHEN k.tool = :current_tool THEN 3.0
    WHEN k.tool IS NULL THEN 1.0
    ELSE 0.3
  END AS affinity_weight
FROM knowledge_entries k
LEFT JOIN knowledge_seen s 
  ON k.id = s.entry_id AND s.user_id = :user_id
WHERE 
  k.type = :target_type
  AND k.tier IN (:allowed_tiers)
  AND (s.last_shown_at IS NULL OR s.last_shown_at < :cooldown_cutoff)
  AND (s.reaction IS NULL OR s.reaction != 'not_helpful')
ORDER BY RANDOM() * affinity_weight DESC
LIMIT 1;
```


## TEACHER / SENSEI Consumption (Minion Contract)

The knowledge library is **shared data**. Minions query it; they don't own it.

| Minion | Query Pattern | When |
|--------|--------------|------|
| **TEACHER** | `gloss` by term, `kdrop` by user gap | User confusion detected, terminology gap signal |
| **SENSEI** | `frust` by tool + category, `insight` for "why use X" | Planning phase, task.md creation, verify step |
| **Clyffy** | Any type, weighted by selection config | Loading screens, natural conversation moments |

TEACHER does NOT generate glossary content at runtime. TEACHER **retrieves** from the library and decides whether to surface it based on competency signals.

SENSEI does NOT invent tool-specific warnings. SENSEI **retrieves** the Frustration entry for the user's current tool and applies it as a guardrail.

See `08_TEACHER_SENSEI_CONTRACT.md`.

## Cross-Reference Legend

Built progressively as each tool audit lands. Currently covers 4 tools, 25 issue patterns. See `06_CROSS_REFERENCE_LEGEND.md`.

## Authoring Workflow

1. Edit MD files in `docs/knowledge_library/`
2. Run `tools/knowledge-converter/` → produces JSON artifacts + manifest
3. Rebuild DevPulse → new JSON embedded in binary
4. On next app boot, kernel detects version change, upserts into Turso
5. User's `knowledge_seen` history preserved across content updates

## Delegation Prompt (For Farming Tool Audits)

See `07_DELEGATION_PROMPT.md`. Swap `[TOOL_NAME]`, send to another AI, receive ~35-45 entries back. Paste results into this chat's processor, output matches schema.

## Open Decisions (Tracking for Lock)

1. Exact kernel module path for the knowledge module
2. ~~Turso database placement~~ — settled: the user database, `.userdata/user/turso/user.db`
3. Default selection weights (draft: 60/20/15/5 → finalize after user testing)
4. Default cooldown days (draft: 30)
5. Default tier cap for unknown user (draft: intermediate-and-below)

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-23 | Initial spec — 407 entries across 5 types, 4 tools audited |
