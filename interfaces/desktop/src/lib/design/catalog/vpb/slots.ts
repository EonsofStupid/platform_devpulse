/**
 * @file VPB Slot Constraints
 * @description Defines which child kinds are allowed in which slots
 */

import type { BlockKind } from "./kinds";

// =============================================================================
// SLOT CONSTRAINTS
// =============================================================================

/**
 * Slot constraint definition.
 * Maps parent kind + slot name to allowed child kinds.
 */
type SlotConstraints = {
	[K in BlockKind]?: {
		[slot: string]: readonly BlockKind[] | "any";
	};
};

/**
 * Slot constraints registry.
 * "any" means any block kind is allowed.
 * TODO: Flesh out specific constraints as VPB matures.
 */
const slotConstraints: SlotConstraints = {
	panel: {
		header: "any",
		body: "any",
		footer: "any",
	},
	appShell: {
		nav: ["sideNav", "panel"] as const,
		aside: ["panel", "chatDock"] as const,
		main: "any",
		footer: "any",
	},
	chatDock: {
		messages: "any",
		input: ["panel"] as const,
	},
};

/**
 * Check if a child kind is allowed in a parent's slot.
 */
export function isChildAllowed(
	parentKind: BlockKind,
	slotName: string,
	childKind: BlockKind,
): boolean {
	const parentConstraints = slotConstraints[parentKind];
	if (!parentConstraints) {
		// No constraints defined = allow any
		return true;
	}

	const slotConstraint = parentConstraints[slotName];
	if (!slotConstraint) {
		// Slot not defined in constraints = allow any
		return true;
	}

	if (slotConstraint === "any") {
		return true;
	}

	return slotConstraint.includes(childKind);
}

/**
 * Get allowed child kinds for a slot.
 */
export function getAllowedChildren(
	parentKind: BlockKind,
	slotName: string,
): readonly BlockKind[] | "any" {
	const parentConstraints = slotConstraints[parentKind];
	if (!parentConstraints) {
		return "any";
	}

	return parentConstraints[slotName] ?? "any";
}
