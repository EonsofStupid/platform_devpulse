/**
 * @file preflight/checks/check.naming.ts
 * @description Verify naming conventions — standardized for AI and viber clarity.
 *
 * RULES:
 * - Rune state modules: *.state.svelte.ts (NOT .runes.svelte.ts)
 * - Services: *.service.ts (NOT .svc.ts)
 * - Types: *.types.ts
 * - No .svelte files in domains/ (pure logic only)
 */

import fs from "fs";
import path from "path";
import { registry } from "../engine/registry.js";
import type { Check, CheckContext, CheckResult } from "../types.js";

interface NamingRule {
	location: RegExp;
	patterns: {
		expected: RegExp;
		actual: RegExp;
		description: string;
		suggestion: string;
	}[];
}

const NAMING_RULES: NamingRule[] = [
	{
		// Rune state files — must use .state.svelte.ts, not .runes.svelte.ts
		location: /\/domains\/.*\/runes\//,
		patterns: [
			{
				expected: /\.state\.svelte\.ts$/,
				actual: /\.svelte\.ts$/,
				description: "State module",
				suggestion:
					'Rename to *.state.svelte.ts — "state" is universal, "runes" leaks framework internals',
			},
		],
	},
	{
		// Service files — must use .service.ts
		location: /\/domains\/.*\/services\//,
		patterns: [
			{
				expected: /\.service\.ts$/,
				actual: /\.ts$/,
				description: "Service module",
				suggestion: "Rename to *.service.ts for consistent domain service naming",
			},
		],
	},
	{
		// Type files — must use .types.ts
		location: /\/domains\/.*\/types\//,
		patterns: [
			{
				expected: /\.types\.ts$/,
				actual: /\.ts$/,
				description: "Type definition",
				suggestion: "Rename to *.types.ts for consistent type file naming",
			},
		],
	},
];

/** Files to skip in naming checks */
const SKIP_FILES = [
	"index.ts",
	"index.js",
	"types.ts",
	"types.d.ts",
	"constants.ts",
	"utils.ts",
];

function shouldSkip(filePath: string): boolean {
	const basename = path.basename(filePath);

	if (!filePath.endsWith(".ts") && !filePath.endsWith(".svelte")) {
		return true;
	}

	if (SKIP_FILES.includes(basename)) {
		return true;
	}

	if (basename.includes(".test.") || basename.includes(".spec.")) {
		return true;
	}

	if (basename.endsWith(".d.ts")) {
		return true;
	}

	return false;
}

function checkFileName(filePath: string): CheckResult | null {
	if (shouldSkip(filePath)) {
		return null;
	}

	const basename = path.basename(filePath);

	// HARD RULE: No .svelte files in domains/ — domains are pure logic
	if (
		filePath.includes("/domains/") &&
		basename.endsWith(".svelte") &&
		!basename.endsWith(".svelte.ts")
	) {
		return {
			checkId: "naming-conventions",
			status: "fail",
			severity: "error",
			message: `"${basename}" is a .svelte file inside domains/ — domains must be pure logic (runes, services, types)`,
			file: filePath,
			suggestion:
				"Move rendering to design/ (components, blocks) or routes/ (thin pages). Domains contain NO .svelte rendering files.",
			autoFixable: false,
		};
	}

	for (const rule of NAMING_RULES) {
		if (!rule.location.test(filePath)) {
			continue;
		}

		for (const pattern of rule.patterns) {
			if (pattern.actual.test(basename)) {
				if (!pattern.expected.test(basename)) {
					return {
						checkId: "naming-conventions",
						status: "fail",
						severity: "warning",
						message: `${pattern.description} "${basename}" does not follow naming convention`,
						file: filePath,
						suggestion: pattern.suggestion,
						autoFixable: true,
					};
				}
			}
		}
	}

	return null;
}

const namingCheck: Check = {
	id: "naming-conventions",
	name: "Naming Conventions",
	description:
		"Verify file naming: *.state.svelte.ts for runes, *.service.ts for services, *.types.ts for types. No .svelte in domains/.",

	async run(ctx: CheckContext): Promise<CheckResult[]> {
		const results: CheckResult[] = [];

		if (ctx.files.length === 0) {
			results.push({
				checkId: "naming-conventions",
				status: "pass",
				severity: "info",
				message: "No files to check",
			});
			return results;
		}

		let checkedCount = 0;
		let violations = 0;

		for (const file of ctx.files) {
			const absolutePath = path.join(ctx.platformRoot, file);

			if (!fs.existsSync(absolutePath)) {
				continue;
			}

			checkedCount++;
			const result = checkFileName(file);

			if (result) {
				results.push(result);
				violations++;
			}
		}

		if (violations === 0) {
			results.push({
				checkId: "naming-conventions",
				status: "pass",
				severity: "info",
				message: `${checkedCount} files checked — all follow naming conventions`,
			});
		}

		return results;
	},
};

registry.registerCheck(namingCheck);
export { namingCheck };
