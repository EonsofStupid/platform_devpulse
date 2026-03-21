import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "avatar",
	description:
		"Thumbnail representation of user/entity. Image with fallback on load error. Compound: root, image, fallback.",

	slots: {
		required: ["root"],
		optional: ["image", "fallback"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "span",
			aria: {
				role: "img",
				required: [{ attr: "aria-label", valueType: "aria-label" }],
				optional: [],
			},
			data: { kind: "avatar", slot: "root", states: ["loading", "loaded", "error"] },
		},
		image: {
			name: "image",
			element: "img",
			aria: { required: [], optional: [] },
			data: { kind: "avatar", slot: "image", states: [] },
		},
		fallback: {
			name: "fallback",
			element: "span",
			aria: { required: [], optional: [] },
			data: { kind: "avatar", slot: "fallback", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
	},

	focus: { strategy: "none" },
	keyboard: { global: [] },
	states: { all: ["loading", "loaded", "error"] },

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "avatar",
} as const satisfies ComponentContract;
