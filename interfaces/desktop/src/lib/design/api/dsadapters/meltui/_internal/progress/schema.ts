/**
 * @file Progress Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/meter/
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const ProgressSchema = {
	kind: "progress",
	engine: "meltui",
	slots: ["root", "indicator"],
	states: [],
	aria: ["aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-label", "aria-labelledby", "aria-valuetext"],
	interactions: [],

	meltui: {
		meltClass: "Progress",
		meltImport: "melt/builders",
		compound: false,

		slotMapping: {
			root: {
				meltGetter: "root",
				coldlightSlot: "root",
				element: "div",
				aria: {
					role: "progressbar",
					required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
					optional: ["aria-label", "aria-labelledby", "aria-valuetext"],
				},
				states: [],
				dataAttributes: ["data-cl-progress-root"],
			},
			indicator: {
				meltGetter: "progress",
				coldlightSlot: "indicator",
				element: "div",
				aria: { required: [], optional: [] },
				states: [],
				dataAttributes: ["data-cl-progress-indicator"],
			},
		},

		propMapping: [
			{ meltProp: "value", coldlightProp: "value", type: "number", required: false },
			{ meltProp: "max", coldlightProp: "max", type: "number", required: false, defaultValue: 100 },
		],

		keyboardMapping: [],
	},
} as const;
