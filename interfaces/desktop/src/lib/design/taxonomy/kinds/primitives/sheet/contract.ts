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
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: { element: "button", children: "snippet", aria: { role: "button", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-controls", "aria-label"] } },
		portal: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		overlay: { element: "div", children: "snippet", aria: { required: [], optional: ["aria-hidden"] } },
		content: { element: "div", children: "snippet", aria: { role: "dialog", required: ["aria-modal", "aria-labelledby"], optional: ["aria-label", "aria-describedby"] } },
		header: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		footer: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		title: { element: "h2", children: "snippet", aria: { required: [], optional: [] } },
		description: { element: "p", children: "snippet", aria: { required: [], optional: [] } },
		close: { element: "button", children: "snippet", aria: { role: "button", required: [], optional: ["aria-label"] } },
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "open", "entering", "exiting"],
	},
	slotStates: sheetSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		portal: [],
		overlay: ["close"],
		content: [],
		header: [],
		footer: [],
		title: [],
		description: [],
		close: ["close"],
	},
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-modal", "aria-labelledby"],
		optionalAttrs: [
			"aria-label",
			"aria-describedby",
			"aria-hidden",
			"aria-busy",
		],
	},
	keyboard: ["Escape", "Tab"],
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
};
