import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Slider accessibility specification — WAI-ARIA APG Slider Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */
export const sliderA11y: A11ySpec = {
	roles: {
		root: undefined,
		track: undefined,
		thumb: "slider",
		label: undefined,
		output: undefined,
	},
	requiredAttrs: {
		thumb: ["aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-orientation"],
	},
	keyboard: [
		{ key: "ArrowRight", action: "increment", condition: "horizontal" },
		{ key: "ArrowLeft", action: "decrement", condition: "horizontal" },
		{ key: "ArrowUp", action: "increment" },
		{ key: "ArrowDown", action: "decrement" },
		{ key: "Home", action: "set-min" },
		{ key: "End", action: "set-max" },
		{ key: "PageUp", action: "increment-large" },
		{ key: "PageDown", action: "decrement-large" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
};
