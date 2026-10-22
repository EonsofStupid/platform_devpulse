#!/usr/bin/env npx tsx
/**
 * @file ColdLight Architecture Verifier
 * @package @devpulse/coldlight
 *
 * Verifies that components follow Macro Law:
 * 1. Root components that render DOM must import renderForge (or resolveSvgMacro)
 * 2. Root components must have data-kind on semantic root
 *
 * Exemptions:
 * - Sub-components (e.g. DialogContent.svelte) inherit from parent — no renderForge needed
 * - Renderless roots (only {@render children?.()}) have no DOM to put data-kind on
 * - SVG components use resolveSvgMacro instead of renderforge
 *
 * Usage: pnpm coldlight:verify
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = path.resolve(__dirname, "../..");
const DESIGN_ROOT = path.resolve(DESKTOP_ROOT, "../../packages/coldlight");
const COMPONENTS_ROOT = path.resolve(DESIGN_ROOT, "components");

const EXCLUDED_DIRS = [".claude", "sprints", "_transport", "_base", "_internal"];

interface Violation {
	file: string;
	rule: string;
	message: string;
}

/** Convert kebab-case to PascalCase: "alert-dialog" → "AlertDialog" */
function toPascal(kind: string): string {
	return kind
		.split("-")
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join("");
}

/**
 * Classify a .svelte file:
 * - "root": The main component (Button.svelte for button/)
 * - "sub": A compound child (DialogContent.svelte)
 */
function classifyFile(fileName: string, kind: string): "root" | "sub" {
	const rootName = `${toPascal(kind)}.svelte`;
	return fileName === rootName ? "root" : "sub";
}

/**
 * Detect if a .svelte file is renderless (no DOM output).
 * Renderless components are context providers that just render children.
 */
function isRenderless(content: string): boolean {
	const templateStart = content.lastIndexOf("</script>");
	if (templateStart === -1) return true;
	const template = content.slice(templateStart + 9).trim();

	const stripped = template
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/\{@render\s+children\?\.\(\)\}/g, "")
		.trim();

	return stripped === "" || stripped === "{@render children?.()}";
}

function getComponentDirs(): string[] {
	if (!fs.existsSync(COMPONENTS_ROOT)) return [];

	return fs
		.readdirSync(COMPONENTS_ROOT, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !EXCLUDED_DIRS.includes(d.name) && !d.name.startsWith("."))
		.map((d) => d.name);
}

function checkFile(filePath: string, kind: string, fileName: string): Violation[] {
	const violations: Violation[] = [];
	const content = fs.readFileSync(filePath, "utf-8");
	const rel = path.relative(DESKTOP_ROOT, filePath).replace(/\\/g, "/");

	const role = classifyFile(fileName, kind);
	const renderless = isRenderless(content);

	// Only root components that render DOM need the macro resolver
	const needsResolver = role === "root" && !renderless;

	// Rule 1: Must import renderForge (HTML) or resolveSvgMacro (SVG)
	if (needsResolver) {
		const hasStyleResolver = content.includes("renderforge") || content.includes("resolveSvgMacro");

		if (!hasStyleResolver) {
			violations.push({
				file: rel,
				rule: "macro-law-1",
				message:
					"Missing import from renderforge (renderForge). Root components must use renderForge().",
			});
		}
	}

	// Rule 2: Must have data-kind attribute (via styleAttrs, a spread, or direct)
	if (needsResolver) {
		if (
			!content.includes("data-kind") &&
			!content.includes("dataAttrs") &&
			!content.includes("styleAttrs(") &&
			!content.includes("Anatomy")
		) {
			violations.push({
				file: rel,
				rule: "macro-law-2",
				message:
					"Missing data-kind attribute on semantic root. Spread styleAttrs({ kind, … }) (plan 0006 §0s) or set data-kind directly.",
			});
		}
	}

	return violations;
}

function main(): void {
	const dirs = getComponentDirs();
	const allViolations: Violation[] = [];
	let totalFiles = 0;

	for (const kind of dirs) {
		const kindDir = path.join(COMPONENTS_ROOT, kind);
		const svelteFiles = fs
			.readdirSync(kindDir)
			.filter((f) => f.endsWith(".svelte") && !f.includes(".test."));

		for (const f of svelteFiles) {
			totalFiles++;
			const v = checkFile(path.join(kindDir, f), kind, f);
			allViolations.push(...v);
		}
	}

	if (allViolations.length === 0) {
		console.log(
			`[ColdLight] All ${totalFiles} component files across ${dirs.length} kinds pass architecture verification.`,
		);
		return;
	}

	console.error(`[ColdLight] ${allViolations.length} architecture violation(s) found:\n`);
	for (const v of allViolations) {
		console.error(`  [${v.rule}] ${v.file}`);
		console.error(`    ${v.message}\n`);
	}

	process.exit(1);
}

main();
