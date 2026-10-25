-- =============================================================================
-- BANTER: Initial Seed Data
-- Run after banter-schema.surql
-- Single INSERT per row (SurrealDB 2.x compatible)
-- =============================================================================

USE NS banter DB sessions;

-- =============================================================================
-- PREFERENCES
-- =============================================================================

INSERT INTO preferences { category: 'code', key: 'typescript_strict', value: 'true', notes: 'Always strict mode, explicit return types on exports' };
INSERT INTO preferences { category: 'code', key: 'svelte_runes_only', value: 'true', notes: 'Svelte 5 runes ($state, $derived, $effect), never legacy stores' };
INSERT INTO preferences { category: 'code', key: 'css_utility_first', value: 'true', notes: 'Tailwind, no inline style objects' };
INSERT INTO preferences { category: 'code', key: 'imports_js_extension', value: 'true', notes: 'Use .js extensions in TypeScript imports' };
INSERT INTO preferences { category: 'git', key: 'conventional_commits', value: 'true', notes: 'feat:, fix:, refactor:, chore:, docs:, test:' };
INSERT INTO preferences { category: 'git', key: 'never_force_push_main', value: 'true', notes: 'Never force push to main/master' };
INSERT INTO preferences { category: 'git', key: 'never_amend_unless_asked', value: 'true', notes: 'Always new commits unless explicitly told to amend' };
INSERT INTO preferences { category: 'communication', key: 'be_direct', value: 'true', notes: 'Skip filler words and pleasantries' };
INSERT INTO preferences { category: 'communication', key: 'no_superlatives', value: 'true', notes: 'No Great question or Absolutely' };
INSERT INTO preferences { category: 'workflow', key: 'read_before_edit', value: 'true', notes: 'ALWAYS read files before editing' };
INSERT INTO preferences { category: 'workflow', key: 'verify_compiles', value: 'true', notes: 'Verify code compiles before reporting done' };
INSERT INTO preferences { category: 'workflow', key: 'no_over_engineering', value: 'true', notes: 'Only change what is asked' };

-- =============================================================================
-- LEARNINGS
-- =============================================================================

INSERT INTO learnings { category: 'preflight', trigger: 'User says delete a check', wrong_action: 'Rewrite the check with fixes', correct_action: 'DELETE THE FILE. User said delete, not rewrite.', severity: 'critical' };
INSERT INTO learnings { category: 'preflight', trigger: 'thin-routes check exists', wrong_action: 'Keep it or rewrite it', correct_action: 'DELETE IT. Jesse does NOT do thin routes. Routes CAN have $state in Svelte 5.', severity: 'critical' };
INSERT INTO learnings { category: 'preflight', trigger: 'state-vs-streams check exists', wrong_action: 'Keep it or rewrite it', correct_action: 'DELETE IT. Routes CAN have state. This is Svelte 5 best practice.', severity: 'critical' };
INSERT INTO learnings { category: 'architecture', trigger: 'Route files in Svelte 5', wrong_action: 'Ban $state, $derived, $effect from routes', correct_action: 'Routes ARE Svelte components. UI state in routes is CORRECT.', severity: 'critical' };
INSERT INTO learnings { category: 'architecture', trigger: 'Domain boundaries', wrong_action: 'Put business logic in routes', correct_action: 'Routes import from domains. Business logic in $lib/domains/', severity: 'major' };
INSERT INTO learnings { category: 'communication', trigger: 'User is frustrated', wrong_action: 'Add more explanation or hedging', correct_action: 'Be direct. Execute. Stop talking.', severity: 'major' };
INSERT INTO learnings { category: 'workflow', trigger: 'User says do it', wrong_action: 'Ask clarifying questions', correct_action: 'Execute all steps without re-asking', severity: 'major' };
INSERT INTO learnings { category: 'workflow', trigger: 'User says fix it after debug', wrong_action: 'Propose multiple options', correct_action: 'Apply minimal targeted fix immediately', severity: 'major' };

-- =============================================================================
-- ARCHITECTURE
-- =============================================================================

INSERT INTO architecture { layer: 'routes', rule: 'routes_can_have_ui_state', description: 'Route components (+page.svelte) CAN use $state for UI state. Routes ARE Svelte components.', examples: ['let open = $state(false)', 'let activeTab = $state(home)'] };
INSERT INTO architecture { layer: 'routes', rule: 'routes_import_from_domains', description: 'Routes import business logic from $lib/domains/. Routes compose, domains define.', examples: ['import { userStore } from $lib/domains/auth'] };
INSERT INTO architecture { layer: 'routes', rule: 'routes_no_business_logic', description: 'Business logic (API calls, complex computations) belongs in domains, not routes.', examples: ['API calls go in services', 'Data transforms in domain utils'] };
INSERT INTO architecture { layer: 'domains', rule: 'domain_public_api', description: 'Each domain exposes public API via index.ts. Internal modules accessed through barrel.', examples: ['import { authService } from $lib/domains/auth'] };
INSERT INTO architecture { layer: 'domains', rule: 'domain_structure', description: 'Domains contain: index.ts, state/, services/, features/, contracts/, utils/', examples: ['$lib/domains/auth/services/auth.svc.ts'] };
INSERT INTO architecture { layer: 'design', rule: 'coldlight_layers', description: 'ColdLight layers: tokens - primitives - recipes - components - blocks - renderers', examples: ['primitives are unstyled', 'recipes apply styling'] };
INSERT INTO architecture { layer: 'sys', rule: 'typed_routes', description: 'Navigation uses typed route helpers, not raw strings', examples: ['href={route(dashboard)}', 'goto(route(settings))'] };
INSERT INTO architecture { layer: 'sys', rule: 'sys_infrastructure', description: '$lib/sys/ contains infrastructure: streams, generated code, config', examples: ['$lib/sys/generated/ROUTES.ts'] };

-- =============================================================================
-- CONTEXT
-- =============================================================================

INSERT INTO context { key: 'current_sprint', value: 'preflight-fix', priority: 10 };
INSERT INTO context { key: 'preflight_status', value: 'thin-routes and state-vs-streams DELETED', priority: 10 };
INSERT INTO context { key: 'remaining_violations', value: 'typed-routes on error pages (allowlist pattern needs fix)', priority: 8 };
INSERT INTO context { key: 'surrealdb_namespace', value: 'banter', priority: 10 };
INSERT INTO context { key: 'mcp_status', value: 'configured in ~/.claude.json and .mcp.json', priority: 5 };

-- =============================================================================
-- BLOCKERS
-- =============================================================================

INSERT INTO blockers { description: 'typed-routes check failing on error pages', category: 'preflight', resolved: false };
INSERT INTO blockers { description: 'Pre-commit hooks failing', category: 'git', resolved: false };

-- =============================================================================
-- TASKS
-- =============================================================================

INSERT INTO tasks { content: 'Fix typed-routes allowlist pattern for error pages', status: 'pending', sprint: 'preflight-fix', priority: 10 };
INSERT INTO tasks { content: 'Run full pre-commit hooks and pass', status: 'pending', sprint: 'preflight-fix', priority: 9 };
INSERT INTO tasks { content: 'Restore CSS and agnostic work from sprint', status: 'pending', priority: 5 };

-- =============================================================================
-- COMMITS
-- =============================================================================

INSERT INTO commits { type: 'fix', scope: 'preflight', message: 'Delete broken thin-routes and state-vs-streams checks', body: 'User explicitly stated: Routes CAN have $state in Svelte 5. thin-routes pattern is WRONG for this project.', files: ['scripts/docs/preflight/checks/check.thin-routes.ts', 'scripts/docs/preflight/checks/check.state-vs-streams.ts'], session_id: 'session-2026-02-05' };
INSERT INTO commits { type: 'feat', scope: 'surrealdb', message: 'Set up SurrealDB MCP for Claude context persistence', body: 'Global scope: claude_global/knowledge. Project scope: claude_projects/devpulse.', files: ['scripts/surrealdb/claude-schema.surql', 'scripts/surrealdb/claude-seed.surql', '.mcp.json'], session_id: 'session-2026-02-05' };
INSERT INTO commits { type: 'chore', scope: 'preflight', message: 'Update cowlevel.policy.json to remove deleted checks', files: ['scripts/docs/policy/cowlevel.policy.json'], session_id: 'session-2026-02-05' };
INSERT INTO commits { type: 'chore', scope: 'preflight', message: 'Update preflight.ts to remove deleted check imports', files: ['scripts/docs/preflight/engine/preflight.ts'], session_id: 'session-2026-02-05' };

-- CHAT LOG TABLE already defined in banter-schema.surql
