/**
 * @file Card Component Contract
 * @kind card
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 *
 * Card is a compound structural surface container.
 * Supports element polymorphism: div (static), a (link), button (clickable).
 * ARIA is conditional — only applied when label/labelledBy provided (div)
 * or implicitly correct (a/button).
 *
 * Slots: root, cover, header, title, description, action, content, footer.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "card",
	description:
		"Compound structural surface container with cover, header (title + description + action), content, and footer slots. Supports element polymorphism (div/a/button). Optional role='group' when labelled as div. Purely structural.",

	slots: {
		required: ["root"],
		optional: ["cover", "header", "title", "description", "action", "content", "footer"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				required: [],
				optional: [
					{ attr: "role", valueType: "role" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "card",
				slot: "root",
				states: [],
			},
		},
		cover: {
			name: "cover",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "cover", states: [] },
		},
		header: {
			name: "header",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "header", states: [] },
		},
		title: {
			name: "title",
			element: "h3",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "title", states: [] },
		},
		description: {
			name: "description",
			element: "p",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "description", states: [] },
		},
		action: {
			name: "action",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "action", states: [] },
		},
		content: {
			name: "content",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "content", states: [] },
		},
		footer: {
			name: "footer",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "card", slot: "footer", states: [] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "card",
} as const satisfies ComponentContract;
