-- =============================================================================
-- Claude Context Schema for SurrealDB
-- Run this to initialize both global and project databases
-- =============================================================================

-- =============================================================================
-- GLOBAL NAMESPACE: claude_global / knowledge
-- Cross-project patterns, preferences, best practices
-- =============================================================================

USE NS claude_global DB knowledge;

-- Your coding preferences and rules
DEFINE TABLE preferences SCHEMAFULL;
DEFINE FIELD category ON preferences TYPE string;
DEFINE FIELD key ON preferences TYPE string;
DEFINE FIELD value ON preferences TYPE string;
DEFINE FIELD notes ON preferences TYPE option<string>;
DEFINE FIELD created_at ON preferences TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pref_category ON preferences FIELDS category;

-- Best practices and patterns (language/framework agnostic)
DEFINE TABLE patterns SCHEMAFULL;
DEFINE FIELD name ON patterns TYPE string;
DEFINE FIELD category ON patterns TYPE string; -- "svelte", "rust", "typescript", "architecture"
DEFINE FIELD description ON patterns TYPE string;
DEFINE FIELD example ON patterns TYPE option<string>;
DEFINE FIELD anti_pattern ON patterns TYPE option<string>;
DEFINE FIELD source ON patterns TYPE option<string>; -- where you learned this
DEFINE FIELD created_at ON patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_pattern_category ON patterns FIELDS category;

-- Cross-project architectural decisions
DEFINE TABLE decisions SCHEMAFULL;
DEFINE FIELD title ON decisions TYPE string;
DEFINE FIELD context ON decisions TYPE string;
DEFINE FIELD decision ON decisions TYPE string;
DEFINE FIELD reasoning ON decisions TYPE option<string>;
DEFINE FIELD alternatives ON decisions TYPE option<array<string>>;
DEFINE FIELD created_at ON decisions TYPE datetime DEFAULT time::now();

-- =============================================================================
-- PROJECT NAMESPACE: claude_projects / devpulse
-- DevPulse-specific architecture, rules, context
-- =============================================================================

USE NS claude_projects DB devpulse;

-- Project architecture rules (like the CORRECT preflight rules)
DEFINE TABLE architecture SCHEMAFULL;
DEFINE FIELD layer ON architecture TYPE string; -- "routes", "domains", "design", "sys"
DEFINE FIELD rule ON architecture TYPE string;
DEFINE FIELD description ON architecture TYPE string;
DEFINE FIELD enforced_by ON architecture TYPE option<string>; -- "preflight", "eslint", etc.
DEFINE FIELD examples ON architecture TYPE option<array<string>>;
DEFINE FIELD anti_examples ON architecture TYPE option<array<string>>;
DEFINE FIELD created_at ON architecture TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_arch_layer ON architecture FIELDS layer;

-- Sprint decisions and trade-offs
DEFINE TABLE sprint_decisions SCHEMAFULL;
DEFINE FIELD sprint ON sprint_decisions TYPE string;
DEFINE FIELD title ON sprint_decisions TYPE string;
DEFINE FIELD decision ON sprint_decisions TYPE string;
DEFINE FIELD reasoning ON sprint_decisions TYPE option<string>;
DEFINE FIELD trade_offs ON sprint_decisions TYPE option<string>;
DEFINE FIELD created_at ON sprint_decisions TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_sprint ON sprint_decisions FIELDS sprint;

-- ColdLight design system patterns
DEFINE TABLE coldlight_patterns SCHEMAFULL;
DEFINE FIELD primitive ON coldlight_patterns TYPE string;
DEFINE FIELD pattern_type ON coldlight_patterns TYPE string; -- "composition", "styling", "state", "a11y"
DEFINE FIELD description ON coldlight_patterns TYPE string;
DEFINE FIELD code_example ON coldlight_patterns TYPE option<string>;
DEFINE FIELD created_at ON coldlight_patterns TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_cl_primitive ON coldlight_patterns FIELDS primitive;

-- Domain structure patterns
DEFINE TABLE domain_patterns SCHEMAFULL;
DEFINE FIELD domain ON domain_patterns TYPE string;
DEFINE FIELD namespace ON domain_patterns TYPE string;
DEFINE FIELD structure ON domain_patterns TYPE string; -- JSON describing folder structure
DEFINE FIELD exports ON domain_patterns TYPE option<array<string>>;
DEFINE FIELD notes ON domain_patterns TYPE option<string>;
DEFINE FIELD created_at ON domain_patterns TYPE datetime DEFAULT time::now();

-- Current session context (blockers, active work)
DEFINE TABLE context SCHEMAFULL;
DEFINE FIELD key ON context TYPE string;
DEFINE FIELD value ON context TYPE string;
DEFINE FIELD updated_at ON context TYPE datetime DEFAULT time::now();
DEFINE INDEX idx_context_key ON context FIELDS key UNIQUE;

-- File patterns (what files follow what conventions)
DEFINE TABLE file_conventions SCHEMAFULL;
DEFINE FIELD pattern ON file_conventions TYPE string; -- glob pattern
DEFINE FIELD convention ON file_conventions TYPE string;
DEFINE FIELD suffix ON file_conventions TYPE option<string>;
DEFINE FIELD location ON file_conventions TYPE string;
DEFINE FIELD created_at ON file_conventions TYPE datetime DEFAULT time::now();
