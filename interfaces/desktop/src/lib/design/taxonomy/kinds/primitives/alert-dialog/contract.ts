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
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: { element: "button", children: "snippet", aria: { role: "button", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-controls", "aria-label"] } },
		portal: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		overlay: { element: "div", children: "snippet", aria: { required: [], optional: ["aria-hidden"] } },
		content: { element: "div", children: "snippet", aria: { role: "alertdialog", required: ["aria-modal", "aria-labelledby", "aria-describedby"], optional: ["aria-label"] } },
		title: { element: "h2", children: "snippet", aria: { required: [], optional: [] } },
		description: { element: "p", children: "snippet", aria: { required: [], optional: [] } },
		cancel: { element: "button", children: "snippet", aria: { role: "button", required: [], optional: ["aria-label"] } },
		action: { element: "button", children: "snippet", aria: { role: "button", required: [], optional: ["aria-label"] } },
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "open", "entering", "exiting"],
	},
	slotStates: alertDialogSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		portal: [],
		overlay: [],
		content: [],
		title: [],
		description: [],
		cancel: ["dismiss"],
		action: ["close"],
	},
	aria: {
		role: "alertdialog",
		requiredAttrs: ["aria-modal", "aria-labelledby", "aria-describedby"],
		optionalAttrs: [
			"aria-label",
			"aria-hidden",
			"aria-busy",
		],
	},
	keyboard: ["Tab"],
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: { escape: false, outsideClick: false },
};
