#!/usr/bin/env node
/**
 * @file kind-coverage.mjs
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
 *
 * Usage:
 *   import { validateKindCoverage } from './kind-coverage.mjs';
 *   const result = validateKindCoverage({ kinds, presets, recipes, componentsRoot });
 *   if (!result.valid) process.exit(1);
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @typedef {object} KindDef
 * @property {string} kind
 * @property {string} label
 * @property {string} engine
 * @property {string} defaultPreset
 * @property {string} defaultRecipe
 * @property {string} blockCategory
 * @property {readonly string[]} requiredAxes
 * @property {boolean} compound
 * @property {boolean} container
 * @property {readonly string[]} [containerSlots]
 */

/**
 * @typedef {object} PresetDef
 * @property {string} id
 * @property {string} kind
 * @property {Record<string, string>} values
 */

/**
 * @typedef {object} RecipeDef
 * @property {string} id
 * @property {string} kind
 */

/**
 * @typedef {object} KindCoverageError
 * @property {string} kind
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {object} KindCoverageStats
 * @property {number} totalKinds
 * @property {number} withPreset
 * @property {number} withRecipe
 * @property {number} withContract
 * @property {number} axesSatisfied
 */

/**
 * @typedef {object} KindCoverageResult
 * @property {boolean} valid
 * @property {KindCoverageError[]} errors
 * @property {KindCoverageStats} stats
 */

/**
 * @typedef {object} KindCoverageContext
 * @property {KindDef[]} kinds
 * @property {PresetDef[]} presets
 * @property {RecipeDef[]} recipes
 * @property {string} componentsRoot
 */

/**
 * Validate that every KindDefinition is fully backed by real
 * presets, recipes, and component contracts on disk.
 *
 * @param {KindCoverageContext} ctx
 * @returns {KindCoverageResult}
 */
export function validateKindCoverage(ctx) {
	const { kinds, presets, recipes, componentsRoot } = ctx;

	/** @type {KindCoverageError[]} */
	const errors = [];
	const presetMap = new Map(presets.map((p) => [p.id, p]));
	const recipeSet = new Set(recipes.map((r) => r.id));

	let withPreset = 0;
	let withRecipe = 0;
	let withContract = 0;
	let axesSatisfied = 0;

	for (const def of kinds) {
		// 1. defaultPreset exists in registry
		const preset = presetMap.get(def.defaultPreset);
		if (!preset) {
			errors.push({
				kind: def.kind,
				field: 'defaultPreset',
				message: `defaultPreset "${def.defaultPreset}" not found in presets registry`,
			});
		} else {
			withPreset++;

			// 4. requiredAxes satisfied by preset values
			const missing = def.requiredAxes.filter((axis) => !preset.values[axis]);
			if (missing.length > 0) {
				errors.push({
					kind: def.kind,
					field: 'requiredAxes',
					message: `preset "${def.defaultPreset}" missing axes: ${missing.join(', ')}`,
				});
			} else {
				axesSatisfied++;
			}
		}

		// 2. defaultRecipe exists in registry
		if (!recipeSet.has(def.defaultRecipe)) {
			errors.push({
				kind: def.kind,
				field: 'defaultRecipe',
				message: `defaultRecipe "${def.defaultRecipe}" not found in recipes registry`,
			});
		} else {
			withRecipe++;
		}

		// 3. contract.ts exists on disk
		const contractPath = resolve(componentsRoot, def.kind, 'contract.ts');
		if (existsSync(contractPath)) {
			withContract++;
		} else {
			errors.push({
				kind: def.kind,
				field: 'contract',
				message: `contract.ts not found at ${contractPath}`,
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

/**
 * Print validation results to stdout in a structured format.
 * Returns the exit code (0 = pass, 1 = fail).
 *
 * @param {KindCoverageResult} result
 * @returns {number}
 */
export function reportKindCoverage(result) {
	const { stats, errors } = result;

	console.log('[kind-coverage] Validating kind definitions...');
	console.log(`  Kinds:     ${stats.totalKinds}`);
	console.log(`  Presets:   ${stats.withPreset}/${stats.totalKinds}`);
	console.log(`  Recipes:   ${stats.withRecipe}/${stats.totalKinds}`);
	console.log(`  Contracts: ${stats.withContract}/${stats.totalKinds}`);
	console.log(`  Axes OK:   ${stats.axesSatisfied}/${stats.totalKinds}`);

	if (errors.length === 0) {
		console.log('[kind-coverage] PASS — all kinds fully backed.');
		return 0;
	}

	console.error(`[kind-coverage] FAIL — ${errors.length} error(s):`);
	for (const err of errors) {
		console.error(`  [${err.kind}] ${err.field}: ${err.message}`);
	}

	return 1;
}
