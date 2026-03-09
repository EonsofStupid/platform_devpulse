/**
 * @file Registry Validator — Build-Time Disk State Enforcement
 * @package @devpulse/coldlight
 *
 * Checks that the filesystem matches the registry.
 * Every registered kind MUST have:
 *   - ColdLight: schema.ts, adapter.ts, factory.ts, types.ts in coldlight/_internal/{kind}/
 *   - MeltUI: schema.ts, factory.ts, _transport/ in meltui/_internal/{kind}/
 *
 * Also detects orphan folders (on disk but not in registry).
 *
 * Run at build time via: validateRegistry(designRoot)
 * Exits non-zero if any errors found.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { KIND_REGISTRY, KIND_MAP, type KindRegistryEntry } from "./kinds.js";

// =============================================================================
// REQUIRED FILES PER ENGINE
// =============================================================================

/** Files that MUST exist in a ColdLight adapter folder. */
const COLDLIGHT_REQUIRED_FILES = ["schema.ts", "adapter.ts", "factory.ts", "types.ts"] as const;

/** Files that MUST exist in a MeltUI adapter folder. */
const MELTUI_REQUIRED_FILES = ["schema.ts", "factory.ts"] as const;

/** Directories that MUST exist in a MeltUI adapter folder. */
const MELTUI_REQUIRED_DIRS = ["_transport"] as const;

// =============================================================================
// VALIDATION RESULT
// =============================================================================

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	stats: {
		kindsChecked: number;
		filesChecked: number;
		orphanFolders: string[];
	};
}

// =============================================================================
// VALIDATOR
// =============================================================================

/**
 * Validate that the filesystem matches the adapter kind registry.
 *
 * @param designRoot — absolute path to `interfaces/desktop/src/lib/design/`
 * @returns ValidationResult with errors, warnings, and stats
 */
export function validateRegistry(designRoot: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	let filesChecked = 0;

	const coldlightBase = join(designRoot, "api", "dsadapters", "coldlight", "_internal");
	const meltuiBase = join(designRoot, "api", "dsadapters", "meltui", "_internal");

	// ─── Check every registered kind has its required files ───────────────
	for (const entry of KIND_REGISTRY) {
		const base = entry.engine === "coldlight" ? coldlightBase : meltuiBase;
		const kindDir = join(base, entry.folder);

		// Folder must exist
		if (!existsSync(kindDir) || !statSync(kindDir).isDirectory()) {
			errors.push(`[${entry.kind}] Missing adapter folder: ${entry.engine}/_internal/${entry.folder}/`);
			continue;
		}

		// Check required files
		const requiredFiles = entry.engine === "coldlight" ? COLDLIGHT_REQUIRED_FILES : MELTUI_REQUIRED_FILES;
		for (const file of requiredFiles) {
			const filePath = join(kindDir, file);
			filesChecked++;
			if (!existsSync(filePath)) {
				errors.push(`[${entry.kind}] Missing required file: ${entry.engine}/_internal/${entry.folder}/${file}`);
			}
		}

		// Check required dirs (MeltUI only)
		if (entry.engine === "meltui") {
			for (const dir of MELTUI_REQUIRED_DIRS) {
				const dirPath = join(kindDir, dir);
				filesChecked++;
				if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
					errors.push(`[${entry.kind}] Missing required directory: meltui/_internal/${entry.folder}/${dir}/`);
				}
			}
		}

		// Dual-engine: check the OTHER engine folder also exists
		if (entry.dualEngine) {
			const otherBase = entry.engine === "coldlight" ? meltuiBase : coldlightBase;
			const otherDir = join(otherBase, entry.folder);
			if (!existsSync(otherDir)) {
				warnings.push(`[${entry.kind}] Declared dual-engine but other engine folder missing`);
			}
		}
	}

	// ─── Detect orphan folders (on disk but not in registry) ─────────────
	const orphanFolders: string[] = [];

	for (const [base, engineName] of [[coldlightBase, "coldlight"], [meltuiBase, "meltui"]] as const) {
		if (!existsSync(base)) continue;
		const folders = readdirSync(base).filter((name) => {
			const fullPath = join(base, name);
			return statSync(fullPath).isDirectory() && !name.startsWith("_");
		});

		for (const folder of folders) {
			// Check if this folder is a registered kind's folder or alias
			const isRegistered = KIND_REGISTRY.some((entry) => {
				if (entry.engine !== engineName && !entry.dualEngine) return false;
				if (entry.folder === folder) return true;
				if (entry.aliases?.includes(folder)) return true;
				// Dual-engine: the other engine's folder is also valid
				if (entry.dualEngine && entry.kind === folder) return true;
				return false;
			});

			if (!isRegistered) {
				orphanFolders.push(`${engineName}/_internal/${folder}/`);
				warnings.push(`Orphan adapter folder: ${engineName}/_internal/${folder}/ (not in registry)`);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		stats: {
			kindsChecked: KIND_REGISTRY.length,
			filesChecked,
			orphanFolders,
		},
	};
}

/**
 * Validate and format results as a human-readable report.
 * Suitable for CI output.
 */
export function validateAndReport(designRoot: string): string {
	const result = validateRegistry(designRoot);
	const lines: string[] = [];

	lines.push("=== ColdLight Adapter Registry Validation ===");
	lines.push(`Kinds checked: ${result.stats.kindsChecked}`);
	lines.push(`Files checked: ${result.stats.filesChecked}`);
	lines.push("");

	if (result.errors.length > 0) {
		lines.push(`ERRORS (${result.errors.length}):`);
		for (const err of result.errors) {
			lines.push(`  ✗ ${err}`);
		}
		lines.push("");
	}

	if (result.warnings.length > 0) {
		lines.push(`WARNINGS (${result.warnings.length}):`);
		for (const warn of result.warnings) {
			lines.push(`  ⚠ ${warn}`);
		}
		lines.push("");
	}

	if (result.stats.orphanFolders.length > 0) {
		lines.push(`ORPHAN FOLDERS (${result.stats.orphanFolders.length}):`);
		for (const orphan of result.stats.orphanFolders) {
			lines.push(`  ? ${orphan}`);
		}
		lines.push("");
	}

	if (result.valid) {
		lines.push("RESULT: PASS — all registered kinds have required files");
	} else {
		lines.push("RESULT: FAIL — fix errors above before build can succeed");
	}

	return lines.join("\n");
}
