/**
 * @file Slider Taxonomy Contract
 * @description ColdLight SSOT contract for the slider primitive.
 *
 * ariaStateProvider: "meltui" — createSlider provides ARIA range widget + keyboard interaction.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="slider" on each thumb element.
 * Required: aria-valuenow, aria-valuemin, aria-valuemax.
 * Supports single and multi-thumb (range) configurations.
 * Keyboard: arrow keys for fine adjustment, Page/Home/End for coarse.
 */

import type { PrimitiveContract } from "../../../types.js";
import { sliderSlotStates, type SliderSlot, type SliderState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Slider primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"slider", SliderSlot, SliderState> = {
	kind: "slider",
	ariaStateProvider: "meltui",
	slots: { required: ["root", "track", "range", "thumb"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: ["aria-label", "aria-orientation", "aria-disabled"] },
		},
		track: {
			element: "div",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
		range: {
			element: "div",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
		thumb: {
			element: "span",
			children: "snippet",
			aria: {
				role: "slider",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-valuetext", "aria-label", "aria-labelledby", "aria-disabled"],
			},
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: [],
	},
	slotStates: sliderSlotStates,
	slotActions: { root: [], track: [], range: [], thumb: ["increment", "decrement"] },
	aria: {
		role: "slider",
		requiredAttrs: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
		optionalAttrs: ["aria-valuetext", "aria-label", "aria-labelledby", "aria-orientation", "aria-disabled"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"],
	focusStrategy: "none",
	compound: true,
	orientation: "horizontal",
};
