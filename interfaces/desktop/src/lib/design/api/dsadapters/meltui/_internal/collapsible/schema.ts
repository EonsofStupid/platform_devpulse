/**
 * @file Collapsible Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const CollapsibleSchema = {
	kind: "collapsible",
	engine: "meltui",
	slots: ["trigger", "content"],
	states: ["open", "closed", "focused", "focus-visible", "hover", "disabled"],
	aria: ["aria-expanded", "aria-controls", "aria-disabled", "aria-labelledby"],
	interactions: ["click", "keydown"],

	meltui: {
		meltClass: "Collapsible",
		meltImport: "melt/builders",
		compound: true,

		slotMapping: {
			trigger: {
				meltGetter: "trigger",
				coldlightSlot: "trigger",
				element: "button",
				aria: {
					role: "button",
					required: ["aria-expanded", "aria-controls"],
					optional: ["aria-disabled"],
				},
				states: ["open", "focused", "focus-visible", "hover", "disabled"],
				dataAttributes: ["data-cl-collapsible-trigger"],
			},
			content: {
				meltGetter: "content",
				coldlightSlot: "content",
				element: "div",
				aria: {
					role: "region",
					required: [],
					optional: ["aria-labelledby"],
				},
				states: ["open", "closed"],
				dataAttributes: ["data-cl-collapsible-content"],
			},
		},

		propMapping: [
			{ meltProp: "open", coldlightProp: "open", type: "boolean", required: false, defaultValue: false },
			{ meltProp: "onOpenChange", coldlightProp: "onOpenChange", type: "(open: boolean) => void", required: false },
			{ meltProp: "disabled", coldlightProp: "disabled", type: "boolean", required: false, defaultValue: false },
		],

		keyboardMapping: [
			{ key: "Enter", action: "toggle", description: "Toggle collapsible", slot: "trigger" },
			{ key: "Space", action: "toggle", description: "Toggle collapsible", slot: "trigger" },
		],
	},
} as const;
