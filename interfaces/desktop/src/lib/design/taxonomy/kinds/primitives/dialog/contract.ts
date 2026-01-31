/**
 * @file Dialog Taxonomy Contract
 * @description ColdLight SSOT contract for the dialog primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state machinery.
 * 3-folder parity: taxonomy + adapter + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { dialogSlotStates, type DialogSlot, type DialogState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Dialog primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"dialog", DialogSlot, DialogState> = {
	kind: "dialog",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "content"],
		optional: ["trigger", "portal", "overlay", "title", "description", "close"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "inert", "open", "entering", "exiting"],
	},
	slotStates: dialogSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		portal: [],
		overlay: [],
		content: [],
		title: [],
		description: [],
		close: [],
	},
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal", "aria-labelledby"],
		optionalAttrs: ["aria-describedby"],
	},
	keyboard: ["Escape", "Tab"],
};
