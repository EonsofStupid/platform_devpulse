-- =============================================================================
-- Claude Context Seed Data
-- Initial knowledge to persist across sessions
-- =============================================================================

-- =============================================================================
-- GLOBAL: Your preferences
-- =============================================================================

USE NS claude_global DB knowledge;

-- Coding preferences
INSERT INTO preferences (category, key, value, notes) VALUES
  ('code', 'typescript_strict', 'true', 'Always strict mode, explicit return types on exports'),
  ('code', 'svelte_runes_only', 'true', 'Svelte 5 runes ($state, $derived, $effect), never legacy stores'),
  ('code', 'css_utility_first', 'true', 'Tailwind, no inline style objects'),
  ('code', 'imports_js_extension', 'true', 'Use .js extensions in TypeScript imports'),
  ('git', 'conventional_commits', 'true', 'feat:, fix:, refactor:, chore:, docs:, test:'),
  ('git', 'never_force_push_main', 'true', 'Never force push to main/master'),
  ('git', 'never_amend_unless_asked', 'true', 'Always new commits unless explicitly told to amend'),
  ('communication', 'be_direct', 'true', 'Skip filler words and pleasantries'),
  ('communication', 'no_superlatives', 'true', 'No "Great question!" or "Absolutely!"');

-- =============================================================================
-- PROJECT: DevPulse architecture rules (CORRECT ones)
-- =============================================================================

USE NS claude_projects DB devpulse;

-- Route architecture - THE CORRECT RULES
INSERT INTO architecture (layer, rule, description, examples) VALUES
  ('routes', 'routes_can_have_ui_state',
   'Route components (+page.svelte) CAN use $state for UI state. Routes are Svelte components.',
   ['let open = $state(false) for dialog', 'let activeTab = $state("home")']);

INSERT INTO architecture (layer, rule, description, examples, anti_examples) VALUES
  ('routes', 'routes_import_from_domains',
   'Routes import business logic from $lib/domains/. Routes compose, domains define.',
   ['import { userStore } from "$lib/domains/auth"', 'import { DashboardView } from "$lib/domains/dashboard/features"'],
   ['fetch() directly in route', 'class BusinessLogic in route']);

INSERT INTO architecture (layer, rule, description, anti_examples) VALUES
  ('routes', 'routes_no_business_logic',
   'Business logic (API calls, complex computations, data transformations) belongs in domains, not routes.',
   ['const data = await fetch("/api/...") in +page.svelte', 'Complex data transformations in route']);

INSERT INTO architecture (layer, rule, description) VALUES
  ('routes', 'routes_mirror_domain_structure',
   'Route paths parallel domain structure. /routes/(app)/dashboard/ imports from $lib/domains/dashboard/');

-- Domain architecture
INSERT INTO architecture (layer, rule, description, examples, anti_examples) VALUES
  ('domains', 'domain_public_api',
   'Each domain exposes a public API via index.ts. Internal modules accessed through this barrel.',
   ['import { authService, authStore } from "$lib/domains/auth"'],
   ['import { authService } from "$lib/domains/auth/services/auth.svc"']);

INSERT INTO architecture (layer, rule, description) VALUES
  ('domains', 'domain_structure',
   'Domains contain: index.ts, state/, services/, features/, contracts/, utils/');

-- Design system (ColdLight)
INSERT INTO architecture (layer, rule, description) VALUES
  ('design', 'coldlight_layers',
   'ColdLight has layers: tokens → primitives → recipes → components → blocks → renderers');

INSERT INTO architecture (layer, rule, description, anti_examples) VALUES
  ('design', 'primitives_unstyled',
   'Primitives are unstyled, accessible base components. Styling via recipes.',
   ['Hardcoded styles in primitives']);

-- Sys layer
INSERT INTO architecture (layer, rule, description, examples) VALUES
  ('sys', 'sys_infrastructure',
   '$lib/sys/ contains infrastructure: streams, generated code, config, debug utilities',
   ['$lib/sys/generated/ROUTES.ts', '$lib/sys/streams/']);

INSERT INTO architecture (layer, rule, description, examples, anti_examples) VALUES
  ('sys', 'typed_routes',
   'Navigation uses typed route helpers from $lib/sys/generated/ROUTES.ts, not raw strings',
   ['href={route("dashboard")}', 'goto(route("settings"))'],
   ['href="/dashboard"', 'goto("/settings")']);

-- File naming conventions
INSERT INTO file_conventions (pattern, convention, suffix, location) VALUES
  ('*.state.svelte.ts', 'Rune state modules', '.state.svelte.ts', '$lib/domains/*/state/'),
  ('*.svc.ts', 'Service modules', '.svc.ts', '$lib/domains/*/services/'),
  ('*.contract.ts', 'Contract/interface modules', '.contract.ts', '$lib/domains/*/contracts/'),
  ('*.page.svelte', 'Domain page components', '.page.svelte', 'DEPRECATED - pages in routes/ now');

INSERT INTO file_conventions (pattern, convention, location) VALUES
  ('+page.svelte', 'SvelteKit route page', 'src/routes/**/'),
  ('+layout.svelte', 'SvelteKit layout', 'src/routes/**/');

-- Current context
INSERT INTO context (key, value) VALUES
  ('current_sprint', 'preflight-fix'),
  ('blocker', 'preflight checks are WRONG - need rewrite'),
  ('next_action', 'rewrite thin-routes and state-vs-streams checks to match actual Svelte 5 best practices');
