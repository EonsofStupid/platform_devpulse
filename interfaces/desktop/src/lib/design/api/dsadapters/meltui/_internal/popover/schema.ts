/**
 * @file Popover Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-non-modal/
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const PopoverSchema = {
	kind: "popover",
	engine: "meltui",
	slots: ["trigger", "content", "arrow"],
	states: ["open", "closed", "focused", "focus-visible", "hover"],
	aria: ["aria-haspopup", "aria-expanded", "aria-controls", "aria-label", "aria-labelledby"],
	interactions: ["click", "keydown.escape"],

	meltui: {
		meltClass: "Popover",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			trigger: {
				meltGetter: "trigger",
				coldlightSlot: "trigger",
				element: "button",
				aria: {
					role: "button",
					required: [],
					optional: ["aria-haspopup", "aria-expanded", "aria-controls"],
				},
				states: ["focused", "focus-visible"],
				dataAttributes: ["data-cl-popover-trigger"],
			},
			content: {
				meltGetter: "content",
				coldlightSlot: "content",
				element: "div",
				aria: { required: [], optional: ["aria-label", "aria-labelledby"] },
				states: ["open", "closed"],
				dataAttributes: ["data-cl-popover-content"],
			},
			arrow: {
				meltGetter: "arrow",
				coldlightSlot: "arrow",
				element: "div",
				aria: { required: [], optional: [] },
				states: [],
				dataAttributes: ["data-cl-popover-arrow"],
			},
		},

		propMapping: [
			{ meltProp: "open", coldlightProp: "open", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "onOpenChange", coldlightProp: "onOpenChange", type: "(open: boolean) => void", required: false },
			{ meltProp: "forceVisible", coldlightProp: "forceVisible", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "sameWidth", coldlightProp: "sameWidth", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "closeOnEscape", coldlightProp: "closeOnEscape", type: "boolean", required: false, defaultValue: true },
			{ meltProp: "closeOnOutsideClick", coldlightProp: "closeOnOutsideClick", type: "boolean", required: false, defaultValue: true },
			{ meltProp: "floatingConfig", coldlightProp: "floatingConfig", type: "object", required: false },
		],

		keyboardMapping: [
			{ key: "Escape", action: "close", description: "Close popover", slot: "content" },
			{ key: "Tab", action: "trap", description: "Trap focus in popover", slot: "content" },
		],
	},
} as const;
