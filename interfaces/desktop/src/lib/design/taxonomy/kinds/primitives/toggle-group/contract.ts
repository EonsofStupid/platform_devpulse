/**
 * @file ToggleGroup Taxonomy Contract
 * @description ColdLight SSOT contract for the toggle-group primitive.
 *
 * ariaStateProvider: "meltui" — createToggleGroup provides roving tabindex + aria-pressed management.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="group" container with toggle buttons using aria-pressed.
 * Supports single or multiple selection modes.
 * Roving tabindex for keyboard navigation between items.
 */

import type { PrimitiveContract } from "../../../types.js";
import { toggleGroupSlotStates, type ToggleGroupSlot, type ToggleGroupState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** ToggleGroup primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"toggle-group", ToggleGroupSlot, ToggleGroupState> = {
	kind: "toggle-group",
	ariaStateProvider: "meltui",
	slots: { required: ["root", "item"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label", "aria-orientation", "aria-disabled"] },
		},
		item: {
			element: "button",
			children: "snippet",
			aria: { required: ["aria-pressed"], optional: ["aria-label", "aria-disabled"] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["pressed"],
	},
	slotStates: toggleGroupSlotStates,
	slotActions: { root: [], item: ["toggle"] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-orientation", "aria-disabled"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Space", "Enter"],
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
};
