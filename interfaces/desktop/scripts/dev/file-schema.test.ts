/**
 * @file scripts/dev/file-schema.test.ts
 * @module @devpulse/scripts/dev/file-schema.test
 * @package @devpulse/scripts
 *
 * Tests for file-context resolver, file-schema matching, and header generation.
 * Exercises real paths from the DevPulse platform — not mocks.
 *
 * Run: npx tsx scripts/dev/file-schema.test.ts
 * Exit code 0 = all pass, 1 = failures.
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFileContext } from "./file-context.js";
import { matchRule, generateHeader } from "./file-schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(__dirname, "../..");

// =============================================================================
// TEST HARNESS
// =============================================================================

let passed = 0;
let failed = 0;
let currentGroup = "";

function group(name: string): void {
	currentGroup = name;
	console.log(`\n── ${name} ──`);
}

function assert(description: string, condition: boolean, detail?: string): void {
	if (condition) {
		console.log(`  ✓ ${description}`);
		passed++;
	} else {
		console.log(`  ✗ ${description}`);
		if (detail) console.log(`    → ${detail}`);
		failed++;
	}
}

function eq(description: string, actual: unknown, expected: unknown): void {
	assert(description, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function includes(description: string, haystack: string, needle: string): void {
	assert(description, haystack.includes(needle), `"${needle}" not found in output`);
}

function notIncludes(description: string, haystack: string, needle: string): void {
	assert(description, !haystack.includes(needle), `"${needle}" should not appear in output`);
}

function abs(relativePath: string): string {
	return path.join(DESKTOP, relativePath);
}

// =============================================================================
// FILE CONTEXT TESTS
// =============================================================================

group("FileContext — Namespace Resolution");

{
	const ctx = resolveFileContext(abs("src/lib/design/primitives/button/types.ts"));
	eq("design/primitives → @devpulse/coldlight", ctx.namespace, "@devpulse/coldlight");
	eq("layer = primitives", ctx.layer, "primitives");
	eq("kind = button", ctx.kind, "button");
	eq("kindPascal = Button", ctx.kindPascal, "Button");
	eq("language = typescript", ctx.language, "typescript");
	eq("ext = .ts", ctx.ext, ".ts");
	eq("isInternal = false", ctx.isInternal, false);
	eq("isTransport = false", ctx.isTransport, false);
	eq("isSchema = false", ctx.isSchema, false);
}

{
	const ctx = resolveFileContext(abs("src/lib/sys/index.ts"));
	eq("sys/ → @devpulse/sys", ctx.namespace, "@devpulse/sys");
	eq("sys layer = sys", ctx.layer, "sys");
}

{
	const ctx = resolveFileContext(abs("src/lib/sys/runes/global.svelte.ts"));
	eq("sys/runes → @devpulse/sys", ctx.namespace, "@devpulse/sys");
	eq("runes layer = state", ctx.layer, "state");
}

{
	const ctx = resolveFileContext(abs("src/lib/domains/app/devpulse/index.ts"));
	eq("domains/app → @devpulse/domains/app", ctx.namespace, "@devpulse/domains/app");
	eq("domain = app", ctx.domain, "app");
}

{
	const ctx = resolveFileContext(abs("src/routes/(app)/devpulse/+page.svelte"));
	eq("routes → @devpulse/routes", ctx.namespace, "@devpulse/routes");
	eq("routeGroup = app", ctx.routeGroup, "app");
}

{
	const ctx = resolveFileContext(abs("src-tauri/src/commands/chat/mod.rs"));
	eq("src-tauri → @devpulse/tauri", ctx.namespace, "@devpulse/tauri");
	eq("tauri layer = commands", ctx.layer, "commands");
	eq("language = rust", ctx.language, "rust");
}

group("FileContext — ColdLight Layer Detection");

{
	const tokens = resolveFileContext(abs("src/lib/design/tokens/tokens.ts"));
	eq("tokens/ → layer tokens", tokens.layer, "tokens");

	const actions = resolveFileContext(abs("src/lib/design/actions/useClickOutside.ts"));
	eq("actions/ → layer actions", actions.layer, "actions");

	const utils = resolveFileContext(abs("src/lib/design/utils/cn.ts"));
	eq("utils/ → layer utils", utils.layer, "utils");

	const config = resolveFileContext(abs("src/lib/design/config/coldlight/identity.cfg.ts"));
	eq("config/ → layer config", config.layer, "config");

	const molecules = resolveFileContext(abs("src/lib/design/molecules/glass.css"));
	eq("molecules/ → layer molecules", molecules.layer, "molecules");

	const recipes = resolveFileContext(abs("src/lib/design/recipes/components/dialog/dialog.default.ts"));
	eq("recipes/ → layer recipes", recipes.layer, "recipes");

	const blueprints = resolveFileContext(abs("src/lib/design/blueprints/components/dialog/dialog.default.ts"));
	eq("blueprints/ → layer blueprints", blueprints.layer, "blueprints");

	const blocks = resolveFileContext(abs("src/lib/design/blocks/dialogs/index.ts"));
	eq("blocks/ → layer blocks", blocks.layer, "blocks");

	const patterns = resolveFileContext(abs("src/lib/design/patterns/data/index.ts"));
	eq("patterns/ → layer patterns", patterns.layer, "patterns");

	const plugins = resolveFileContext(abs("src/lib/design/plugins/parasite/index.ts"));
	eq("plugins/ → layer plugins", plugins.layer, "plugins");
}

group("FileContext — Kind Resolution");

{
	eq("primitives/button → button", resolveFileContext(abs("src/lib/design/primitives/button/types.ts")).kind, "button");
	eq("primitives/dialog → dialog", resolveFileContext(abs("src/lib/design/primitives/dialog/index.ts")).kind, "dialog");
	eq("_internal/accordion → accordion", resolveFileContext(abs("src/lib/design/api/dsadapters/meltui/_internal/accordion/factory.ts")).kind, "accordion");
	eq("components/button → button", resolveFileContext(abs("src/lib/design/components/button/Button.svelte")).kind, "button");
	eq("_schema/types → null (not a kind)", resolveFileContext(abs("src/lib/design/primitives/_schema/types.ts")).kind, null);
	eq("actions/use → null (no kind)", resolveFileContext(abs("src/lib/design/actions/useClickOutside.ts")).kind, null);
}

group("FileContext — Internal/Transport/Schema flags");

{
	const internal = resolveFileContext(abs("src/lib/design/api/dsadapters/meltui/_internal/dialog/factory.ts"));
	eq("_internal/ → isInternal=true", internal.isInternal, true);
	eq("factory.ts → isTransport=false", internal.isTransport, false);

	const transport = resolveFileContext(abs("src/lib/design/api/dsadapters/meltui/_internal/dialog/_transport/types.ts"));
	eq("_transport/ → isTransport=true", transport.isTransport, true);
	eq("_transport/ → isInternal=true (parent)", transport.isInternal, true);

	const schema = resolveFileContext(abs("src/lib/design/primitives/_schema/types.ts"));
	eq("_schema/ → isSchema=true", schema.isSchema, true);
}

group("FileContext — Contract Loading");

{
	const ctx = resolveFileContext(abs("src/lib/design/primitives/button/types.ts"));
	eq("button has contract", ctx.hasContract, true);
	eq("button ariaStateProvider = coldlight", ctx.ariaStateProvider, "coldlight");
}

// =============================================================================
// SCHEMA MATCHING TESTS
// =============================================================================

group("Schema Matching — ColdLight Primitives");

{
	const cases: Array<[string, string]> = [
		["src/lib/design/primitives/button/types.ts", "primitive-types"],
		["src/lib/design/primitives/button/contract.ts", "primitive-contract"],
		["src/lib/design/primitives/button/Button.svelte", "primitive-svelte"],
		["src/lib/design/primitives/button/Button.test.ts", "primitive-test"],
		["src/lib/design/primitives/button/index.ts", "primitive-index"],
		["src/lib/design/primitives/_schema/types.ts", "primitive-schema"],
		["src/lib/design/primitives/types.ts", "primitive-root-file"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

group("Schema Matching — MeltUI Adapters");

{
	const cases: Array<[string, string]> = [
		["src/lib/design/api/dsadapters/meltui/_internal/dialog/factory.ts", "internal-factory"],
		["src/lib/design/api/dsadapters/meltui/_internal/dialog/_transport/types.ts", "internal-transport-types"],
		["src/lib/design/api/dsadapters/meltui/_internal/dialog/_transport/factory.ts", "internal-transport-factory"],
		["src/lib/design/api/dsadapters/meltui/_internal/dialog/_transport/index.ts", "internal-transport-index"],
		["src/lib/design/api/dsadapters/meltui/_internal/dialog/index.ts", "internal-index"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

group("Schema Matching — ColdLight Adapters");

{
	const cases: Array<[string, string]> = [
		["src/lib/design/api/dsadapters/coldlight/_internal/dialog/dialog.svelte.ts", "coldlight-adapter-svelte-ts"],
		["src/lib/design/api/dsadapters/coldlight/_internal/dialog/index.ts", "coldlight-adapter-index"],
		["src/lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/types.ts", "coldlight-adapter-transport-types"],
		["src/lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/factory.ts", "coldlight-adapter-transport-factory"],
		["src/lib/design/api/dsadapters/coldlight/_internal/dialog/_transport/index.ts", "coldlight-adapter-transport-index"],
		["src/lib/design/api/dsadapters/coldlight/_internal/_transport/types.ts", "coldlight-shared-transport"],
		["src/lib/design/api/dsadapters/coldlight/_internal/_transport/ids.ts", "coldlight-shared-transport"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

group("Schema Matching — Components, Recipes, Blueprints, Blocks, Patterns, Plugins");

{
	const cases: Array<[string, string]> = [
		["src/lib/design/components/button/Button.svelte", "component-svelte"],
		["src/lib/design/components/button/index.ts", "component-index"],
		["src/lib/design/components/button/types.ts", "component-ts"],
		["src/lib/design/components/types.ts", "component-root-file"],
		["src/lib/design/components/schema.ts", "component-root-file"],
		["src/lib/design/recipes/components/dialog/dialog.default.ts", "recipe-file"],
		["src/lib/design/recipes/types.ts", "recipe-root-file"],
		["src/lib/design/recipes/utils.ts", "recipe-root-file"],
		["src/lib/design/blueprints/components/dialog/dialog.default.ts", "blueprint-file"],
		["src/lib/design/blueprints/types.ts", "blueprint-root-file"],
		["src/lib/design/blocks/dialogs/index.ts", "block-file"],
		["src/lib/design/patterns/data/index.ts", "pattern-file"],
		["src/lib/design/plugins/parasite/index.ts", "plugin-ts"],
		["src/lib/design/plugins/parasite/parasite.css", "plugin-css"],
		["src/lib/design/plugins/parasite/Parasite.svelte", "plugin-svelte"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

group("Schema Matching — Actions, Utils, Tokens, Config, Molecules");

{
	const cases: Array<[string, string]> = [
		["src/lib/design/actions/useClickOutside.ts", "action-file"],
		["src/lib/design/utils/cn.ts", "util-file"],
		["src/lib/design/tokens/tokens.ts", "token-file"],
		["src/lib/design/tokens/tokens.css", "token-css"],
		["src/lib/design/config/coldlight/identity.cfg.ts", "config-file"],
		["src/lib/design/molecules/glass.css", "molecule-css"],
		["src/lib/design/api/actions/aria.ts", "api-action-file"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

group("Schema Matching — ColdLight Barrels and Root");

{
	const cases: Array<[string, string]> = [
		["src/lib/design/actions/index.ts", "coldlight-index"],
		["src/lib/design/utils/index.ts", "coldlight-index"],
		["src/lib/design/tokens/index.ts", "coldlight-index"],
		["src/lib/design/index.css", "coldlight-root-css"],
		["src/lib/design/scanner.ts", "coldlight-root-file"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

group("Schema Matching — Non-ColdLight namespaces");

{
	const cases: Array<[string, string]> = [
		["src/lib/sys/index.ts", "sys-file"],
		["src/lib/sys/runes/global.svelte.ts", "sys-rune-file"],
		["src/routes/(app)/devpulse/+page.svelte", "route-svelte"],
		["src-tauri/src/commands/chat/mod.rs", "tauri-rust"],
	];
	for (const [file, expected] of cases) {
		const ctx = resolveFileContext(abs(file));
		const rule = matchRule(ctx);
		eq(`${ctx.localPath} → ${expected}`, rule?.name ?? "null", expected);
	}
}

// =============================================================================
// HEADER GENERATION TESTS
// =============================================================================

group("Header Generation — Content Validation");

{
	const ctx = resolveFileContext(abs("src/lib/design/primitives/button/contract.ts"));
	const header = generateHeader(ctx)!;
	includes("contract header has @file", header, "@file primitives/button/contract.ts");
	includes("contract header has @kind", header, "@kind button");
	includes("contract header has @layer", header, "@layer primitives");
	includes("contract header has @package", header, "@package @devpulse/coldlight");
	includes("contract header has ariaStateProvider", header, 'ariaStateProvider: "coldlight"');
	includes("contract header has WAI-ARIA link", header, "WAI-ARIA APG");
	notIncludes("contract header has NO TODO", header, "TODO");
}

{
	const ctx = resolveFileContext(abs("src/lib/design/api/dsadapters/meltui/_internal/dialog/factory.ts"));
	const header = generateHeader(ctx)!;
	includes("factory header has @internal", header, "@internal");
	includes("factory header has @builder", header, "@builder new Dialog()");
	includes("factory header has @package", header, "@package @devpulse/coldlight");
	notIncludes("factory header has NO TODO", header, "TODO");
}

{
	const ctx = resolveFileContext(abs("src/lib/design/primitives/button/Button.svelte"));
	const header = generateHeader(ctx)!;
	assert("svelte header starts with <!--", header.startsWith("<!--"), `starts with: ${header.slice(0, 10)}`);
	includes("svelte header has @component", header, "@component Button");
	includes("svelte header has zero ARIA note", header, "Zero ARIA");
}

{
	const ctx = resolveFileContext(abs("src-tauri/src/commands/chat/mod.rs"));
	const header = generateHeader(ctx)!;
	assert("rust header starts with //!", header.startsWith("//!"), `starts with: ${header.slice(0, 10)}`);
	includes("rust header has @file", header, "@file");
	includes("rust header has @layer", header, "@layer commands");
}

{
	const ctx = resolveFileContext(abs("src/lib/design/actions/useClickOutside.ts"));
	const header = generateHeader(ctx)!;
	includes("action header has use:clickOutside", header, "use:clickOutside");
}

{
	const ctx = resolveFileContext(abs("src/routes/(app)/devpulse/+page.svelte"));
	const header = generateHeader(ctx)!;
	includes("route header has route group", header, "route group (app)");
}

// =============================================================================
// HEADER GENERATION — EDGE CASES
// =============================================================================

group("Header Generation — Edge Cases");

{
	// Multi-word kind — use types.ts which renders PascalCase in body
	const ctx = resolveFileContext(abs("src/lib/design/primitives/alert-dialog/types.ts"));
	const header = generateHeader(ctx)!;
	includes("alert-dialog kind preserved", header, "@kind alert-dialog");
	includes("alert-dialog PascalCase in body", header, "AlertDialog");

	// Index barrel doesn't use PascalCase — verify it still matches
	const idxCtx = resolveFileContext(abs("src/lib/design/primitives/alert-dialog/index.ts"));
	const idxHeader = generateHeader(idxCtx)!;
	includes("alert-dialog index has correct kind", idxHeader, "@kind alert-dialog");
}

{
	// .svelte.ts rune file
	const ctx = resolveFileContext(abs("src/lib/sys/runes/global.svelte.ts"));
	const header = generateHeader(ctx)!;
	includes("rune file has @layer state", header, "@layer state");
	includes("rune file mentions $state/$derived", header, "$state/$derived");
}

// =============================================================================
// SUMMARY
// =============================================================================

console.log(`\n${"=".repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${"=".repeat(50)}\n`);

if (failed > 0) process.exit(1);
