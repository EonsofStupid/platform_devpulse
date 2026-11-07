import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "color-swatch",
	description:
		"Presentational colored square displaying a color value. role='img' with accessible name. Sizes xs-lg, rounding default/none/full.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "img",
				required: [{ attr: "aria-label", valueType: "aria-label" }],
				optional: [{ attr: "aria-roledescription", valueType: "aria-roledescription" }],
			},
			data: { kind: "color-swatch", slot: "root", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
	},

	focus: { strategy: "none" },
	keyboard: { global: [] },
	states: { all: [] },

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "color-swatch",
} as const satisfies ComponentContract;
