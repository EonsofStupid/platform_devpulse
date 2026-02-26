/**
 * @file Number Input Component Contract
 * @kind number-input
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Spinbutton Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * NumberInput component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 */
export const contract = {
	kind: "number-input",
	description:
		"Numeric spinbutton input with increment/decrement controls. Supports min, max, step, disabled, readonly, and required states.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",

	slots: {
		required: ["root", "input", "increment", "decrement"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "number-input",
				slot: "root",
				states: ["disabled"],
			},
		},
		input: {
			name: "input",
			element: "input",
			aria: {
				role: "spinbutton",
				required: [
					{ attr: "aria-valuenow", valueType: "aria-valuenow" },
				],
				optional: [
					{ attr: "aria-valuemin", valueType: "aria-valuemin" },
					{ attr: "aria-valuemax", valueType: "aria-valuemax" },
					{ attr: "aria-valuetext", valueType: "aria-valuetext" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-readonly", valueType: "aria-readonly" },
					{ attr: "aria-required", valueType: "aria-required" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "number-input",
				slot: "input",
				states: ["focused", "focus-visible", "disabled"],
			},
			keyboard: [
				{ key: "ArrowUp", action: "increment", description: "Increase value by step" },
				{ key: "ArrowDown", action: "decrement", description: "Decrease value by step" },
				{ key: "Home", action: "setMin", description: "Set value to minimum" },
				{ key: "End", action: "setMax", description: "Set value to maximum" },
			],
		},
		increment: {
			name: "increment",
			element: "button",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "number-input",
				slot: "increment",
				states: ["hover", "disabled"],
			},
		},
		decrement: {
			name: "decrement",
			element: "button",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "number-input",
				slot: "decrement",
				states: ["hover", "disabled"],
			},
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
			{ key: "ArrowUp", action: "increment", description: "Increase value by step" },
			{ key: "ArrowDown", action: "decrement", description: "Decrease value by step" },
			{ key: "Home", action: "setMin", description: "Set value to minimum" },
			{ key: "End", action: "setMax", description: "Set value to maximum" },
		],
	},

	states: {
		all: ["focused", "focus-visible", "hover", "disabled"],
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

	primitiveKind: "number-input",
} as const satisfies ComponentContract;
