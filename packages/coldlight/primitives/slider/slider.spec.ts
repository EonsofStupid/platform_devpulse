import { definePrimitive } from "../../schema/index.js";

export const sliderSpec = definePrimitive({
	kind: "slider",
	label: "Slider",
	description: "A range input that allows selecting a value by dragging a thumb along a track.",
	category: "form",
	behaviorHook: "useSlider",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Outer container for the slider and its labels",
			},
			track: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "The track along which the thumb slides",
			},
			thumb: {
				element: "div",
				role: "slider",
				ariaAttrs: [
					"aria-valuenow",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuetext",
					"aria-orientation",
					"aria-disabled",
					"aria-label",
					"aria-labelledby",
				],
				description: "The draggable thumb element that receives focus and keyboard input",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label for the slider",
			},
			output: {
				element: "output",
				role: null,
				ariaAttrs: ["aria-live"],
				description: "Live region displaying the current slider value",
			},
		},
		keyboard: [
			{ key: "ArrowRight", action: "Increase value by one step" },
			{ key: "ArrowUp", action: "Increase value by one step" },
			{ key: "ArrowLeft", action: "Decrease value by one step" },
			{ key: "ArrowDown", action: "Decrease value by one step" },
			{ key: "PageUp", action: "Increase value by large step" },
			{ key: "PageDown", action: "Decrease value by large step" },
			{ key: "Home", action: "Set value to minimum" },
			{ key: "End", action: "Set value to maximum" },
		],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
	},
});
