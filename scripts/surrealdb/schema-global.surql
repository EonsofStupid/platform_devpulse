-- =============================================================================
-- GLOBAL NAMESPACE: Shared cross-project knowledge
-- All AI agents can READ. Only root can WRITE.
-- =============================================================================

DEFINE NAMESPACE IF NOT EXISTS global;
USE NS global;
DEFINE DATABASE IF NOT EXISTS knowledge;
USE DB knowledge;

-- -----------------------------------------------------------------------------
-- PREFERENCES: Coding style, communication rules, workflow preferences
-- -----------------------------------------------------------------------------

DEFINE TABLE preferences SCHEMAFULL;
DEFINE FIELD category ON preferences TYPE string;
DEFINE FIELD key ON preferences TYPE string;
DEFINE FIELD value ON preferences TYPE string;
DEFINE FIELD notes ON preferences TYPE option<string>;
DEFINE FIELD created_at ON preferences TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pref_key ON preferences FIELDS key UNIQUE;
DEFINE INDEX idx_pref_category ON preferences FIELDS category;

-- -----------------------------------------------------------------------------
-- PATTERNS: Language/framework best practices (cross-project)
-- -----------------------------------------------------------------------------

DEFINE TABLE patterns SCHEMAFULL;
DEFINE FIELD name ON patterns TYPE string;
DEFINE FIELD category ON patterns TYPE string;
DEFINE FIELD description ON patterns TYPE string;
DEFINE FIELD example ON patterns TYPE option<string>;
DEFINE FIELD anti_pattern ON patterns TYPE option<string>;
DEFINE FIELD source ON patterns TYPE option<string>;
DEFINE FIELD created_at ON patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pattern_category ON patterns FIELDS category;

-- -----------------------------------------------------------------------------
-- DECISIONS: Cross-project architectural decisions
-- -----------------------------------------------------------------------------

DEFINE TABLE decisions SCHEMAFULL;
DEFINE FIELD title ON decisions TYPE string;
DEFINE FIELD context ON decisions TYPE string;
DEFINE FIELD decision ON decisions TYPE string;
DEFINE FIELD reasoning ON decisions TYPE option<string>;
DEFINE FIELD alternatives ON decisions TYPE option<array<string>>;
DEFINE FIELD created_at ON decisions TYPE datetime DEFAULT time::now();

-- -----------------------------------------------------------------------------
-- LEARNINGS: Mistakes + correct approaches (CRITICAL for AI agents)
-- These prevent repeated errors across sessions and projects
-- -----------------------------------------------------------------------------

DEFINE TABLE learnings SCHEMAFULL;
DEFINE FIELD category ON learnings TYPE string;
DEFINE FIELD trigger ON learnings TYPE string;
DEFINE FIELD wrong_action ON learnings TYPE string;
DEFINE FIELD correct_action ON learnings TYPE string;
DEFINE FIELD severity ON learnings TYPE string ASSERT $value IN ['critical', 'major', 'minor'];
DEFINE FIELD created_at ON learnings TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_learnings_severity ON learnings FIELDS severity;
DEFINE INDEX idx_learnings_category ON learnings FIELDS category;
