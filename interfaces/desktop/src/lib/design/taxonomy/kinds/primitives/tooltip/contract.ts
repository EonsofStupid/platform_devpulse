/**
 * @file Tooltip Taxonomy Contract
 * @description ColdLight SSOT contract for the tooltip primitive.
 *
 * ariaStateProvider: "meltui" — dsAdapter (createTooltip) provides ARIA + state.
 * 3-folder parity: taxonomy + adapter + primitive.
 * Non-interactive, appears on hover/focus after delay. Dismissed on Escape.
 */

import type { PrimitiveContract } from "../../../types.js";
import { tooltipSlotStates, type TooltipSlot, type TooltipState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Tooltip primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"tooltip", TooltipSlot, TooltipState> = {
	kind: "tooltip",
	ariaStateProvider: "meltui",
	slots: {
		required: ["root", "trigger", "content"],
		optional: ["arrow"],
		forbidden: [],
	},
	slotSpec: {
		root: { element: "fragment", children: "renderless", aria: { required: [], optional: [] } },
		trigger: { element: "button", children: "snippet", aria: { required: ["aria-describedby"], optional: [] } },
		content: { element: "div", children: "snippet", aria: { role: "tooltip", required: [], optional: ["aria-label"] } },
		arrow: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
	},
	states: {
		shared: ["focused", "focus-visible", "hover"],
		specific: ["open", "hidden", "visible", "entering", "exiting"],
	},
	slotStates: tooltipSlotStates,
	slotActions: {
		root: [],
		trigger: [],
		content: [],
		arrow: [],
	},
	aria: {
		role: "tooltip",
		requiredAttrs: [],
		optionalAttrs: ["aria-describedby"],
	},
	keyboard: ["Escape"],
	focusStrategy: "none",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: false },
};
