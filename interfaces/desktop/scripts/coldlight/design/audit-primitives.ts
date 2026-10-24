/**
 * @fileoverview Primitives audit script for ColdLight Design System
 * @module @devpulse/scripts/dev/design/audit-primitives
 * @layer scripts
 *
 * @description
 * Audits primitives/ folder for compound folder completeness.
 * Generates markdown table showing completion status.
 * Can update PRIMITIVES.md in-place with --update-md flag.
 *
 * Usage:
 *   pnpm audit:primitives            # Output markdown table to console
 *   pnpm audit:primitives --json     # Output JSON for CI/tooling
 *   pnpm audit:primitives --ci       # Exit 1 if any incomplete primitives
 *   pnpm audit:primitives --update-md # Update PRIMITIVES.md completion table
 *
 * @since 1.0.0
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================
// CONFIGURATION
// ============================================

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// Handle Windows paths (remove leading slash if present)
const normalizedDirname =
	__dirname.startsWith("/") && process.platform === "win32" ? __dirname.slice(1) : __dirname;

const WORKSPACE_ROOT = path.resolve(normalizedDirname, "../../..");
// biome-ignore lint/correctness/noUnusedVariables: restored (owner rule: nothing deleted for being unused); the primitives it located now live in packages/coldlight
const SRC_ROOT = path.join(WORKSPACE_ROOT, "src");
const COLDLIGHT_ROOT = path.join(WORKSPACE_ROOT, "../../packages/coldlight");
const PRIMITIVES_ROOT = path.join(COLDLIGHT_ROOT, "primitives");
// Since 2026-04-09 (fa3d3378) a primitive's code lives in its behavior
// (`behaviors/<group>/<kind>/`) and its tests with its component
// (`components/<kind>/`); its folder under primitives/ keeps the spec.
const BEHAVIORS_ROOT = path.join(COLDLIGHT_ROOT, "behaviors");
const COMPONENTS_ROOT = path.join(COLDLIGHT_ROOT, "components");
const PRIMITIVES_MD = path.join(PRIMITIVES_ROOT, "PRIMITIVES.md");

const _REQUIRED_FILES = ["index.ts", "types.ts", "a11y.md"];
const MARKER_BEGIN = "<!-- BEGIN:AUDIT_TABLE -->";
const MARKER_END = "<!-- END:AUDIT_TABLE -->";

// ============================================
// TYPES
// ============================================

interface AuditResult {
	name: string;
	hasIndex: boolean;
	hasTypes: boolean;
	hasA11y: boolean;
	hasTests: boolean;
	hasTestSvelte: boolean;
	testCount: number;
	hasDataPrimitive: boolean;
	isComplete: boolean;
}

interface AuditSummary {
	generated: string;
	primitives: AuditResult[];
	monolithicCount: number;
	completeCount: number;
	incompleteCount: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Count tests by parsing test file for it( / test( calls.
 */
function countTests(testFilePath: string): number {
	try {
		const content = fs.readFileSync(testFilePath, "utf-8");
		const matches = content.match(/\b(?:it|test)\s*\(/g);
		return matches?.length ?? 0;
	} catch {
		return 0;
	}
}

/**
 * Check if svelte files contain correct data-kind attribute.
 */
function checkDataPrimitive(folder: string, name: string): boolean {
	try {
		const entries = fs.readdirSync(folder, { withFileTypes: true });
		const svelteFiles = entries
			.filter((e) => e.isFile() && e.name.endsWith(".svelte") && !e.name.endsWith(".test.svelte"))
			.map((e) => path.join(folder, e.name));

		if (svelteFiles.length === 0) return false;

		for (const file of svelteFiles) {
			const content = fs.readFileSync(file, "utf-8");
			if (!content.includes(`data-kind="${name}"`)) {
				return false;
			}
		}
		return true;
	} catch {
		return false;
	}
}

/**
 * Get all primitive folders (directories with index.ts).
 */
function getPrimitiveFolders(): string[] {
	const folders: string[] = [];

	try {
		const entries = fs.readdirSync(PRIMITIVES_ROOT, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const indexPath = path.join(PRIMITIVES_ROOT, entry.name, "index.ts");
				// Only include folders that have an index.ts (compound primitives)
				// or check if folder looks like a primitive folder
				if (
					fs.existsSync(indexPath) ||
					fs.existsSync(path.join(PRIMITIVES_ROOT, entry.name, "types.ts")) ||
					fs.existsSync(path.join(PRIMITIVES_ROOT, entry.name, `${entry.name}.spec.ts`))
				) {
					folders.push(entry.name);
				}
			}
		}
	} catch (err) {
		console.error("Error reading primitives directory:", err);
	}

	return folders.sort();
}

/**
 * Count monolithic svelte files (not in folders).
 */
function countMonolithicFiles(): number {
	try {
		const entries = fs.readdirSync(PRIMITIVES_ROOT, { withFileTypes: true });
		return entries.filter(
			(e) => e.isFile() && e.name.endsWith(".svelte") && !e.name.endsWith(".test.svelte"),
		).length;
	} catch {
		return 0;
	}
}

/** kind → its behavior folder (the one holding `<kind>.anatomy.ts`). */
const BEHAVIOR_FOLDERS: Map<string, string> = (() => {
	const folders = new Map<string, string>();
	try {
		for (const entry of fs.readdirSync(BEHAVIORS_ROOT, { recursive: true, withFileTypes: true })) {
			const match = entry.isFile() && /^([a-z][a-z0-9-]*)\.anatomy\.ts$/.exec(entry.name);
			if (match) folders.set(match[1], entry.parentPath);
		}
	} catch {
		// No behaviors folder: every primitive is audited on its own folder.
	}
	return folders;
})();

/**
 * Audit a single primitive: its own folder, else its behavior (code) and
 * component (tests). The a11y contract is `a11y.md` or `<kind>.spec.ts`.
 */
function auditPrimitive(name: string): AuditResult {
	const folder = path.join(PRIMITIVES_ROOT, name);
	const behavior = BEHAVIOR_FOLDERS.get(name);
	// A primitive renders its own markup when its folder holds a .svelte;
	// otherwise its code is its behavior's.
	const ownCode = fs
		.readdirSync(folder)
		.some((f) => f.endsWith(".svelte") && !f.includes(".test."));

	const hasIndex =
		fs.existsSync(path.join(folder, "index.ts")) ||
		(behavior !== undefined && fs.existsSync(path.join(behavior, "index.ts")));
	const hasTypes =
		fs.existsSync(path.join(folder, "types.ts")) ||
		(behavior !== undefined && fs.existsSync(path.join(behavior, `${name}.types.ts`)));
	const hasA11y =
		fs.existsSync(path.join(folder, "a11y.md")) ||
		fs.existsSync(path.join(folder, `${name}.spec.ts`));

	// Find test files: the primitive's own, else its component's
	const pascal = toPascalCase(name);
	const testDir = fs.existsSync(path.join(folder, `${pascal}.test.ts`))
		? folder
		: path.join(COMPONENTS_ROOT, name);
	const testTsPath = path.join(testDir, `${pascal}.test.ts`);
	const testSveltePath = path.join(testDir, `${pascal}.test.svelte`);
	const hasTests = fs.existsSync(testTsPath);
	const hasTestSvelte = fs.existsSync(testSveltePath);
	const testCount = hasTests ? countTests(testTsPath) : 0;

	// A behavior-bound primitive gets data-kind from its anatomy's attrs.
	const hasDataPrimitive = ownCode ? checkDataPrimitive(folder, name) : behavior !== undefined;

	// A test harness .svelte is needed only where the primitive renders its own markup.
	const isComplete =
		hasIndex &&
		hasTypes &&
		hasA11y &&
		hasTests &&
		(ownCode ? hasTestSvelte : true) &&
		hasDataPrimitive;

	return {
		name,
		hasIndex,
		hasTypes,
		hasA11y,
		hasTests,
		hasTestSvelte,
		testCount,
		hasDataPrimitive,
		isComplete,
	};
}

/**
 * Convert folder name to PascalCase for test file lookup.
 * Handles hyphenated names: "alert-dialog" -> "AlertDialog"
 */
function toPascalCase(s: string): string {
	return s
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

// ============================================
// OUTPUT FORMATTERS
// ============================================

/**
 * Format audit results as markdown table.
 */
function formatMarkdownTable(results: AuditResult[]): string {
	const lines: string[] = [
		"| Primitive | index | types | a11y | tests | Status |",
		"|-----------|-------|-------|------|-------|--------|",
	];

	for (const r of results) {
		const check = (v: boolean) => (v ? "✅" : "❌");
		const status = r.isComplete ? "✅" : "🔄";
		const testDisplay = r.testCount > 0 ? String(r.testCount) : "❌";

		lines.push(
			`| ${r.name} | ${check(r.hasIndex)} | ${check(r.hasTypes)} | ${check(r.hasA11y)} | ${testDisplay} | ${status} |`,
		);
	}

	return lines.join("\n");
}

/**
 * Format full audit output for console.
 */
function formatConsoleOutput(summary: AuditSummary): string {
	const lines: string[] = [
		"",
		"## ColdLight Primitives Audit",
		"",
		`Generated: ${summary.generated}`,
		"",
		formatMarkdownTable(summary.primitives),
		"",
		"### Summary",
		`- Complete: ${summary.completeCount}`,
		`- Incomplete: ${summary.incompleteCount}`,
		`- Monolithic files (pending conversion): ${summary.monolithicCount}`,
		"",
	];

	return lines.join("\n");
}

// ============================================
// UPDATE PRIMITIVES.MD
// ============================================

/**
 * Update PRIMITIVES.md completion table in-place.
 */
function updatePrimitivesMd(summary: AuditSummary): boolean {
	try {
		if (!fs.existsSync(PRIMITIVES_MD)) {
			console.error(`❌ PRIMITIVES.md not found at: ${PRIMITIVES_MD}`);
			console.error("   Create it first using the template from the plan.");
			return false;
		}

		const content = fs.readFileSync(PRIMITIVES_MD, "utf-8");

		const beginIndex = content.indexOf(MARKER_BEGIN);
		const endIndex = content.indexOf(MARKER_END);

		if (beginIndex === -1 || endIndex === -1) {
			console.error("❌ PRIMITIVES.md missing audit markers.");
			console.error(`   Add ${MARKER_BEGIN} and ${MARKER_END} markers.`);
			return false;
		}

		const table = formatMarkdownTable(summary.primitives);
		const newContent =
			content.slice(0, beginIndex + MARKER_BEGIN.length) +
			"\n" +
			table +
			"\n" +
			content.slice(endIndex);

		fs.writeFileSync(PRIMITIVES_MD, newContent, "utf-8");
		console.log(`✅ Updated ${PRIMITIVES_MD}`);
		return true;
	} catch (err) {
		console.error("❌ Error updating PRIMITIVES.md:", err);
		return false;
	}
}

// ============================================
// MAIN
// ============================================

function main(): void {
	const args = process.argv.slice(2);
	const jsonOutput = args.includes("--json");
	const ciMode = args.includes("--ci");
	const updateMd = args.includes("--update-md");

	// Get primitive folders
	const folders = getPrimitiveFolders();

	// Audit each folder
	const results = folders.map(auditPrimitive);

	// Build summary
	const summary: AuditSummary = {
		generated: new Date().toISOString().replace("T", " ").slice(0, 19),
		primitives: results,
		monolithicCount: countMonolithicFiles(),
		completeCount: results.filter((r) => r.isComplete).length,
		incompleteCount: results.filter((r) => !r.isComplete).length,
	};

	// Output based on flags
	if (jsonOutput) {
		console.log(JSON.stringify(summary, null, 2));
	} else if (updateMd) {
		updatePrimitivesMd(summary);
		console.log(formatConsoleOutput(summary));
	} else {
		console.log(formatConsoleOutput(summary));
	}

	// CI mode: exit 1 if any incomplete
	if (ciMode && summary.incompleteCount > 0) {
		console.error(`\n❌ CI Check Failed: ${summary.incompleteCount} incomplete primitive(s)`);
		process.exit(1);
	}
}

main();
