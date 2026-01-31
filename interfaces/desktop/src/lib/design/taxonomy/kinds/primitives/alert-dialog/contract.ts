/**
 * @file AlertDialog Taxonomy Contract
 * @description ColdLight SSOT contract for the alert-dialog primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter (createDialog) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 * Non-dismissible dialog — Escape does NOT close. User must pick cancel or action.
 */

import type { PrimitiveContract } from "../../../types.js";
import { alertDialogSlotStates, type AlertDialogSlot, type AlertDialogState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** AlertDialog primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"alert-dialog", AlertDialogSlot, AlertDialogState> = {
	kind: "alert-dialog",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "content", "title", "description"],
		optional: ["trigger", "portal", "overlay", "cancel", "action"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "open", "entering", "exiting"],
	},
	slotStates: alertDialogSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		portal: [],
		overlay: [],
		content: [],
		title: [],
		description: [],
		cancel: [],
		action: [],
	},
	aria: {
		role: "alertdialog",
		requiredAttrs: ["aria-modal", "aria-labelledby", "aria-describedby"],
		optionalAttrs: [],
	},
	keyboard: ["Tab"],
};
