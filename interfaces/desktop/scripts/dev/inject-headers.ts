/**
 * @file scripts/dev/inject-headers.ts
 * @module @devpulse/scripts/dev/inject-headers
 * @package @devpulse/scripts
 *
 * Schema-driven file header injection for the entire DevPulse platform.
 * Imports the master file schema and generates correct headers for every file type.
 *
 * Modes:
 *   check    — Report files missing/wrong headers. CI: exit 1 if any missing.
 *   inject   — Add schema-generated headers to files that have NO header.
 *   fix      — PATCH missing tags into existing headers. Inject if no header.
 *              Preserves all existing documentation content.
 *   validate — Strict: exit 1 if ANY file has wrong or missing header.
 *
 * Usage:
 *   pnpm headers:check                 - Report all files
 *   pnpm headers:inject                - Add missing headers
 *   pnpm headers:fix                   - Patch tags + inject missing
 *   pnpm headers:validate              - CI enforcement
 *   pnpm headers:check src/lib/design  - Target specific directory
 *
 * @since 1.0.0
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { resolveFileContext, ROOTS } from "./file-context.js";
import { matchRule } from "./file-schema.js";

// =============================================================================
// TYPES
// =============================================================================

type Status = "ok" | "missing" | "wrong" | "injected" | "patched" | "skipped" | "error";
type Command = "check" | "inject" | "fix" | "validate";

interface FileResult {
	path: string;
	localPath: string;
	status: Status;
	ruleName: string | null;
	message?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SUPPORTED_EXTENSIONS = new Set([".ts", ".js", ".svelte", ".css", ".rs"]);

const SKIP_PATTERNS = [
	/node_modules/,
	/\.git[/\\]/,
	/\.cowlevel/,
	/\.generated/,
	/\.svelte-kit/,
	/dist[/\\]/,
	/build[/\\]/,
	/coverage[/\\]/,
	/target[/\\]/,
	/\.d\.ts$/,
	/\.gen\.ts$/,
];

/** BOM (Byte Order Mark) for UTF-8 */
const BOM = "\uFEFF";

// =============================================================================
// HEADER DETECTION
// =============================================================================

/** Regex patterns to detect existing file headers by language */
const HEADER_PATTERNS: Record<string, RegExp> = {
	typescript: /^\/\*\*[\s\S]*?\*\//,
	svelte: /^<!--[\s\S]*?-->/,
	rust: /^(?:\/\/!.*(?:\n|$))+/,
	css: /^\/\*\*[\s\S]*?\*\//,
};

/**
 * Extract a file's preamble (BOM + shebang) and content body.
 * The preamble is preserved exactly and re-prepended on write.
 */
function splitPreamble(raw: string): { preamble: string; body: string } {
	let preamble = "";
	let body = raw;

	// Strip BOM
	if (body.startsWith(BOM)) {
		preamble += BOM;
		body = body.slice(1);
	}

	// Strip shebang (#!/...)
	if (body.startsWith("#!")) {
		const newline = body.indexOf("\n");
		if (newline !== -1) {
			preamble += body.slice(0, newline + 1);
			body = body.slice(newline + 1);
		}
	}

	return { preamble, body };
}

/**
 * Extract the existing header block from content (AFTER preamble removal).
 * Returns the matched header string or null.
 */
function extractExistingHeader(body: string, language: string): string | null {
	const pattern = HEADER_PATTERNS[language];
	if (!pattern) return null;

	const trimmed = body.trimStart();
	const match = trimmed.match(pattern);
	return match ? match[0] : null;
}

/**
 * Check that all required tags exist in the header text.
 */
function findMissingTags(header: string, requiredTags: string[]): string[] {
	return requiredTags.filter((tag) => !header.includes(tag));
}

// =============================================================================
// TAG PATCHING — the heart of `fix` mode
// =============================================================================

/**
 * Build the tag line content for a missing tag, reading from the generated header.
 * Returns the full line including the tag (e.g. " * @package @devpulse/coldlight").
 */
function extractTagLine(generatedHeader: string, tag: string): string | null {
	const lines = generatedHeader.split("\n");
	for (const line of lines) {
		if (line.includes(tag)) {
			return line;
		}
	}
	return null;
}

/**
 * Patch missing tags into an existing JSDoc/CSS header (/** ... *\/).
 * Inserts tag lines before the closing * / line.
 * Preserves all existing content.
 */
function patchJsDocHeader(existingHeader: string, missingTags: string[], generatedHeader: string): string {
	const tagLines: string[] = [];
	for (const tag of missingTags) {
		const line = extractTagLine(generatedHeader, tag);
		if (line) tagLines.push(line);
	}

	if (tagLines.length === 0) return existingHeader;

	// Find the closing */ and insert before it
	const closingIdx = existingHeader.lastIndexOf("*/");
	if (closingIdx === -1) return existingHeader; // malformed

	const before = existingHeader.slice(0, closingIdx).trimEnd();
	const after = existingHeader.slice(closingIdx);

	return before + "\n" + tagLines.join("\n") + "\n " + after;
}

/**
 * Patch missing tags into an existing Svelte header (<!-- ... -->).
 * Inserts tag lines before the closing -->.
 */
function patchSvelteHeader(existingHeader: string, missingTags: string[], generatedHeader: string): string {
	const tagLines: string[] = [];
	for (const tag of missingTags) {
		// For svelte, generated header uses different format (no * prefix)
		const genLines = generatedHeader.split("\n");
		for (const line of genLines) {
			if (line.includes(tag)) {
				tagLines.push(line);
				break;
			}
		}
	}

	if (tagLines.length === 0) return existingHeader;

	const closingIdx = existingHeader.lastIndexOf("-->");
	if (closingIdx === -1) return existingHeader;

	const before = existingHeader.slice(0, closingIdx).trimEnd();
	const after = existingHeader.slice(closingIdx);

	return before + "\n" + tagLines.join("\n") + "\n" + after;
}

/**
 * Patch missing tags into an existing Rust doc header (//! lines).
 * Appends tag lines at the end of the //! block.
 */
function patchRustHeader(existingHeader: string, missingTags: string[], generatedHeader: string): string {
	const tagLines: string[] = [];
	for (const tag of missingTags) {
		const genLines = generatedHeader.split("\n");
		for (const line of genLines) {
			if (line.includes(tag)) {
				tagLines.push(line);
				break;
			}
		}
	}

	if (tagLines.length === 0) return existingHeader;

	// Append to end of //! block
	const trimmed = existingHeader.trimEnd();
	return trimmed + "\n" + tagLines.join("\n") + "\n";
}

/**
 * Patch missing tags into an existing header, preserving all content.
 */
function patchHeader(existingHeader: string, missingTags: string[], generatedHeader: string, language: string): string {
	switch (language) {
		case "svelte":
			return patchSvelteHeader(existingHeader, missingTags, generatedHeader);
		case "rust":
			return patchRustHeader(existingHeader, missingTags, generatedHeader);
		default:
			return patchJsDocHeader(existingHeader, missingTags, generatedHeader);
	}
}

// =============================================================================
// FILE WALKER
// =============================================================================

function shouldSkip(filePath: string): boolean {
	return SKIP_PATTERNS.some((p) => p.test(filePath));
}

function walkDir(dir: string): string[] {
	const files: string[] = [];

	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "target") {
				continue;
			}

			if (entry.isDirectory()) {
				files.push(...walkDir(fullPath));
			} else {
				const ext = path.extname(entry.name);
				if (SUPPORTED_EXTENSIONS.has(ext) && !shouldSkip(fullPath)) {
					files.push(fullPath);
				}
			}
		}
	} catch {
		// Directory doesn't exist or not readable
	}

	return files;
}

// =============================================================================
// CORE PROCESSING
// =============================================================================

function processFile(filePath: string, command: Command): FileResult {
	try {
		const ctx = resolveFileContext(filePath);
		const rule = matchRule(ctx);

		if (!rule) {
			return { path: filePath, localPath: ctx.localPath, status: "skipped", ruleName: null };
		}

		const raw = fs.readFileSync(filePath, "utf-8");
		const { preamble, body } = splitPreamble(raw);
		const existingHeader = extractExistingHeader(body, ctx.language);
		const generatedHeader = rule.generateHeader(ctx);

		if (!generatedHeader) {
			return { path: filePath, localPath: ctx.localPath, status: "skipped", ruleName: rule.name };
		}

		// ── File HAS an existing header ─────────────────────────────────────
		if (existingHeader) {
			const missingTags = findMissingTags(existingHeader, rule.requiredTags);

			// All required tags present → OK
			if (missingTags.length === 0) {
				return { path: filePath, localPath: ctx.localPath, status: "ok", ruleName: rule.name };
			}

			// Tags are missing
			if (command === "fix") {
				// PATCH: insert missing tags into existing header, preserving content
				const patchedHeader = patchHeader(existingHeader, missingTags, generatedHeader, ctx.language);

				// Replace the old header with patched header in the body
				const trimmedBody = body.trimStart();
				const bodyAfterHeader = trimmedBody.slice(existingHeader.length);
				const newContent = preamble + patchedHeader + bodyAfterHeader;

				fs.writeFileSync(filePath, newContent, "utf-8");
				return {
					path: filePath,
					localPath: ctx.localPath,
					status: "patched",
					ruleName: rule.name,
					message: `Added: ${missingTags.join(", ")}`,
				};
			}

			return {
				path: filePath,
				localPath: ctx.localPath,
				status: "wrong",
				ruleName: rule.name,
				message: `Missing tags: ${missingTags.join(", ")}`,
			};
		}

		// ── File has NO header ──────────────────────────────────────────────
		if (command === "inject" || command === "fix") {
			const newContent = preamble + generatedHeader + body;
			fs.writeFileSync(filePath, newContent, "utf-8");
			return { path: filePath, localPath: ctx.localPath, status: "injected", ruleName: rule.name };
		}

		return { path: filePath, localPath: ctx.localPath, status: "missing", ruleName: rule.name };
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return { path: filePath, localPath: filePath, status: "error", ruleName: null, message };
	}
}

// =============================================================================
// REPORTING
// =============================================================================

function report(results: FileResult[], command: Command): void {
	const ok = results.filter((r) => r.status === "ok");
	const missing = results.filter((r) => r.status === "missing");
	const wrong = results.filter((r) => r.status === "wrong");
	const injected = results.filter((r) => r.status === "injected");
	const patched = results.filter((r) => r.status === "patched");
	const skipped = results.filter((r) => r.status === "skipped");
	const errors = results.filter((r) => r.status === "error");

	console.log("\n========================================");
	console.log("  DevPulse Header Injection Report");
	console.log("========================================\n");

	console.log(`  Command:   ${command}`);
	console.log(`  Scanned:   ${results.length} files`);
	console.log(`  OK:        ${ok.length}`);
	if (missing.length > 0) console.log(`  Missing:   ${missing.length}`);
	if (wrong.length > 0) console.log(`  Wrong:     ${wrong.length}`);
	if (injected.length > 0) console.log(`  Injected:  ${injected.length}`);
	if (patched.length > 0) console.log(`  Patched:   ${patched.length}`);
	console.log(`  Skipped:   ${skipped.length} (no matching rule)`);
	if (errors.length > 0) console.log(`  Errors:    ${errors.length}`);
	console.log();

	if (missing.length > 0) {
		console.log("--- Files Missing Headers ---");
		for (const r of missing) {
			console.log(`  ${r.localPath}  (rule: ${r.ruleName})`);
		}
		console.log();
	}

	if (wrong.length > 0) {
		console.log("--- Files With Incomplete Headers ---");
		for (const r of wrong) {
			console.log(`  ${r.localPath}  ${r.message ?? ""}`);
		}
		console.log();
	}

	if (injected.length > 0) {
		console.log("--- Headers Injected ---");
		for (const r of injected) {
			console.log(`  ${r.localPath}`);
		}
		console.log();
	}

	if (patched.length > 0) {
		console.log("--- Headers Patched (tags added) ---");
		for (const r of patched) {
			console.log(`  ${r.localPath}  ${r.message ?? ""}`);
		}
		console.log();
	}

	if (errors.length > 0) {
		console.log("--- Errors ---");
		for (const r of errors) {
			console.log(`  ${r.localPath}: ${r.message}`);
		}
		console.log();
	}
}

// =============================================================================
// CLI
// =============================================================================

function main(): void {
	const args = process.argv.slice(2);
	const command = (args[0] || "check") as Command;
	const targetArg = args[1];

	if (!["check", "inject", "fix", "validate"].includes(command)) {
		console.error(`Unknown command: ${command}`);
		console.error("Usage: inject-headers.ts [check|inject|fix|validate] [file-or-directory]");
		process.exit(1);
	}

	// Determine targets — supports files and directories
	let allFiles: string[] = [];

	if (targetArg) {
		const fullPath = path.resolve(process.cwd(), targetArg);
		const stat = fs.statSync(fullPath, { throwIfNoEntry: false });
		if (!stat) {
			console.error(`Target not found: ${fullPath}`);
			process.exit(1);
		}
		if (stat.isFile()) {
			allFiles = [fullPath];
		} else {
			allFiles = walkDir(fullPath);
		}
	} else {
		// Default: scan ALL platform directories that exist
		const targetDirs = [
			ROOTS.design,
			ROOTS.sys,
			ROOTS.domains,
			ROOTS.routes,
			path.join(ROOTS.tauri, "src"),
			path.join(ROOTS.engine, "src"),
			path.join(ROOTS.maestro, "src"),
			ROOTS.scripts,
			ROOTS.desktopScripts,
		].filter((d) => fs.existsSync(d));

		for (const dir of targetDirs) {
			allFiles = allFiles.concat(walkDir(dir));
		}
	}

	// Deduplicate (desktopScripts is inside desktop, could overlap)
	allFiles = [...new Set(allFiles.map((f) => path.resolve(f)))];

	// Process
	const results: FileResult[] = [];
	for (const file of allFiles) {
		results.push(processFile(file, command));
	}

	// Report
	report(results, command);

	// Exit codes
	const missing = results.filter((r) => r.status === "missing");
	const wrong = results.filter((r) => r.status === "wrong");
	const errors = results.filter((r) => r.status === "error");

	if (command === "validate" && (missing.length > 0 || wrong.length > 0)) {
		console.log(`FAIL: ${missing.length + wrong.length} files need attention.`);
		process.exit(1);
	}

	if (command === "check" && (missing.length > 0 || wrong.length > 0)) {
		const total = missing.length + wrong.length;
		console.log(`${total} files need attention. Run: pnpm headers:fix`);
		process.exit(1);
	}

	if (errors.length > 0) {
		process.exit(1);
	}
}

main();
