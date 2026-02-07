/**
 * @file ARIA Link Action
 * @description Svelte action for auto-wiring ARIA relationship attributes.
 *
 * Usage:
 *   <div use:ariaLink={{ type: "labelledby", target: "[data-slot='title']" }}>
 *
 * Or with slot-based targeting:
 *   <div use:ariaLink={{ type: "labelledby", targetSlot: "title" }}>
 *
 * This action:
 * 1. Finds the target element (by selector or slot name)
 * 2. Ensures target has an ID (generates one if needed)
 * 3. Sets the appropriate aria-* attribute to reference that ID
 *
 * Used for relationships like:
 * - aria-labelledby → references a title element
 * - aria-describedby → references a description element
 * - aria-controls → references a controlled element
 * - aria-owns → references owned elements
 */

import type { Action } from "svelte/action";

/**
 * Relationship types supported by this action.
 */
export type AriaLinkType =
	| "labelledby"
	| "describedby"
	| "controls"
	| "owns"
	| "activedescendant"
	| "flowto"
	| "details"
	| "errormessage";

/**
 * Options for the ariaLink action.
 */
export interface AriaLinkOptions {
	/** The type of ARIA relationship */
	type: AriaLinkType;
	/** CSS selector to find target element */
	target?: string;
	/** Slot name to find target element (uses data-slot attribute) */
	targetSlot?: string;
	/** Search scope: "parent" searches up, "sibling" searches siblings, "document" searches globally */
	scope?: "parent" | "sibling" | "document";
}

/**
 * Generate a unique ID for an element.
 */
function generateId(type: AriaLinkType): string {
	const random = Math.random().toString(36).slice(2, 10);
	return `aria-${type}-${random}`;
}

/**
 * Find the target element based on options.
 */
function findTarget(node: HTMLElement, options: AriaLinkOptions): HTMLElement | null {
	const { target, targetSlot, scope = "parent" } = options;

	// Build selector
	let selector: string;
	if (target) {
		selector = target;
	} else if (targetSlot) {
		selector = `[data-slot="${targetSlot}"]`;
	} else {
		return null;
	}

	// Search based on scope
	switch (scope) {
		case "parent": {
			// Search within closest compound component (data-kind ancestor)
			const compound = node.closest("[data-kind]");
			if (compound) {
				return compound.querySelector(selector);
			}
			// Fallback to document
			return document.querySelector(selector);
		}
		case "sibling": {
			// Search siblings only
			const parent = node.parentElement;
			if (parent) {
				return parent.querySelector(selector);
			}
			return null;
		}
		case "document": {
			return document.querySelector(selector);
		}
		default:
			return null;
	}
}

/**
 * Apply the ARIA link relationship.
 */
function applyLink(node: HTMLElement, targetEl: HTMLElement, type: AriaLinkType): void {
	// Ensure target has an ID
	if (!targetEl.id) {
		targetEl.id = generateId(type);
	}

	// Set the aria-* attribute
	node.setAttribute(`aria-${type}`, targetEl.id);
}

/**
 * Svelte action for ARIA relationship wiring.
 *
 * Automatically finds target elements and wires up aria-labelledby,
 * aria-describedby, aria-controls, etc.
 */
export const ariaLink: Action<HTMLElement, AriaLinkOptions> = (node, options) => {
	const { type } = options;

	// Find and link on mount (with microtask delay to ensure DOM is ready)
	queueMicrotask(() => {
		const targetEl = findTarget(node, options);
		if (targetEl) {
			applyLink(node, targetEl, type);
		}
	});

	return {
		update(newOptions: AriaLinkOptions) {
			// Remove old link
			node.removeAttribute(`aria-${type}`);

			// Apply new link
			queueMicrotask(() => {
				const targetEl = findTarget(node, newOptions);
				if (targetEl) {
					applyLink(node, targetEl, newOptions.type);
				}
			});
		},
		destroy() {
			node.removeAttribute(`aria-${type}`);
		},
	};
};

export default ariaLink;
