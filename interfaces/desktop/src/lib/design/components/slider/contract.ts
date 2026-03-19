/**
 * @file Slider Component Contract
 * @kind slider
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * MeltUI transport adapter provides ARIA attributes for root/thumb slots.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Reference: W3C WAI-ARIA APG Slider Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Slider component contract — compile-time enforced.
 *
 * Compound component: root → (track → range) + thumb
 */
export const contract = {
	kind: "slider",
	description:
		"Compound slider component with track, range indicator, and draggable thumb. MeltUI adapter provides ARIA value attributes and keyboard navigation.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",

	slots: {
		required: ["root", "track", "thumb"],
		optional: ["range"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "none",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "slider",
				slot: "root",
				states: ["disabled"],
			},
		},
		track: {
			name: "track",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "slider",
				slot: "track",
				states: [],
			},
		},
		range: {
			name: "range",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "slider",
				slot: "range",
				states: [],
			},
		},
		thumb: {
			name: "thumb",
			element: "span",
			aria: {
				role: "slider",
				required: [
					{ attr: "aria-valuenow", valueType: "aria-valuenow" },
					{ attr: "aria-valuemin", valueType: "aria-valuemin" },
					{ attr: "aria-valuemax", valueType: "aria-valuemax" },
				],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-valuetext", valueType: "aria-valuetext" },
					{ attr: "aria-orientation", valueType: "aria-orientation" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "slider",
				slot: "thumb",
				states: ["focused", "disabled"],
			},
			keyboard: [
				{ key: "ArrowRight", action: "increment", description: "Increment value by one step" },
				{ key: "ArrowUp", action: "increment", description: "Increment value by one step" },
				{ key: "ArrowLeft", action: "decrement", description: "Decrement value by one step" },
				{ key: "ArrowDown", action: "decrement", description: "Decrement value by one step" },
				{ key: "Home", action: "set-min", description: "Set to minimum value" },
				{ key: "End", action: "set-max", description: "Set to maximum value" },
				{ key: "PageUp", action: "increment-large", description: "Increment by large step" },
				{ key: "PageDown", action: "decrement-large", description: "Decrement by large step" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "increment", description: "Increment value by one step" },
			{ key: "ArrowUp", action: "increment", description: "Increment value by one step" },
			{ key: "ArrowLeft", action: "decrement", description: "Decrement value by one step" },
			{ key: "ArrowDown", action: "decrement", description: "Decrement value by one step" },
			{ key: "Home", action: "set-min", description: "Set to minimum value" },
			{ key: "End", action: "set-max", description: "Set to maximum value" },
			{ key: "PageUp", action: "increment-large", description: "Increment by large step" },
			{ key: "PageDown", action: "decrement-large", description: "Decrement by large step" },
		],
	},

	states: {
		all: ["focused", "disabled"],
		ariaMapping: {
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "slider",
} as const satisfies ComponentContract;
