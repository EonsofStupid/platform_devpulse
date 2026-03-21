/**
 * @file Alert Component Contract
 * @kind alert
 * @layer components
 *
 * Inline contextual feedback with role="alert".
 * NOT a dialog. For confirmations, use AlertDialog.
 * Compound: root, icon, title, description, action, dismiss.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "alert",
	description:
		"Inline contextual feedback with role='alert' and aria-live='assertive'. Variant-driven (info/success/warning/error). Dismissible. NOT modal — for confirmations use AlertDialog.",

	slots: {
		required: ["root"],
		optional: ["icon", "title", "description", "action", "dismiss"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "alert",
				required: [],
				optional: [{ attr: "aria-live", valueType: "aria-live" }],
			},
			data: { kind: "alert", slot: "root", states: [] },
		},
		icon: {
			name: "icon",
			element: "span",
			aria: { required: [], optional: [] },
			data: { kind: "alert", slot: "icon", states: [] },
		},
		title: {
			name: "title",
			element: "h5",
			aria: { required: [], optional: [] },
			data: { kind: "alert", slot: "title", states: [] },
		},
		description: {
			name: "description",
			element: "p",
			aria: { required: [], optional: [] },
			data: { kind: "alert", slot: "description", states: [] },
		},
		action: {
			name: "action",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "alert", slot: "action", states: [] },
		},
		dismiss: {
			name: "dismiss",
			element: "button",
			aria: {
				required: [{ attr: "aria-label", valueType: "aria-label" }],
				optional: [],
			},
			data: { kind: "alert", slot: "dismiss", states: [] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
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

	primitiveKind: "alert",
} as const satisfies ComponentContract;
