import { definePrimitive } from "../../schema/index.js";

export const tooltipSpec = definePrimitive({
	kind: "tooltip",
	label: "Tooltip",
	description: "A transient text label that appears on hover or focus to describe an element.",
	category: "overlay",
	behaviorHook: "useTooltip",
	compound: true,
	a11y: {
		slots: {
			trigger: {
				element: "svelte:element",
				role: null,
				ariaAttrs: ["aria-describedby"],
				description: "The element that the tooltip describes",
			},
			content: {
				element: "div",
				role: "tooltip",
				ariaAttrs: [],
				description: "The tooltip text container",
			},
		},
		keyboard: [{ key: "Escape", action: "Dismiss the tooltip" }],
		focusStrategy: "none",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",
	},
});
