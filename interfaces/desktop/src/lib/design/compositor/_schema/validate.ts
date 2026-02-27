/**
 * @file Compositor Node Validation
 * @layer compositor
 * @package @devpulse/coldlight
 *
 * Validates compositor nodes against the ColdLight manifest.
 * Cross-layer validation ensures all references are valid:
 *   - node.primitive → exists in manifest primitives
 *   - composedEffect.effectId → exists in manifest effects
 *   - No two effects in same conflictGroup on same node
 *   - node.slots keys → valid for referenced primitive
 */

import type { ColdLightManifest } from "../../scanner.types.js";
import type { CompositorNode } from "../../effects/_schema/types.js";
import type { NodeValidationResult, NodeValidationError } from "./types.js";

/**
 * Validate a compositor node against the manifest.
 * Checks all cross-layer references are valid.
 */
export function validateNode(
	node: CompositorNode,
	manifest: ColdLightManifest,
): NodeValidationResult {
	const errors: NodeValidationError[] = [];
	const warnings: string[] = [];

	validateNodeRecursive(node, manifest, errors, warnings);

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

function validateNodeRecursive(
	node: CompositorNode,
	manifest: ColdLightManifest,
	errors: NodeValidationError[],
	warnings: string[],
): void {
	// 1. Validate primitive exists in manifest
	const primitiveExists = manifest.categories.primitives.kinds.some(
		(p) => p.kind === node.primitive,
	);
	if (!primitiveExists) {
		errors.push({
			nodeId: node.nodeId,
			code: "PRIMITIVE_NOT_FOUND",
			message: `Primitive "${node.primitive}" not found in manifest`,
		});
	}

	// 2. Validate each composed effect
	const effectDefs = manifest.categories.effects.definitions;
	const activeConflictGroups = new Map<string, string>();

	node.composedEffects.forEach((effect) => {
		// Check effect exists
		const effectDef = effectDefs.find((e) => e.id === effect.effectId);
		if (!effectDef) {
			errors.push({
				nodeId: node.nodeId,
				code: "EFFECT_NOT_FOUND",
				message: `Effect "${effect.effectId}" not found in manifest`,
			});
			return;
		}

		// Check trigger is supported by this effect
		if (!effectDef.supportedTriggers.includes(effect.trigger)) {
			errors.push({
				nodeId: node.nodeId,
				code: "TRIGGER_NOT_SUPPORTED",
				message: `Effect "${effect.effectId}" does not support trigger "${effect.trigger}" (supports: ${effectDef.supportedTriggers.join(", ")})`,
			});
		}

		// Check conflict group
		if (effectDef.conflictGroup) {
			const existing = activeConflictGroups.get(effectDef.conflictGroup);
			if (existing) {
				errors.push({
					nodeId: node.nodeId,
					code: "CONFLICT_GROUP_VIOLATION",
					message: `Effects "${existing}" and "${effect.effectId}" conflict (group: "${effectDef.conflictGroup}")`,
				});
			} else {
				activeConflictGroups.set(effectDef.conflictGroup, effect.effectId);
			}
		}
	});

	// 3. Validate slot keys against primitive manifest
	if (node.slots && primitiveExists) {
		const primitiveDef = manifest.categories.primitives.kinds.find(
			(p) => p.kind === node.primitive,
		);
		if (primitiveDef) {
			const validSlots = new Set([
				...primitiveDef.slots.required,
				...primitiveDef.slots.optional,
			]);

			Object.keys(node.slots).forEach((slotName) => {
				if (!validSlots.has(slotName)) {
					errors.push({
						nodeId: node.nodeId,
						code: "INVALID_SLOT",
						message: `Slot "${slotName}" is not valid for primitive "${node.primitive}" (valid: ${[...validSlots].join(", ")})`,
					});
				}
			});
		}
	}

	// 4. Recurse into slot children
	if (node.slots) {
		Object.values(node.slots).forEach((children) => {
			children.forEach((child) => {
				validateNodeRecursive(child, manifest, errors, warnings);
			});
		});
	}
}

/**
 * Validate a full compositor tree (convenience wrapper).
 * Returns combined results for all nodes.
 */
export function validateTree(
	root: CompositorNode,
	manifest: ColdLightManifest,
): NodeValidationResult {
	return validateNode(root, manifest);
}
