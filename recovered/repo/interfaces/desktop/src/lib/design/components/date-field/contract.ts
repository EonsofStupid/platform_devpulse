/**
 * @file DateField Component Contract
 * @kind date-field
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: root, segment.
 * ColdLight-owned ARIA — renders spinbutton pattern directly.
 *
 * Pattern: WAI-ARIA APG Spinbutton Pattern
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * DateField component contract — compile-time enforced.
 *
 * Compound: root (role="group") → segment[] (role="spinbutton")
 * Each segment represents month, day, or year with independent spinbutton controls.
 */
export const contract = {
	kind: "date-field",
	description:
		"Segmented date input with separate spinbutton segments for month, day, and year. ColdLight-owned ARIA with roving focus across segments and increment/decrement via arrow keys.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",

	slots: {
		required: ["root", "segment"],
		optional: ["label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "date-field",
				slot: "root",
				states: ["disabled", "readonly", "invalid"],
			},
		},
		segment: {
			name: "segment",
			element: "span",
			aria: {
				role: "spinbutton",
				required: [
					{ attr: "aria-valuemin", valueType: "aria-valuemin" },
					{ attr: "aria-valuemax", valueType: "aria-valuemax" },
					{ attr: "aria-valuenow", valueType: "aria-valuenow" },
				],
				optional: [
					{ attr: "aria-valuetext", valueType: "aria-valuetext" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-readonly", valueType: "aria-readonly" },
				],
			},
			data: {
				kind: "date-field",
				slot: "segment",
				states: ["focused", "disabled", "readonly"],
			},
			keyboard: [
				{ key: "ArrowUp", action: "increment", description: "Increment segment value" },
				{ key: "ArrowDown", action: "decrement", description: "Decrement segment value" },
				{ key: "ArrowLeft", action: "prev-segment", description: "Move to previous segment" },
				{ key: "ArrowRight", action: "next-segment", description: "Move to next segment" },
			],
		},
		label: {
			name: "label",
			element: "label",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "date-field",
				slot: "label",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	focus: {
		strategy: "roving",
		initialFocus: "segment",
	},

	keyboard: {
		global: [
			{ key: "ArrowUp", action: "increment", description: "Increment focused segment" },
			{ key: "ArrowDown", action: "decrement", description: "Decrement focused segment" },
			{ key: "ArrowLeft", action: "prev-segment", description: "Focus previous segment" },
			{ key: "ArrowRight", action: "next-segment", description: "Focus next segment" },
		],
	},

	states: {
		primary: "focused",
		all: ["focused", "disabled", "readonly", "invalid"],
		ariaMapping: {
			disabled: "aria-disabled",
			readonly: "aria-readonly",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "date-field",
} as const satisfies ComponentContract;
