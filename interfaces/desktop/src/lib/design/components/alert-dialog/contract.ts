/**
 * @file AlertDialog Component Contract
 * @kind alert-dialog
 * @layer components
 *
 * Confirmation/destructive dialog with role="alertdialog".
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "alert-dialog",
	description:
		"Confirmation/destructive action dialog with role='alertdialog'. Focus trapped. Cancel + action buttons. Variants: confirmation, information, destructive, error, warning.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/",

	slots: {
		required: ["content"],
		optional: ["trigger", "overlay", "title", "description", "cancel", "action"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				required: [{ attr: "aria-haspopup", valueType: "aria-haspopup" }],
				optional: [],
			},
			data: { kind: "alert-dialog", slot: "trigger", states: ["open", "closed"] },
		},
		overlay: {
			name: "overlay",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "alert-dialog", slot: "overlay", states: ["open", "closed"] },
		},
		content: {
			name: "content",
			element: "dialog",
			aria: {
				role: "alertdialog",
				required: [
					{ attr: "aria-modal", valueType: "aria-modal" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
				optional: [],
			},
			data: { kind: "alert-dialog", slot: "content", states: ["open", "closed"] },
		},
		title: {
			name: "title",
			element: "h2",
			aria: { required: [], optional: [] },
			data: { kind: "alert-dialog", slot: "title", states: [] },
		},
		description: {
			name: "description",
			element: "p",
			aria: { required: [], optional: [] },
			data: { kind: "alert-dialog", slot: "description", states: [] },
		},
		cancel: {
			name: "cancel",
			element: "button",
			aria: { required: [], optional: [] },
			data: { kind: "alert-dialog", slot: "cancel", states: [] },
		},
		action: {
			name: "action",
			element: "button",
			aria: { required: [], optional: [] },
			data: { kind: "alert-dialog", slot: "action", states: [] },
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-labelledby"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "trap",
		trapContainer: "content",
	},

	keyboard: {
		global: [
			{ key: "Escape", action: "close", description: "Close the alert dialog" },
		],
	},

	states: {
		all: ["open", "closed"],
	},

	interactions: {
		modal: true,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "alert-dialog",
} as const satisfies ComponentContract;
