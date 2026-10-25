/**
 * @file scripts/dev/design/sd/validators/kind-coverage.ts
 * @package @devpulse/coldlight
 *
 * Build-time validator: ensures every KindDefinition is backed by
 * real files and registrations on disk.
 *
 * Validates:
 *   1. defaultPreset exists in presets registry
 *   2. defaultRecipe exists in recipes registry
 *   3. contract.ts exists in components/{kind}/
 *   4. requiredAxes are satisfied by the default preset values
 *
 * Run AFTER presets + recipes + kind-definitions are loaded via jiti.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface KindDef {
	kind: string;
	label: string;
	engine: string;
	defaultPreset: string;
	defaultRecipe: string;
	blockCategory: string;
	requiredAxes: readonly string[];
	compound: boolean;
	container: boolean;
	containerSlots?: readonly string[];
}

interface PresetDef {
	id: string;
	kind: string;
	values: Record<string, string>;
}

interface RecipeDef {
	id: string;
	kind: string;
}

export interface KindCoverageError {
	kind: string;
	field: string;
	message: string;
}

export interface KindCoverageResult {
	valid: boolean;
	errors: KindCoverageError[];
	stats: {
		totalKinds: number;
		withPreset: number;
		withRecipe: number;
		withContract: number;
		axesSatisfied: number;
	};
}

/**
 * Validate that every KindDefinition is fully backed.
 */
export function validateKindCoverage(
	kinds: KindDef[],
	presets: PresetDef[],
	recipes: RecipeDef[],
	componentsRoot: string,
): KindCoverageResult {
	const errors: KindCoverageError[] = [];
	const presetMap = new Map(presets.map((p) => [p.id, p]));
	const recipeMap = new Map(recipes.map((r) => [r.id, r]));

	let withPreset = 0;
	let withRecipe = 0;
	let withContract = 0;
	let axesSatisfied = 0;

	for (const def of kinds) {
		// 1. Check defaultPreset exists
		const preset = presetMap.get(def.defaultPreset);
		if (!preset) {
			errors.push({
				kind: def.kind,
				field: "defaultPreset",
				message: `"${def.kind}": defaultPreset "${def.defaultPreset}" not found in presets registry`,
			});
		} else {
			withPreset++;

			// 4. Check requiredAxes are satisfied by preset values
			const missing: string[] = [];
			for (const axis of def.requiredAxes) {
				if (!preset.values[axis]) {
					missing.push(axis);
				}
			}
			if (missing.length > 0) {
				errors.push({
					kind: def.kind,
					field: "requiredAxes",
					message: `"${def.kind}": preset "${def.defaultPreset}" missing required axes: ${missing.join(", ")}`,
				});
			} else {
				axesSatisfied++;
			}
		}

		// 2. Check defaultRecipe exists
		if (!recipeMap.has(def.defaultRecipe)) {
			errors.push({
				kind: def.kind,
				field: "defaultRecipe",
				message: `"${def.kind}": defaultRecipe "${def.defaultRecipe}" not found in recipes registry`,
			});
		} else {
			withRecipe++;
		}

		// 3. Check contract.ts exists in components/{kind}/
		const contractPath = resolve(componentsRoot, def.kind, "contract.ts");
		if (existsSync(contractPath)) {
			withContract++;
		} else {
			errors.push({
				kind: def.kind,
				field: "contract",
				message: `"${def.kind}": contract.ts not found at ${contractPath}`,
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		stats: {
			totalKinds: kinds.length,
			withPreset,
			withRecipe,
			withContract,
			axesSatisfied,
		},
	};
}
