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
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: { element: "button", children: "snippet", aria: { role: "button", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-controls", "aria-label"] } },
		portal: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		overlay: { element: "div", children: "snippet", aria: { required: [], optional: ["aria-hidden"] } },
		content: { element: "div", children: "snippet", aria: { role: "dialog", required: ["aria-modal", "aria-labelledby"], optional: ["aria-label", "aria-describedby"] } },
		title: { element: "h2", children: "snippet", aria: { required: [], optional: [] } },
		description: { element: "p", children: "snippet", aria: { required: [], optional: [] } },
		close: { element: "button", children: "snippet", aria: { role: "button", required: [], optional: ["aria-label"] } },
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["hidden", "visible", "inert", "open", "entering", "exiting"],
	},
	slotStates: dialogSlotStates,
	slotActions: {
		root: [],
		trigger: ["open"],
		portal: [],
		overlay: ["close"],
		content: [],
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
			"aria-expanded",
			"aria-haspopup",
			"aria-controls",
		],
	},
	keyboard: ["Escape", "Tab"],
	focusStrategy: "trap",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
};
