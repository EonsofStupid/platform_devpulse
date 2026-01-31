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
};
