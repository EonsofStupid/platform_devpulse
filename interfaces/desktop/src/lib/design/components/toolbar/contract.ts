/**
 * @file Toolbar Component Contract
 * @kind toolbar
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Toolbar Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Toolbar component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 */
export const contract = {
	kind: "toolbar",
	description:
		"Container for grouping related action controls. Supports horizontal/vertical orientation with roving tabindex keyboard navigation.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",

	slots: {
		required: ["root"],
		optional: ["item"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "toolbar",
				required: [],
				optional: [
					{ attr: "aria-orientation", valueType: "aria-orientation" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "toolbar",
				slot: "root",
				states: ["disabled"],
			},
			keyboard: [
				{
					key: "ArrowRight",
					action: "focus-next",
					description: "Move focus to next item (horizontal)",
				},
				{
					key: "ArrowLeft",
					action: "focus-prev",
					description: "Move focus to previous item (horizontal)",
				},
				{
					key: "ArrowDown",
					action: "focus-next",
					description: "Move focus to next item (vertical)",
				},
				{
					key: "ArrowUp",
					action: "focus-prev",
					description: "Move focus to previous item (vertical)",
				},
				{ key: "Home", action: "focus-first", description: "Move focus to first item" },
				{ key: "End", action: "focus-last", description: "Move focus to last item" },
			],
		},
		item: {
			name: "item",
			element: "button",
			aria: {
				required: [],
				optional: [{ attr: "aria-disabled", valueType: "aria-disabled" }],
			},
			data: {
				kind: "toolbar",
				slot: "item",
				states: ["disabled"],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "roving",
	},

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "focus-next", description: "Move focus to next item" },
			{ key: "ArrowLeft", action: "focus-prev", description: "Move focus to previous item" },
			{ key: "Home", action: "focus-first", description: "Move focus to first item" },
			{ key: "End", action: "focus-last", description: "Move focus to last item" },
		],
	},

	states: {
		all: ["disabled"],
		ariaMapping: {
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "toolbar",
} as const satisfies ComponentContract;
