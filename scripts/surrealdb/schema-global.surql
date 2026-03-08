-- =============================================================================
-- GLOBAL NAMESPACE: Shared cross-project knowledge
-- SurrealDB 3.0 — Record References, Vector Search, Computed Fields
-- All AI agents READ. Only root WRITES.
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS global;
USE NS global;
DEFINE DATABASE IF NOT EXISTS knowledge;
USE DB knowledge;

-- =============================================================================
-- PREFERENCES
-- =============================================================================

DEFINE TABLE preferences SCHEMAFULL;
DEFINE FIELD category    ON preferences TYPE string;
DEFINE FIELD key         ON preferences TYPE string;
DEFINE FIELD value       ON preferences TYPE string;
DEFINE FIELD notes       ON preferences TYPE option<string>;
DEFINE FIELD created_at  ON preferences TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pref_key      ON preferences FIELDS key UNIQUE;
DEFINE INDEX idx_pref_category ON preferences FIELDS category;

-- =============================================================================
-- PATTERNS
-- embedding: agent queries by semantic similarity, not just keywords
-- =============================================================================

DEFINE TABLE patterns SCHEMAFULL;
DEFINE FIELD name         ON patterns TYPE string;
DEFINE FIELD category     ON patterns TYPE string;
DEFINE FIELD description  ON patterns TYPE string;
DEFINE FIELD example      ON patterns TYPE option<string>;
DEFINE FIELD anti_pattern ON patterns TYPE option<string>;
DEFINE FIELD source       ON patterns TYPE option<string>;
DEFINE FIELD embedding    ON patterns TYPE option<array<float>>;
DEFINE FIELD created_at   ON patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pattern_category ON patterns FIELDS category;
DEFINE INDEX idx_patterns_vector  ON patterns FIELDS embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;

-- =============================================================================
-- DECISIONS (cross-project)
-- =============================================================================

DEFINE TABLE decisions SCHEMAFULL;
DEFINE FIELD title        ON decisions TYPE string;
DEFINE FIELD context      ON decisions TYPE string;
DEFINE FIELD decision     ON decisions TYPE string;
DEFINE FIELD reasoning    ON decisions TYPE option<string>;
DEFINE FIELD alternatives ON decisions TYPE option<array<string>>;
DEFINE FIELD embedding    ON decisions TYPE option<array<float>>;
DEFINE FIELD created_at   ON decisions TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_decisions_vector ON decisions FIELDS embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;

-- =============================================================================
-- LEARNINGS — prevent repeated AI mistakes across ALL sessions and projects
-- Severity enforced at DB level.
-- Computed full_text drives embedding generation — no app-side assembly needed.
-- Vector search: find learnings similar to current situation.
-- =============================================================================

DEFINE TABLE learnings SCHEMAFULL;
DEFINE FIELD category       ON learnings TYPE string;
DEFINE FIELD trigger        ON learnings TYPE string;
DEFINE FIELD wrong_action   ON learnings TYPE string;
DEFINE FIELD correct_action ON learnings TYPE string;
DEFINE FIELD severity       ON learnings TYPE string
  ASSERT $value IN ['critical', 'major', 'minor'];
DEFINE FIELD embedding      ON learnings TYPE option<array<float>>;
DEFINE FIELD created_at     ON learnings TYPE datetime DEFAULT time::now();

-- Computed field: assembled text for embedding — DB owns this, not the app
DEFINE FIELD full_text ON learnings VALUE
  'TRIGGER: ' + trigger + ' | WRONG: ' + wrong_action + ' | CORRECT: ' + correct_action;

DEFINE INDEX idx_learnings_severity ON learnings FIELDS severity;
DEFINE INDEX idx_learnings_category ON learnings FIELDS category;
DEFINE INDEX idx_learnings_vector   ON learnings FIELDS embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;

-- =============================================================================
-- DEV_PROFILE — persistent developer identity across all projects and agents
-- Not flat KV — structured identity: skills, style, communication preferences,
-- tool preferences, pain points, growth areas.
-- Memory budget tier: IDENTITY (always loaded, highest priority)
-- =============================================================================

DEFINE TABLE dev_profile SCHEMAFULL;
DEFINE FIELD category    ON dev_profile TYPE string;
DEFINE FIELD key         ON dev_profile TYPE string;
DEFINE FIELD value       ON dev_profile TYPE string;
DEFINE FIELD confidence  ON dev_profile TYPE float DEFAULT 0.5
  ASSERT $value >= 0.0 AND $value <= 1.0;
DEFINE FIELD source      ON dev_profile TYPE string DEFAULT 'inferred'
  ASSERT $value IN ['explicit', 'inferred', 'observed'];
DEFINE FIELD notes       ON dev_profile TYPE option<string>;
DEFINE FIELD updated_at  ON dev_profile TYPE datetime DEFAULT time::now();
DEFINE FIELD created_at  ON dev_profile TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_profile_key      ON dev_profile FIELDS key UNIQUE;
DEFINE INDEX idx_profile_category ON dev_profile FIELDS category;

-- =============================================================================
-- REJECTIONS — things the developer has explicitly rejected
-- Agents check this BEFORE suggesting tools, patterns, libraries, approaches.
-- Prevents the "I already told you no" loop across sessions.
-- Memory budget tier: REJECTIONS (15% — loaded after patterns and decisions)
-- =============================================================================

DEFINE TABLE rejections SCHEMAFULL;
DEFINE FIELD subject     ON rejections TYPE string;
DEFINE FIELD category    ON rejections TYPE string;
DEFINE FIELD reason      ON rejections TYPE option<string>;
DEFINE FIELD strength    ON rejections TYPE string DEFAULT 'firm'
  ASSERT $value IN ['soft', 'firm', 'absolute'];
DEFINE FIELD embedding   ON rejections TYPE option<array<float>>;
DEFINE FIELD created_at  ON rejections TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_rejections_subject  ON rejections FIELDS subject UNIQUE;
DEFINE INDEX idx_rejections_category ON rejections FIELDS category;
DEFINE INDEX idx_rejections_vector   ON rejections FIELDS embedding HNSW DIMENSION 1536 DIST COSINE TYPE F32;
