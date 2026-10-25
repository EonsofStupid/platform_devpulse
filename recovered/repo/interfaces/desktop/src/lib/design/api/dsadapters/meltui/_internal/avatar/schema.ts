/**
 * @file Avatar Adapter Schema — The Schema IS The Contract
 * @package @devpulse/coldlight
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const AvatarSchema = {
	kind: "avatar",
	engine: "meltui",
	slots: ["root", "image", "fallback"],
	states: ["loading"],
	aria: ["aria-label", "aria-hidden"],
	interactions: [],

	meltui: {
		meltClass: "Avatar",
		meltImport: "melt/builders",
		compound: false,

		slotMapping: {
			root: {
				meltGetter: "root",
				coldlightSlot: "root",
				element: "span",
				aria: { role: "img", required: [], optional: ["aria-label"] },
				states: [],
				dataAttributes: ["data-cl-avatar-root"],
			},
			image: {
				meltGetter: "image",
				coldlightSlot: "image",
				element: "img",
				aria: { required: [], optional: ["aria-hidden"] },
				states: ["loading"],
				dataAttributes: ["data-cl-avatar-image"],
			},
			fallback: {
				meltGetter: "fallback",
				coldlightSlot: "fallback",
				element: "span",
				aria: { required: [], optional: ["aria-hidden"] },
				states: [],
				dataAttributes: ["data-cl-avatar-fallback"],
			},
		},

		propMapping: [
			{ meltProp: "src", coldlightProp: "src", type: "string", required: false },
			{ meltProp: "delayMs", coldlightProp: "delayMs", type: "number", required: false, defaultValue: 0 },
		],

		keyboardMapping: [],
	},
} as const;
