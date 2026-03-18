/**
 * @file Compositor Compiler
 * @layer compositor/compiler
 * @package @devpulse/coldlight
 *
 * Compiles a CompositorNode into a CompilerOutput.
 * Runs three passes:
 *   1. CSS Pass — merge baseStyles + effect classes, resolve conflicts
 *   2. Logic Pass — wire customJS modules to Svelte actions
 *   3. Conflict detection — warn about conflicting effects
 *
 * Usage:
 *   const output = compile(node, manifest);
 *   // output.staticClasses → "glass-void depth-raised rounded-lg"
 *   // output.conditionalClasses.hover → "glow-teal -translate-y-1"
 *   // output.actions → [{ action: "useIntersectionReveal", ... }]
 */

import type { CompilerOutput, CompositorNode } from "../../effects/_schema/types.js";
import type { ColdLightManifest } from "../../scanner.types.js";
import { detectConflicts } from "./conflict-resolver.js";
import { cssPass } from "./css-pass.js";
import { logicPass } from "./logic-pass.js";

/**
 * Compile a single compositor node into renderer-ready output.
 *
 * @param node - The compositor node to compile
 * @param manifest - The ColdLight manifest for cross-reference validation
 * @returns CompilerOutput with static classes, conditional classes, actions, and warnings
 */
export function compile(node: CompositorNode, manifest: ColdLightManifest): CompilerOutput {
	const warnings: string[] = [];

	// Pass 1: CSS — collect and deduplicate all classes
	const css = cssPass(node, manifest);
	warnings.push(...css.warnings);

	// Pass 2: Logic — wire customJS to Svelte actions
	const logic = logicPass(node, manifest);
	warnings.push(...logic.warnings);

	// Pass 3: Conflict detection — warn about conflicting effects
	const conflicts = detectConflicts(node.composedEffects, manifest);
	warnings.push(...conflicts);

	return {
		staticClasses: css.staticClasses,
		conditionalClasses: css.conditionalClasses,
		actions: logic.actions,
		warnings,
	};
}

/**
 * Compile an entire compositor tree recursively.
 * Returns a map of nodeId → CompilerOutput.
 */
export function compileTree(
	root: CompositorNode,
	manifest: ColdLightManifest,
): ReadonlyMap<string, CompilerOutput> {
	const results = new Map<string, CompilerOutput>();
	compileNodeRecursive(root, manifest, results);
	return results;
}

function compileNodeRecursive(
	node: CompositorNode,
	manifest: ColdLightManifest,
	results: Map<string, CompilerOutput>,
): void {
	results.set(node.nodeId, compile(node, manifest));

	if (node.slots) {
		Object.values(node.slots).forEach((children) => {
			children.forEach((child) => {
				compileNodeRecursive(child, manifest, results);
			});
		});
	}
}

export { deduplicateClasses, detectConflicts, findEffectConflict } from "./conflict-resolver.js";
// Re-export pass functions for testing
export { cssPass } from "./css-pass.js";
export { logicPass } from "./logic-pass.js";
