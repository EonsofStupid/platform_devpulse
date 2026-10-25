/**
 * @file ColorArea Component Contract
 * @kind color-area
 * @layer components
 *
 * 2D color picker surface with pointer drag + keyboard arrow control.
 * Compound: Root, Gradient, Thumb.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "color-area",
	description:
		"2D color picker surface. User drags a thumb to select two color channels simultaneously. Pointer tracking + keyboard arrow keys. Form integration via hidden inputs.",

	slots: {
		required: ["root"],
		optional: ["gradient", "thumb"],
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
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: { kind: "color-area", slot: "root", states: [] },
		},
		gradient: {
			name: "gradient",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "color-area", slot: "gradient", states: [] },
		},
		thumb: {
			name: "thumb",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "color-area", slot: "thumb", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "direct",
	},

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "incrementX", description: "Increase x channel" },
			{ key: "ArrowLeft", action: "decrementX", description: "Decrease x channel" },
			{ key: "ArrowUp", action: "incrementY", description: "Increase y channel" },
			{ key: "ArrowDown", action: "decrementY", description: "Decrease y channel" },
		],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "color-area",
} as const satisfies ComponentContract;
