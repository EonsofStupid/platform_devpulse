import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "avatar-group",
	description:
		"Layout container for overlapping avatars. Passes size to children via context. Overflow indicator (+N). role='group' with label.",

	slots: {
		required: ["root"],
		optional: ["overflow"],
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
			data: { kind: "avatar-group", slot: "root", states: [] },
		},
		overflow: {
			name: "overflow",
			element: "span",
			aria: { required: [], optional: [] },
			data: { kind: "avatar-group", slot: "overflow", states: [] },
		},
	},

	accessibleName: {
		required: false,
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

	primitiveKind: "avatar-group",
} as const satisfies ComponentContract;
