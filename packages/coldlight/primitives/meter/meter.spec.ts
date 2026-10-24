import { definePrimitive } from "../../schema/index.js";

export const meterSpec = definePrimitive({
	kind: "meter",
	label: "Meter",
	description: "A scalar measurement display within a known range with status thresholds.",
	category: "feedback",
	behaviorHook: "useMeter",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "meter",
				ariaAttrs: [
					"aria-valuenow",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuetext",
					"aria-label",
					"aria-labelledby",
				],
				description: "The meter container with range and threshold semantics",
			},
			track: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "The background track for the meter",
			},
			fill: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "The filled portion indicating current value",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label describing the meter purpose",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
