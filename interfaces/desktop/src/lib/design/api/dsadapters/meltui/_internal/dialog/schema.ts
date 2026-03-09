/**
 * @file Dialog Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const DialogSchema = {
	kind: "dialog",
	engine: "meltui",
	slots: ["trigger", "content", "overlay"],
	states: ["open", "closed", "focused", "focus-visible"],
	aria: ["aria-modal", "aria-haspopup", "aria-expanded", "aria-controls", "aria-labelledby", "aria-describedby", "aria-label"],
	interactions: ["click", "keydown.escape"],

	meltui: {
		meltClass: "Dialog",
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
				dataAttributes: ["data-cl-dialog-trigger"],
			},
			content: {
				meltGetter: "content",
				coldlightSlot: "content",
				element: "div",
				aria: {
					role: "dialog",
					required: ["aria-modal"],
					optional: ["aria-labelledby", "aria-describedby", "aria-label"],
				},
				states: ["open", "closed"],
				dataAttributes: ["data-cl-dialog-content"],
			},
			overlay: {
				meltGetter: "overlay",
				coldlightSlot: "overlay",
				element: "div",
				aria: { required: [], optional: [] },
				states: ["open", "closed"],
				dataAttributes: ["data-cl-dialog-overlay"],
			},
		},

		propMapping: [
			{ meltProp: "open", coldlightProp: "open", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "onOpenChange", coldlightProp: "onOpenChange", type: "(open: boolean) => void", required: false },
			{ meltProp: "closeOnEscape", coldlightProp: "closeOnEscape", type: "boolean", required: false, defaultValue: true },
			{ meltProp: "closeOnOutsideClick", coldlightProp: "closeOnOutsideClick", type: "boolean", required: false, defaultValue: true },
			{ meltProp: "scrollLock", coldlightProp: "scrollLock", type: "boolean", required: false, defaultValue: true },
		],

		keyboardMapping: [
			{ key: "Escape", action: "close", description: "Close dialog", slot: "content" },
			{ key: "Tab", action: "trap", description: "Trap focus within dialog", slot: "content" },
		],
	},
} as const;
