/**
 * @file Sheet Taxonomy Contract
 * @description ColdLight SSOT contract for the sheet primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter (createDialog) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 * Structurally a side-anchored dialog with header/footer layout slots.
 */

import type { PrimitiveContract } from "../../../types.js";
import { sheetSlotStates, type SheetSlot, type SheetState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Sheet primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"sheet", SheetSlot, SheetState> = {
	kind: "sheet",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "content"],
		optional: ["trigger", "portal", "overlay", "header", "footer", "title", "description", "close"],
		forbidden: [],
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "open", "entering", "exiting"],
	},
	slotStates: sheetSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		portal: [],
		overlay: [],
		content: [],
		header: [],
		footer: [],
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
