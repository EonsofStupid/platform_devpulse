import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "color-slider",
	description:
		"1D color channel slider. Single thumb on a gradient track. Pointer drag + keyboard arrows. Form integration.",

	slots: {
		required: ["root", "track", "thumb"],
		optional: ["label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: { kind: "color-slider", slot: "root", states: [] },
		},
		track: {
			name: "track",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "color-slider", slot: "track", states: [] },
		},
		thumb: {
			name: "thumb",
			element: "div",
			aria: {
				role: "slider",
				required: [
					{ attr: "aria-valuenow", valueType: "aria-valuenow" },
					{ attr: "aria-valuemin", valueType: "aria-valuemin" },
					{ attr: "aria-valuemax", valueType: "aria-valuemax" },
				],
				optional: [
					{ attr: "aria-valuetext", valueType: "aria-valuetext" },
					{ attr: "aria-orientation", valueType: "aria-orientation" },
				],
			},
			data: { kind: "color-slider", slot: "thumb", states: [] },
		},
		label: {
			name: "label",
			element: "label",
			aria: { required: [], optional: [] },
			data: { kind: "color-slider", slot: "label", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	focus: {
		strategy: "direct",
	},

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "increment", description: "Increase channel value" },
			{ key: "ArrowLeft", action: "decrement", description: "Decrease channel value" },
			{ key: "ArrowUp", action: "increment", description: "Increase channel value (vertical)" },
			{ key: "ArrowDown", action: "decrement", description: "Decrease channel value (vertical)" },
			{ key: "PageUp", action: "incrementLarge", description: "Large increase" },
			{ key: "PageDown", action: "decrementLarge", description: "Large decrease" },
			{ key: "Home", action: "setMin", description: "Set to minimum" },
			{ key: "End", action: "setMax", description: "Set to maximum" },
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

	primitiveKind: "color-slider",
} as const satisfies ComponentContract;
