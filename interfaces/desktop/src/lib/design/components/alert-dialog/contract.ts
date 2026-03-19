/**
 * @file AlertDialog Component Contract
 * @kind alert-dialog
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * ColdLight-owned: extends dialog pattern with role="alertdialog".
 * Cancel button gets initial focus (safety pattern per WAI-ARIA APG).
 * Focus trap active when open. Escape closes, returns focus to trigger.
 *
 * Pattern: WAI-ARIA APG Alert and Message Dialogs
 * Reference: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "alert-dialog",
	description:
		"Modal alert dialog for confirmations and destructive actions. Uses native <dialog> element with role='alertdialog', aria-modal='true', and focus trap. Cancel button receives initial focus per APG safety pattern. ColdLight-owned ARIA.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/",

	slots: {
		required: ["trigger", "content", "overlay", "action", "cancel"],
		optional: ["title", "description"],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-controls", valueType: "aria-controls" },
				],
			},
			data: {
				kind: "alert-dialog",
				slot: "trigger",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Enter", action: "open", description: "Open alert dialog" },
				{ key: "Space", action: "open", description: "Open alert dialog" },
			],
		},
		overlay: {
			name: "overlay",
			element: "div",
			aria: {
				required: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
				optional: [],
			},
			data: {
				kind: "alert-dialog",
				slot: "overlay",
				states: ["open", "closed"],
			},
		},
		content: {
			name: "content",
			element: "dialog",
			aria: {
				role: "alertdialog",
				required: [{ attr: "aria-modal", valueType: "aria-modal" }],
				optional: [
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
				relationships: [
					{ attr: "aria-labelledby", targetSlot: "title", required: false },
					{ attr: "aria-describedby", targetSlot: "description", required: false },
				],
			},
			data: {
				kind: "alert-dialog",
				slot: "content",
				states: ["open", "closed"],
			},
			keyboard: [
				{ key: "Escape", action: "close", description: "Close alert dialog" },
				{ key: "Tab", action: "exit", description: "Cycle focus within trap" },
			],
		},
		title: {
			name: "title",
			element: "h2",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "alert-dialog",
				slot: "title",
				states: [],
			},
		},
		description: {
			name: "description",
			element: "p",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "alert-dialog",
				slot: "description",
				states: [],
			},
		},
		action: {
			name: "action",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [],
			},
			data: {
				kind: "alert-dialog",
				slot: "action",
				states: [],
			},
			keyboard: [
				{ key: "Enter", action: "confirm", description: "Confirm action" },
				{ key: "Space", action: "confirm", description: "Confirm action" },
			],
		},
		cancel: {
			name: "cancel",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [],
			},
			data: {
				kind: "alert-dialog",
				slot: "cancel",
				states: [],
			},
			keyboard: [
				{ key: "Enter", action: "cancel", description: "Cancel and close" },
				{ key: "Space", action: "cancel", description: "Cancel and close" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "title",
	},

	focus: {
		strategy: "trap",
		initialFocus: "cancel",
		returnFocus: "trigger",
		trapContainer: "content",
	},

	keyboard: {
		global: [{ key: "Escape", action: "close", description: "Close alert dialog" }],
	},

	states: {
		primary: "open",
		all: ["open", "closed"],
		ariaMapping: {
			open: "aria-expanded",
		},
	},

	interactions: {
		modal: true,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "alert-dialog",
} as const satisfies ComponentContract;
