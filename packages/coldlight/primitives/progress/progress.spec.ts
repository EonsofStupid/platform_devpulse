import { definePrimitive } from "../../schema/index.js";

export const progressSpec = definePrimitive({
	kind: "progress",
	label: "Progress",
	description: "A determinate or indeterminate progress indicator within a known range.",
	category: "feedback",
	behaviorHook: "useProgress",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "progressbar",
				ariaAttrs: [
					"aria-valuenow",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuetext",
					"aria-label",
					"aria-labelledby",
				],
				description: "The progress bar container with range semantics",
			},
			track: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "The background track for the progress bar",
			},
			fill: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "The filled portion indicating current progress",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label describing the progress purpose",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
