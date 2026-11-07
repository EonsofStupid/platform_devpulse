import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "color-wheel",
	description:
		"Circular hue picker. Thumb on a ring, 0-360 degrees. Pointer drag + keyboard arrows. Form integration.",

	slots: {
		required: ["root", "track", "thumb"],
		optional: [],
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
			data: { kind: "color-wheel", slot: "root", states: [] },
		},
		track: {
			name: "track",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "color-wheel", slot: "track", states: [] },
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
				optional: [{ attr: "aria-valuetext", valueType: "aria-valuetext" }],
			},
			data: { kind: "color-wheel", slot: "thumb", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
	},

	focus: { strategy: "direct" },

	keyboard: {
		global: [
			{ key: "ArrowRight", action: "incrementHue", description: "Increase hue" },
			{ key: "ArrowUp", action: "incrementHue", description: "Increase hue" },
			{ key: "ArrowLeft", action: "decrementHue", description: "Decrease hue" },
			{ key: "ArrowDown", action: "decrementHue", description: "Decrease hue" },
			{ key: "Home", action: "setMin", description: "Set hue to 0" },
			{ key: "End", action: "setMax", description: "Set hue to 359" },
		],
	},

	states: { all: [] },

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "color-wheel",
} as const satisfies ComponentContract;
