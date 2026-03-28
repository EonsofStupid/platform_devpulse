import { definePrimitive } from "../../schema/index.js";

export const colorSliderSpec = definePrimitive({
	kind: "color-slider",
	label: "Color Slider",
	description:
		"A slider specialized for adjusting a single color channel such as hue, saturation, or lightness.",
	category: "form",
	behaviorHook: "useColorSlider",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Structural wrapper for the color slider",
			},
			track: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Visual track representing the color channel range",
			},
			thumb: {
				element: "div",
				role: "slider",
				ariaAttrs: [
					"aria-valuenow",
					"aria-valuemin",
					"aria-valuemax",
					"aria-orientation",
					"aria-label",
					"aria-disabled",
				],
				description: "Draggable thumb that controls the color channel value",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label for the color slider",
			},
		},
		keyboard: [
			{ key: "ArrowRight", action: "Increase value by one step" },
			{ key: "ArrowUp", action: "Increase value by one step" },
			{ key: "ArrowLeft", action: "Decrease value by one step" },
			{ key: "ArrowDown", action: "Decrease value by one step" },
			{ key: "Home", action: "Set value to minimum" },
			{ key: "End", action: "Set value to maximum" },
		],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
	},
});
