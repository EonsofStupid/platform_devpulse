/**
 * @file Popover Taxonomy Contract
 * @description ColdLight SSOT contract for the popover primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter (createPopover) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 * Non-modal floating content anchored to trigger via Floating UI.
 */

import type { PrimitiveContract } from "../../../types.js";
import { popoverSlotStates, type PopoverSlot, type PopoverState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Popover primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"popover", PopoverSlot, PopoverState> = {
	kind: "popover",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "trigger", "content"],
		optional: ["arrow", "close"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: { element: "button", children: "snippet", aria: { role: "button", required: ["aria-haspopup", "aria-expanded"], optional: ["aria-controls", "aria-label"] } },
		content: { element: "div", children: "snippet", aria: { required: [], optional: ["aria-label", "aria-labelledby", "aria-describedby"] } },
		arrow: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
		close: { element: "button", children: "snippet", aria: { role: "button", required: [], optional: ["aria-label"] } },
	},
	states: {
		shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
		specific: ["open", "hidden", "visible", "entering", "exiting"],
	},
	slotStates: popoverSlotStates,
	slotActions: {
		root: [],
		trigger: ["toggle"],
		content: [],
		arrow: [],
		close: ["close"],
	},
	aria: {
		role: "dialog",
		requiredAttrs: ["aria-expanded", "aria-controls"],
		optionalAttrs: [
			"aria-haspopup",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-hidden",
		],
	},
	keyboard: ["Escape", "Tab"],
	focusStrategy: "redirect",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
};
