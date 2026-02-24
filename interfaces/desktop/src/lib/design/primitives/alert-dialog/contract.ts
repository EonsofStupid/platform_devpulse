/**
 * @file primitives/alert-dialog/contract.ts
 * @kind alert-dialog
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Alert Dialog PrimitiveContract — modal dialog requiring acknowledgment.
 *
 * ariaStateProvider: "meltui"
 * Builder: new AlertDialog()
 * 3-folder parity: primitives/alert-dialog/ + api/adapters/meltui/_internal/alert-dialog/ + components/alert-dialog/
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 *
 * ARIA (handled by MeltUI adapter):
 *   trigger: role="button", aria-haspopup, aria-expanded, aria-controls → content
 *   content: role="alertdialog", aria-modal, aria-labelledby → title, aria-describedby → description
 *   action: role="button"
 *   cancel: role="button"
 *
 * Keyboard:
 *   Escape — close dialog
 *   Tab — cycle focus within dialog (focus trap)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { AlertDialogSlot, AlertDialogState } from "./types.js";

export const contract = {
	kind: "alert-dialog",
	ariaStateProvider: "meltui",

	slots: {
		required: ["trigger", "overlay", "content", "title", "description", "action", "cancel"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-haspopup", "aria-expanded", "aria-controls"],
			},
		},
		overlay: {
			element: "div",
			children: "self-closing",
			aria: { required: [], optional: [] },
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "alertdialog",
				required: ["aria-modal"],
				optional: ["aria-labelledby", "aria-describedby"],
			},
		},
		title: {
			element: "h2",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		description: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		action: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
		cancel: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label"],
			},
		},
	},

	states: {
		shared: ["focused", "focus-visible"],
		specific: ["open", "closed"],
	},

	slotStates: {
		trigger: ["focused", "focus-visible"],
		overlay: ["open", "closed"],
		content: ["open", "closed"],
		title: [],
		description: [],
		action: ["focused", "focus-visible"],
		cancel: ["focused", "focus-visible"],
	},

	slotActions: {
		trigger: ["open"],
		overlay: [],
		content: [],
		title: [],
		description: [],
		action: [],
		cancel: ["close"],
	},

	aria: {
		role: "alertdialog",
		requiredAttrs: ["aria-modal"],
		optionalAttrs: ["aria-labelledby", "aria-describedby", "aria-label"],
	},

	keyboard: ["Escape", "Tab"],
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: false },
} as const satisfies PrimitiveContract<"alert-dialog", AlertDialogSlot, AlertDialogState>;
