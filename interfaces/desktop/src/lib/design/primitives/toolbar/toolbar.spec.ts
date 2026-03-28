import { definePrimitive } from "../../schema/index.js";

export const toolbarSpec = definePrimitive({
	kind: "toolbar",
	label: "Toolbar",
	description:
		"A container for grouping a set of controls with arrow key navigation between items.",
	category: "interactive",
	behaviorHook: "useToolbar",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "toolbar",
				ariaAttrs: ["aria-orientation", "aria-label"],
				description: "Container declaring the toolbar role with roving focus",
			},
			item: {
				element: "div",
				role: null,
				ariaAttrs: ["aria-disabled"],
				description: "An individual focusable item within the toolbar",
			},
		},
		keyboard: [
			{ key: "ArrowRight", action: "Move to next item", condition: "horizontal orientation" },
			{ key: "ArrowLeft", action: "Move to previous item", condition: "horizontal orientation" },
			{ key: "ArrowDown", action: "Move to next item", condition: "vertical orientation" },
			{ key: "ArrowUp", action: "Move to previous item", condition: "vertical orientation" },
			{ key: "Home", action: "Move to first item" },
			{ key: "End", action: "Move to last item" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",
	},
});
