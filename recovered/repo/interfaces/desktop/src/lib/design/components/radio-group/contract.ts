/**
 * @file RadioGroup Component Contract
 * @kind radio-group
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * MeltUI transport adapter provides ARIA attributes for root/item slots.
 * ColdLight adds data-kind, data-slot, data-state.
 *
 * Reference: W3C WAI-ARIA APG Radio Group Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * RadioGroup component contract — compile-time enforced.
 *
 * Compound component: root → item[] + label
 */
export const contract = {
	kind: "radio-group",
	description:
		"Compound radio group component with roving tabindex and keyboard navigation. MeltUI adapter provides ARIA checked state and focus management.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",

	slots: {
		required: ["root", "item"],
		optional: ["label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "radiogroup",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-required", valueType: "aria-required" },
				],
			},
			data: {
				kind: "radio-group",
				slot: "root",
				states: [],
			},
		},
		item: {
			name: "item",
			element: "button",
			aria: {
				role: "radio",
				required: [{ attr: "aria-checked", valueType: "aria-checked" }],
				optional: [
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "radio-group",
				slot: "item",
				states: ["checked", "focused", "disabled"],
			},
			keyboard: [
				{
					key: "ArrowDown",
					action: "next-and-select",
					description: "Move focus to next radio and select",
				},
				{
					key: "ArrowRight",
					action: "next-and-select",
					description: "Move focus to next radio and select",
				},
				{
					key: "ArrowUp",
					action: "prev-and-select",
					description: "Move focus to previous radio and select",
				},
				{
					key: "ArrowLeft",
					action: "prev-and-select",
					description: "Move focus to previous radio and select",
				},
				{ key: "Space", action: "select", description: "Select focused radio" },
			],
		},
		label: {
			name: "label",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "radio-group",
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
	},

	keyboard: {
		global: [
			{
				key: "ArrowDown",
				action: "next-and-select",
				description: "Move focus to next radio and select",
			},
			{
				key: "ArrowRight",
				action: "next-and-select",
				description: "Move focus to next radio and select",
			},
			{
				key: "ArrowUp",
				action: "prev-and-select",
				description: "Move focus to previous radio and select",
			},
			{
				key: "ArrowLeft",
				action: "prev-and-select",
				description: "Move focus to previous radio and select",
			},
			{ key: "Space", action: "select", description: "Select focused radio" },
		],
	},

	states: {
		primary: "checked",
		all: ["checked", "focused", "disabled"],
		ariaMapping: {
			checked: "aria-checked",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "radio-group",
} as const satisfies ComponentContract;
