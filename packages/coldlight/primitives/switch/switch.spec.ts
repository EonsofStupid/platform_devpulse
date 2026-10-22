import { definePrimitive } from "../../schema/index.js";

export const switchSpec = definePrimitive({
	kind: "switch",
	label: "Switch",
	description: "A binary on/off toggle control with visual thumb indicator.",
	category: "interactive",
	behaviorHook: "useSwitch",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "button",
				role: "switch",
				ariaAttrs: [
					"aria-checked",
					"aria-disabled",
					"aria-required",
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
				],
				description: "The switch control element",
			},
			thumb: {
				element: "span",
				role: null,
				decorative: true,
				container: false,
				ariaAttrs: [],
				description: "Visual thumb indicator that slides between states",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label that toggles the switch on click",
			},
		},
		keyboard: [{ key: "Space", action: "Toggle checked state" }],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/switch/",
	},
});
