import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Alert dialog anatomy — modal requiring explicit user decision.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 *
 * Unlike regular dialog, alert dialog:
 * - Uses role="alertdialog" (announces urgently to screen readers)
 * - REQUIRES explicit user action (cancel or confirm) — no casual dismiss
 * - Should NOT close on outside click (user must choose)
 * - Focus moves to the least destructive action (cancel) on open
 *
 * Use for: destructive confirmations, unsaved changes warnings,
 * irreversible actions that need explicit consent.
 *
 * Keyboard:
 * - Tab/Shift+Tab: cycle between cancel and action buttons
 * - Escape: triggers cancel (not just close)
 * - Focus starts on cancel button (least destructive) on open
 */
export const alertDialogAnatomy = createAnatomy("alert-dialog", {
	trigger: {
		description:
			"Button that opens the alert dialog. Sets aria-expanded and aria-haspopup='dialog'. Receives focus when dialog closes.",
		element: "button",
		required: false,
		aria: {
			role: "button",
			required: ["aria-haspopup"],
			conditional: ["aria-expanded"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	overlay: {
		description:
			"Visual backdrop — dims background. Does NOT close on click (unlike regular dialog) because alert dialogs require explicit user decision.",
		element: "div",
		required: false,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
	content: {
		description:
			"Alert dialog container — uses role='alertdialog' which triggers urgent screen reader announcements. Focus trapped inside. Must contain title + at least cancel and action buttons.",
		element: "dialog",
		required: true,
		aria: {
			role: "alertdialog",
			required: ["aria-modal", "aria-labelledby", "aria-describedby"],
		},
		accepts: ["any"],
		stateAttrs: ["data-state"],
		keyboard: {
			dismisses: "Escape",
			focusable: true,
		},
	},
	title: {
		description:
			"Alert dialog title — provides the accessible name via aria-labelledby. Communicates what decision is being asked. Must be present.",
		element: ["h2", "h3"],
		required: true,
		accepts: ["text"],
	},
	description: {
		description:
			"Alert dialog description — explains the consequences of the action and provides context for the decision. Wired to aria-describedby.",
		element: "p",
		required: true,
		accepts: ["text"],
	},
	cancel: {
		description:
			"Cancel button — the safe/non-destructive option. Receives initial focus on open (least destructive action first). Dismisses the dialog without performing the action.",
		element: "button",
		required: true,
		aria: {
			role: "button",
		},
		accepts: ["text"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	action: {
		description:
			"Action/confirm button — the potentially destructive option. Should be visually distinct (danger preset). Performs the action and closes the dialog.",
		element: "button",
		required: true,
		aria: {
			role: "button",
		},
		accepts: ["text"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});
