-- =============================================================================
-- DEVPULSE PROJECT SEED: Architecture rules, context, conventions
-- Run after schema-projects.surql
-- =============================================================================

USE NS projects DB devpulse;

-- =============================================================================
-- ARCHITECTURE RULES
-- =============================================================================

-- Routes
INSERT INTO architecture { layer: 'routes', rule: 'routes_can_have_ui_state', description: 'Route components (+page.svelte) CAN use $state for UI state. Routes ARE Svelte components.', examples: ['let open = $state(false)', 'let activeTab = $state("home")'] };
INSERT INTO architecture { layer: 'routes', rule: 'routes_import_from_domains', description: 'Routes import business logic from $lib/domains/. Routes compose, domains define.', examples: ['import { userStore } from "$lib/domains/auth"'] };
INSERT INTO architecture { layer: 'routes', rule: 'routes_no_business_logic', description: 'Business logic (API calls, complex computations) belongs in domains, not routes.', anti_examples: ['fetch() directly in route', 'Complex data transforms in route'] };

-- Domains
INSERT INTO architecture { layer: 'domains', rule: 'domain_public_api', description: 'Each domain exposes public API via index.ts. Internal modules accessed through barrel.', examples: ['import { authService } from "$lib/domains/auth"'] };
INSERT INTO architecture { layer: 'domains', rule: 'domain_structure', description: 'Domains contain: index.ts, state/, services/, features/, contracts/, utils/' };

-- Design (ColdLight)
INSERT INTO architecture { layer: 'design', rule: 'coldlight_sole_authority', description: 'ColdLight is the SOLE CSS authority. Zero hand-written CSS outside design/. Zero colocated .css files.', enforced_by: 'scanner + lefthook' };
INSERT INTO architecture { layer: 'design', rule: 'coldlight_owns_aria', description: 'ColdLight owns ARIA by default (WAI-ARIA APG). Melt UI dsAdapter is EXCEPTION ONLY.', enforced_by: 'ariaStateProvider in contract' };
INSERT INTO architecture { layer: 'design', rule: 'sd5_drives_pipeline', description: 'Style Dictionary v5 + DTCG 1.0 drives the token pipeline. tokens.ts SSOT -> SD5 build -> CSS + TS + DTCG JSON.', enforced_by: 'ds-tokens-build.ts' };
INSERT INTO architecture { layer: 'design', rule: 'catalog_is_spine', description: 'Catalog is THE spine. Declare in catalog FIRST, then build. "catalog" NOT "taxonomy". "semantics" NOT "components".', enforced_by: 'scanner' };
INSERT INTO architecture { layer: 'design', rule: 'three_tier_tokens', description: 'Global (raw values) -> Semantic (intent aliases) -> Component (scoped). Zod validates cross-tier refs.', enforced_by: 'schema.ts' };

-- Sys
INSERT INTO architecture { layer: 'sys', rule: 'typed_routes', description: 'Navigation uses typed route helpers, not raw strings.', examples: ['href={route("dashboard")}'], anti_examples: ['href="/dashboard"'] };

-- Engine/Clyffy
INSERT INTO architecture { layer: 'engine', rule: 'engine_is_facade', description: 'Engine is a PUBLIC facade of Clyffy. Desktop imports signals from engine, NEVER from clyffy.', enforced_by: 'crate boundaries' };
INSERT INTO architecture { layer: 'clyffy', rule: 'clyffy_is_kernel', description: 'Clyffy is SENSITIVE IP. Pure logic. No UI dependencies. Emits signals via engine.', enforced_by: 'crate boundaries + unsafe_code = forbid' };
INSERT INTO architecture { layer: 'engine', rule: 'signal_1to1_mapping', description: 'Every Clyffy internal signal MUST have a 1:1 layman-friendly parallel in engine. Sensitive names replaced with useful logging-safe names.', enforced_by: 'TODO: enforcement tooling' };

-- Databases
INSERT INTO architecture { layer: 'platform', rule: 'embedded_databases', description: 'Turso, DuckDB and Moka run in-process; SurrealDB runs as upstream''s built binary in a supervised subprocess inside the DevPulse folder (plan 0007 Part S; owner 2026-10-24). Docker / Podman is a guided product feature (owner).', enforced_by: 'plan 0007' };
INSERT INTO architecture { layer: 'platform', rule: 'surrealdb_dual_instance', description: 'TWO SurrealDB instances: the app''s own (Clyffy; a supervised subprocess) + standalone (dev machine, AI agent memory). Zero shared data.', enforced_by: 'architecture' };

-- =============================================================================
-- CONTEXT (current state)
-- =============================================================================

INSERT INTO context { key: 'current_sprint', value: 'surrealdb-standalone-setup', priority: 10 };
INSERT INTO context { key: 'surrealdb_status', value: 'v3.0.0 installed, schemas written, NOT YET RUNNING', priority: 10 };
INSERT INTO context { key: 'coldlight_status', value: 'Docs updated (MASTER-PLAN, WORKFLOW, CLAUDE.md, SPRINT_PLAN). 11 compile errors. 75+ stale docs.', priority: 9 };
INSERT INTO context { key: 'primitives_status', value: '40 empty folders exist. Button only primitive. Need ColdLight-owned ARIA rewrite.', priority: 8 };
INSERT INTO context { key: 'token_pipeline_status', value: 'SD5 pipeline exists but not verified end-to-end. Phase 4 in MASTER-PLAN.', priority: 7 };

-- =============================================================================
-- PATTERNS (ColdLight-specific)
-- =============================================================================

INSERT INTO patterns { component: 'primitives', pattern_type: 'composition', description: 'Primitives OWN ARIA. Render correct semantic HTML + role + aria-* + tabindex + keyboard + focus. Unstyled. data-kind, data-slot, data-state on every element.' };
INSERT INTO patterns { component: 'primitives', pattern_type: 'state', description: 'Svelte 5 runes only. $state for internal state, $bindable for external, $derived for computed, $effect for side effects. setContext/getContext for compound.' };
INSERT INTO patterns { component: 'semantics', pattern_type: 'composition', description: 'Semantic = Primitive + Recipe. Imports primitive, applies recipe classes. This is what users import. NO separate ARIA contracts.' };
INSERT INTO patterns { component: 'tokens', pattern_type: 'styling', description: '3-tier: tokens.ts (Tier 1 global OKLCH) -> semantic.ts (Tier 2 aliases) -> components.ts (Tier 3 scoped). SD5 build -> tokens.css @theme block.' };
INSERT INTO patterns { component: 'recipes', pattern_type: 'styling', description: 'Recipe = composable config that produces CSS class strings per slot. DsSurfaceProps in, Record<string, string> out.' };

-- =============================================================================
-- FILE CONVENTIONS
-- =============================================================================

INSERT INTO file_conventions { pattern: '*.state.svelte.ts', convention: 'Rune state modules', suffix: '.state.svelte.ts', location: '$lib/domains/*/state/' };
INSERT INTO file_conventions { pattern: '*.svc.ts', convention: 'Service modules', suffix: '.svc.ts', location: '$lib/domains/*/services/' };
INSERT INTO file_conventions { pattern: '*.contract.ts', convention: 'Contract/interface modules', suffix: '.contract.ts', location: '$lib/domains/*/contracts/' };
INSERT INTO file_conventions { pattern: '+page.svelte', convention: 'SvelteKit route page', location: 'src/routes/**/' };
INSERT INTO file_conventions { pattern: '+layout.svelte', convention: 'SvelteKit layout', location: 'src/routes/**/' };
INSERT INTO file_conventions { pattern: '{Name}.svelte', convention: 'PascalCase component file', location: 'design/primitives/{kind}/' };
INSERT INTO file_conventions { pattern: 'contract.ts', convention: 'Catalog primitive contract', location: 'design/catalog/kinds/primitives/{kind}/' };
INSERT INTO file_conventions { pattern: '{Name}.test.ts', convention: 'Vitest browser test (MANDATORY)', location: 'design/primitives/{kind}/' };

-- =============================================================================
-- DECISIONS (made this session, 2026-02-18)
-- =============================================================================

INSERT INTO decisions { sprint: 'surrealdb-setup', title: 'ColdLight owns ARIA by default', decision: 'All primitives are Archetype A (ColdLight-owned WAI-ARIA APG). Melt UI dsAdapter is exception only.', reasoning: 'Previous sessions incorrectly coded components as "owned by ARIA as ARIA" — wrong. ColdLight should own ARIA directly.', trade_offs: 'More work per primitive, but no adapter overhead for 90% of components.' };
INSERT INTO decisions { sprint: 'surrealdb-setup', title: 'SD5 drives token pipeline', decision: 'Style Dictionary v5 + DTCG 1.0 format drives everything. Not SD4.', reasoning: 'SD5 is current. DTCG 1.0 is the standard interchange format. TW4 @theme consumes SD5 output directly.' };
INSERT INTO decisions { sprint: 'surrealdb-setup', title: 'Catalog not taxonomy, semantics not components', decision: 'Renamed taxonomy/ to catalog/. Layer 5 is semantics/ not components/.', reasoning: 'Better terminology. Catalog = the spine. Semantics = primitive + recipe.' };
INSERT INTO decisions { sprint: 'surrealdb-setup', title: 'Dual SurrealDB instances', decision: 'Embedded (Rust kv-rocksdb) for Clyffy IP + Standalone (server) for AI agent memory.', reasoning: 'Sensitive IP never leaves the binary. AI memory is accessible to any tool via WebSocket.' };
