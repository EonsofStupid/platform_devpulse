/**
 * @file Quality Gate Checklist — Scriptable Agent Validator
 * @package @devpulse/coldlight
 *
 * ArkType-enforced hard stops. NOT warnings — errors that block.
 * Agents run this against every file they touch.
 * Errors include actionable fix instructions.
 *
 * Usage: npx tsx scripts/quality-gate/checklist.ts [file-or-dir]
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Violation {
	readonly file: string;
	readonly line: number;
	readonly rule: string;
	readonly message: string;
	readonly fix: string;
}

// ═══════════════════════════════════════════════════════════════
// ARKTYPE VALIDATORS — hard stops
// ═══════════════════════════════════════════════════════════════

/** Color values MUST be oklch — no hex, no rgb, no hsl */
const HexPattern = /^#[0-9a-fA-F]{3,8}$/;
const RgbPattern = /^rgb[a]?\(/;
const HslPattern = /^hsl[a]?\(/;

/** Dimension values MUST be rem or clamp() — no px (except source glassBlur which transforms) */
const PxPattern = /^\d+(\.\d+)?px$/;

// ═══════════════════════════════════════════════════════════════
// RULES
// ═══════════════════════════════════════════════════════════════

type Rule = (content: string, filePath: string) => Violation[];

const SVELTE_TS_RULES: Rule[] = [
	// ── No `any` type ──────────────────────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		content.split("\n").forEach((line, i) => {
			// Match `: any`, `as any`, `<any>` but not `biome-ignore` lines
			if (
				/(?<!biome-ignore.*)(?::\s*any\b|as\s+any\b|<any>)/.test(line) &&
				!line.includes("biome-ignore")
			) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-any",
					message: "`any` type detected",
					fix: "Replace with a concrete type. If external, use `unknown` and narrow.",
				});
			}
		});
		return violations;
	},

	// ── No console.log ─────────────────────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		content.split("\n").forEach((line, i) => {
			if (
				/console\.(log|warn|error|info|debug)\(/.test(line) &&
				!line.trimStart().startsWith("//")
			) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-console",
					message: "`console.*` detected",
					fix: "Use `logInfo`/`logError`/`logWarn` from `$lib/sys/logger.js`.",
				});
			}
		});
		return violations;
	},

	// ── No direct invoke() outside domain services ─────────────
	(content, file) => {
		const violations: Violation[] = [];
		// Only enforce outside of services/ and sys/
		if (file.includes("/services/") || file.includes("/sys/")) return violations;
		if (!file.includes("/routes/") && !file.includes("/layouts/") && !file.includes("/components/"))
			return violations;
		content.split("\n").forEach((line, i) => {
			if (/invoke\s*[<(]/.test(line) && !line.trimStart().startsWith("//")) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-direct-invoke",
					message: "`invoke()` called outside domain service layer",
					fix: "Move IPC calls to `$lib/domains/{name}/services/`. Routes and layouts import from domain.",
				});
			}
		});
		return violations;
	},

	// ── No legacy Svelte patterns ──────────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		if (!file.endsWith(".svelte")) return violations;
		content.split("\n").forEach((line, i) => {
			if (/export\s+let\s+/.test(line) && !line.includes("$props")) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-export-let",
					message: "`export let` detected — Svelte 4 pattern",
					fix: "Use `let { prop } = $props()` (Svelte 5 runes).",
				});
			}
			if (/\$:\s+/.test(line) && !line.includes("$derived") && !line.includes("$effect")) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-reactive-declarations",
					message: "`$:` reactive declaration detected — Svelte 4 pattern",
					fix: "Use `$derived()` for computed values or `$effect()` for side effects.",
				});
			}
			if (/<slot\s*/.test(line) && !line.includes("{#snippet") && !line.includes("data-slot")) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-slots",
					message: "`<slot>` detected — Svelte 4 pattern",
					fix: "Use `{#snippet}` and `{@render}` (Svelte 5).",
				});
			}
		});
		return violations;
	},

	// ── No hardcoded colors ────────────────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		if (!file.endsWith(".svelte")) return violations;
		content.split("\n").forEach((line, i) => {
			// Skip comments, style blocks that use var(), and class attributes
			if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;
			// Match hex colors in style attributes (not in class or var())
			if (/style[:=].*#[0-9a-fA-F]{3,8}/.test(line)) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-hardcoded-color",
					message: "Hardcoded hex color in style attribute",
					fix: "Use a CSS custom property: `var(--color-*)`, `var(--accent-*)`, or `var(--text-*)`.",
				});
			}
		});
		return violations;
	},

	// ── No TypeScript error suppression directives ─────────────
	(content, file) => {
		const violations: Violation[] = [];
		content.split("\n").forEach((line, i) => {
			if (/@ts-(ignore|expect-error)/.test(line)) {
				violations.push({
					file,
					line: i + 1,
					rule: "no-ts-ignore",
					message: "TypeScript error suppression detected",
					fix: "Fix the type error. If external dependency, use a typed wrapper.",
				});
			}
		});
		return violations;
	},

	// ── Components must use renderForge ─────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		if (!file.includes("/design/components/") || !file.endsWith(".svelte")) return violations;
		if (file.includes("_base") || file.includes("_internal")) return violations;
		if (!content.includes("renderForge")) {
			violations.push({
				file,
				line: 1,
				rule: "must-use-render-forge",
				message: "ColdLight component does not call `renderForge()`",
				fix: "Import `renderForge` from `$lib/design/renderforge` and call it with `{ kind, preset }`.",
			});
		}
		return violations;
	},

	// ── Components must have data-kind ──────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		if (!file.includes("/design/components/") || !file.endsWith(".svelte")) return violations;
		if (file.includes("_base") || file.includes("_internal")) return violations;
		if (!content.includes("data-kind")) {
			violations.push({
				file,
				line: 1,
				rule: "must-have-data-kind",
				message: "ColdLight component missing `data-kind` attribute",
				fix: "Spread `{...m.dataAttrs}` from renderForge() result on the semantic root element.",
			});
		}
		return violations;
	},

	// ── .js extension in imports ────────────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		content.split("\n").forEach((line, i) => {
			const match = line.match(/from\s+["'](\$lib\/[^"']+)["']/);
			if (match) {
				const importPath = match[1];
				// Must end in .js (for .ts files) or be a directory import
				if (
					!importPath.endsWith(".js") &&
					!importPath.endsWith("/") &&
					!importPath.includes(".svelte")
				) {
					violations.push({
						file,
						line: i + 1,
						rule: "js-extension-imports",
						message: `Import missing .js extension: ${importPath}`,
						fix: "Add `.js` extension to TypeScript imports (SvelteKit requirement).",
					});
				}
			}
		});
		return violations;
	},
];

const DTCG_RULES: Rule[] = [
	// ── Colors must be oklch ───────────────────────────────────
	(content, file) => {
		const violations: Violation[] = [];
		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(content);
		} catch {
			return violations;
		}

		function walkTokens(obj: Record<string, unknown>, path: string): void {
			for (const [key, val] of Object.entries(obj)) {
				if (val && typeof val === "object" && !Array.isArray(val)) {
					const record = val as Record<string, unknown>;
					if ("$value" in record && "$type" in record) {
						const value = String(record.$value);
						const tokenType = String(record.$type);
						if (tokenType === "color") {
							if (HexPattern.test(value)) {
								violations.push({
									file,
									line: 0,
									rule: "oklch-only",
									message: `Hex color at ${path}.${key}: ${value}`,
									fix: "Convert to oklch(). Use https://oklch.com for conversion.",
								});
							}
							if (RgbPattern.test(value)) {
								violations.push({
									file,
									line: 0,
									rule: "oklch-only",
									message: `RGB color at ${path}.${key}: ${value}`,
									fix: "Convert to oklch(). Use https://oklch.com for conversion.",
								});
							}
							if (HslPattern.test(value)) {
								violations.push({
									file,
									line: 0,
									rule: "oklch-only",
									message: `HSL color at ${path}.${key}: ${value}`,
									fix: "Convert to oklch(). Use https://oklch.com for conversion.",
								});
							}
						}
						if (tokenType === "dimension" && PxPattern.test(value)) {
							// Allow px in specific known files that SD5 transforms
							if (!file.includes("generated-scales")) {
								violations.push({
									file,
									line: 0,
									rule: "rem-only",
									message: `px dimension at ${path}.${key}: ${value}`,
									fix: "Convert to rem (divide by 16). E.g., 16px → 1rem.",
								});
							}
						}
					} else {
						walkTokens(record, `${path}.${key}`);
					}
				}
			}
		}

		walkTokens(parsed, "");
		return violations;
	},
];

// ═══════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════

function collectFiles(target: string): string[] {
	const stat = statSync(target);
	if (stat.isFile()) return [target];
	const files: string[] = [];
	function walk(dir: string): void {
		for (const entry of readdirSync(dir)) {
			const full = join(dir, entry);
			const s = statSync(full);
			if (s.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
				walk(full);
			} else if (s.isFile()) {
				files.push(full);
			}
		}
	}
	walk(target);
	return files;
}

function runChecklist(target: string): Violation[] {
	const files = collectFiles(resolve(target));
	const violations: Violation[] = [];

	for (const file of files) {
		const ext = extname(file);
		const content = readFileSync(file, "utf-8");

		if ([".ts", ".svelte"].includes(ext)) {
			for (const rule of SVELTE_TS_RULES) {
				violations.push(...rule(content, file));
			}
		}

		if (ext === ".json" && file.includes("tokens/src")) {
			for (const rule of DTCG_RULES) {
				violations.push(...rule(content, file));
			}
		}
	}

	return violations;
}

// ═══════════════════════════════════════════════════════════════
// CLI ENTRY
// ═══════════════════════════════════════════════════════════════

const target = process.argv[2] ?? "src/lib";
const violations = runChecklist(target);

if (violations.length === 0) {
	console.log(`\u2705 Quality gate PASSED — 0 violations in ${target}`);
	process.exit(0);
} else {
	console.error(`\u274c Quality gate FAILED — ${violations.length} violation(s):\n`);
	for (const v of violations) {
		console.error(`  ${v.file}:${v.line}`);
		console.error(`    RULE: ${v.rule}`);
		console.error(`    ${v.message}`);
		console.error(`    FIX: ${v.fix}`);
		console.error();
	}
	process.exit(1);
}
