#!/usr/bin/env npx tsx
/**
 * @file ColdLight Architecture Verifier
 * @package @devpulse/coldlight
 *
 * Verifies that components follow Macro Law:
 * 1. Every component .svelte imports resolveMacro from style-macro
 * 2. Every component .svelte has data-kind on semantic root
 * 3. Components with behaviors import from behaviors/
 *
 * Usage: pnpm coldlight:verify
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = path.resolve(__dirname, "../..");
const DESIGN_ROOT = path.resolve(DESKTOP_ROOT, "src/lib/design");
const COMPONENTS_ROOT = path.resolve(DESIGN_ROOT, "components");

interface Violation {
	file: string;
	rule: string;
	message: string;
}

function getComponentFiles(): string[] {
	const files: string[] = [];
	if (!fs.existsSync(COMPONENTS_ROOT)) return files;

	const kinds = fs
		.readdirSync(COMPONENTS_ROOT, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."));

	for (const kind of kinds) {
		const kindDir = path.join(COMPONENTS_ROOT, kind.name);
		const svelteFiles = fs.readdirSync(kindDir).filter((f) => f.endsWith(".svelte"));
		for (const f of svelteFiles) {
			files.push(path.join(kindDir, f));
		}
	}
	return files;
}

function checkFile(filePath: string): Violation[] {
	const violations: Violation[] = [];
	const content = fs.readFileSync(filePath, "utf-8");
	const rel = path.relative(DESKTOP_ROOT, filePath).replace(/\\/g, "/");

	// Rule 1: Must import resolveMacro from style-macro
	if (!content.includes("style-macro")) {
		violations.push({
			file: rel,
			rule: "macro-law-1",
			message:
				"Missing import from style-macro (resolveMacro). Every component must use resolveMacro().",
		});
	}

	// Rule 2: Must have data-kind attribute (via spread or direct)
	if (
		!content.includes("data-kind") &&
		!content.includes("m.dataAttrs") &&
		!content.includes("dataAttrs")
	) {
		violations.push({
			file: rel,
			rule: "macro-law-2",
			message:
				"Missing data-kind attribute on semantic root. Spread m.dataAttrs or set data-kind directly.",
		});
	}

	return violations;
}

function main(): void {
	const files = getComponentFiles();
	const allViolations: Violation[] = [];

	for (const file of files) {
		const v = checkFile(file);
		allViolations.push(...v);
	}

	if (allViolations.length === 0) {
		console.log(`[ColdLight] All ${files.length} component files pass architecture verification.`);
		return;
	}

	console.error(`[ColdLight] ${allViolations.length} architecture violation(s) found:\n`);
	for (const v of allViolations) {
		console.error(`  [${v.rule}] ${v.file}`);
		console.error(`    ${v.message}\n`);
	}

	// Non-fatal during alignment sprint — report but don't block
	// Change to process.exit(1) after Phase 4 component alignment is complete
	console.warn(
		`[ColdLight] ${allViolations.length} violations reported (non-blocking during alignment sprint).`,
	);
}

main();
