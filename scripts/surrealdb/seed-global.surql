-- =============================================================================
-- GLOBAL SEED: Cross-project knowledge
-- Run after schema-global.surql
-- =============================================================================

USE NS global DB knowledge;

-- =============================================================================
-- PREFERENCES
-- =============================================================================

INSERT INTO preferences { category: 'code', key: 'typescript_strict', value: 'true', notes: 'Always strict mode, explicit return types on exports' };
INSERT INTO preferences { category: 'code', key: 'svelte_runes_only', value: 'true', notes: 'Svelte 5 runes ($state, $derived, $effect, $bindable), never legacy stores' };
INSERT INTO preferences { category: 'code', key: 'css_utility_first', value: 'true', notes: 'Tailwind v4 @theme, no inline style objects' };
INSERT INTO preferences { category: 'code', key: 'imports_js_extension', value: 'true', notes: 'Use .js extensions in TypeScript imports' };
INSERT INTO preferences { category: 'code', key: 'forEach_for_sets', value: 'true', notes: 'Use forEach for Set iteration (not for...of)' };
INSERT INTO preferences { category: 'git', key: 'conventional_commits', value: 'true', notes: 'feat:, fix:, refactor:, chore:, docs:, test:' };
INSERT INTO preferences { category: 'git', key: 'never_force_push_main', value: 'true', notes: 'Never force push to main/master' };
INSERT INTO preferences { category: 'git', key: 'never_amend_unless_asked', value: 'true', notes: 'Always new commits unless explicitly told to amend' };
INSERT INTO preferences { category: 'communication', key: 'be_direct', value: 'true', notes: 'Skip filler words and pleasantries' };
INSERT INTO preferences { category: 'communication', key: 'no_superlatives', value: 'true', notes: 'No Great question or Absolutely' };
INSERT INTO preferences { category: 'communication', key: 'execute_dont_ask', value: 'true', notes: 'When user says do it, execute. Stop asking clarifying questions.' };
INSERT INTO preferences { category: 'workflow', key: 'read_before_edit', value: 'true', notes: 'ALWAYS read files before editing' };
INSERT INTO preferences { category: 'workflow', key: 'verify_compiles', value: 'true', notes: 'Verify code compiles before reporting done' };
INSERT INTO preferences { category: 'workflow', key: 'no_over_engineering', value: 'true', notes: 'Only change what is asked. No extra abstraction.' };
INSERT INTO preferences { category: 'workflow', key: 'no_background_agents_foundation', value: 'true', notes: 'Do NOT use background agents for foundational/critical work' };

-- =============================================================================
-- LEARNINGS (CRITICAL — prevent repeated mistakes)
-- =============================================================================

INSERT INTO learnings { category: 'action', trigger: 'User says delete', wrong_action: 'Rewrite or refactor the thing', correct_action: 'DELETE THE FILE/CODE. User said delete, not rewrite.', severity: 'critical' };
INSERT INTO learnings { category: 'action', trigger: 'User says do it', wrong_action: 'Ask clarifying questions or enter plan mode', correct_action: 'Execute immediately without re-asking.', severity: 'critical' };
INSERT INTO learnings { category: 'action', trigger: 'User says fix it after debug', wrong_action: 'Propose multiple options', correct_action: 'Apply minimal targeted fix immediately.', severity: 'major' };
INSERT INTO learnings { category: 'architecture', trigger: 'Route files in Svelte 5', wrong_action: 'Ban $state, $derived, $effect from routes', correct_action: 'Routes ARE Svelte components. UI state in routes is CORRECT.', severity: 'critical' };
INSERT INTO learnings { category: 'architecture', trigger: 'ColdLight ARIA ownership', wrong_action: 'Assume Melt UI is the default ARIA provider', correct_action: 'ColdLight OWNS ARIA by default (WAI-ARIA APG). Melt UI is dsAdapter EXCEPTION ONLY.', severity: 'critical' };
INSERT INTO learnings { category: 'architecture', trigger: 'Taxonomy references', wrong_action: 'Use the word taxonomy anywhere', correct_action: 'Use CATALOG not taxonomy. Use SEMANTICS not components.', severity: 'critical' };
INSERT INTO learnings { category: 'architecture', trigger: 'Primitives and ARIA', wrong_action: 'Create structureless primitives with zero ARIA', correct_action: 'Primitives OWN their ARIA. ColdLight-owned WAI-ARIA APG patterns.', severity: 'critical' };
INSERT INTO learnings { category: 'architecture', trigger: 'Token pipeline', wrong_action: 'Reference Style Dictionary v4', correct_action: 'Style Dictionary v5 (SD5) + DTCG 1.0. SD5 drives everything.', severity: 'major' };
INSERT INTO learnings { category: 'architecture', trigger: 'Copying broken files', wrong_action: 'Copy files from old/broken architecture to fix imports', correct_action: 'Rewrite from scratch. Do NOT perpetuate broken patterns.', severity: 'critical' };
INSERT INTO learnings { category: 'communication', trigger: 'User is frustrated', wrong_action: 'Add more explanation, hedging, or planning', correct_action: 'Be direct. Execute. Stop talking.', severity: 'major' };
INSERT INTO learnings { category: 'workflow', trigger: 'MCP on Windows', wrong_action: 'Use npx as MCP command', correct_action: 'Use npx.cmd on Windows for stdio MCP servers.', severity: 'major' };

-- =============================================================================
-- PATTERNS (cross-project)
-- =============================================================================

INSERT INTO patterns { name: 'Svelte 5 Runes', category: 'svelte', description: '$state, $derived, $effect, $bindable, $props() — no legacy stores', example: 'let count = $state(0); let doubled = $derived(count * 2);' };
INSERT INTO patterns { name: 'Svelte 5 Context', category: 'svelte', description: 'setContext/getContext with getter function for reactivity in compound components', example: 'setContext(KEY, { get open() { return open; } })' };
INSERT INTO patterns { name: 'Tailwind v4 @theme', category: 'css', description: '@theme directive consumes SD5 tokens directly in CSS. No tailwind.config.js.', example: '@theme { --color-teal-500: oklch(0.55 0.18 180); }' };
INSERT INTO patterns { name: 'SD5 DTCG Token Format', category: 'tokens', description: 'Style Dictionary v5 with DTCG 1.0 format. $value, $type fields.', example: '{ "color": { "teal": { "$value": "oklch(0.55 0.18 180)", "$type": "color" } } }' };
INSERT INTO patterns { name: 'WAI-ARIA APG', category: 'a11y', description: 'W3C Accessible Rich Internet Applications Authoring Practices Guide. Native ARIA patterns.', source: 'https://www.w3.org/WAI/ARIA/apg/' };
