import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * ColorSlider accessibility specification.
 * Slider specialized for color channel adjustment (hue, saturation, lightness, alpha).
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */
export const colorSliderA11y: A11ySpec = {
	roles: { root: undefined, track: undefined, thumb: "slider", label: undefined },
	requiredAttrs: {
		thumb: ["aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-orientation", "aria-label"],
	},
	keyboard: [
		{ key: "ArrowRight", action: "increment", condition: "horizontal" },
		{ key: "ArrowLeft", action: "decrement", condition: "horizontal" },
		{ key: "ArrowUp", action: "increment" },
		{ key: "ArrowDown", action: "decrement" },
		{ key: "Home", action: "set-min" },
		{ key: "End", action: "set-max" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
};
