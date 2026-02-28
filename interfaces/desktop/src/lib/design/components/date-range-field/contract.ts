/**
 * @file DateRangeField Component Contract
 * @kind date-range-field
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Compound component: root, start-field, end-field, segment, separator.
 * ColdLight-owned ARIA — renders spinbutton pattern for start/end.
 *
 * Pattern: WAI-ARIA APG Spinbutton Pattern (dual)
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * DateRangeField component contract — compile-time enforced.
 *
 * Compound: root → start-field (segments) + separator + end-field (segments)
 */
export const contract = {
	kind: "date-range-field",
	description:
		"Two segmented date fields for start/end range input. ColdLight-owned ARIA with spinbutton segments, roving focus across all segments, and range validation.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",

	slots: {
		required: ["root", "start-field", "end-field", "segment"],
		optional: ["separator", "label"],
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
				kind: "date-range-field",
				slot: "root",
				states: ["disabled", "readonly", "invalid"],
			},
		},
		"start-field": {
			name: "start-field",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "date-range-field",
				slot: "start-field",
				states: ["focused", "disabled"],
			},
		},
		"end-field": {
			name: "end-field",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "date-range-field",
				slot: "end-field",
				states: ["focused", "disabled"],
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
				kind: "date-range-field",
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
		separator: {
			name: "separator",
			element: "span",
			aria: {
				role: "presentation",
				required: [],
				optional: [],
			},
			data: {
				kind: "date-range-field",
				slot: "separator",
				states: [],
			},
		},
		label: {
			name: "label",
			element: "label",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "date-range-field",
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

	primitiveKind: "date-range-field",
} as const satisfies ComponentContract;
