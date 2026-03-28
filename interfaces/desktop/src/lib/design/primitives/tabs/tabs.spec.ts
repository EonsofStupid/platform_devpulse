import { definePrimitive } from "../../schema/index.js";

export const tabsSpec = definePrimitive({
	kind: "tabs",
	label: "Tabs",
	description: "A set of layered sections of content, where one panel is displayed at a time.",
	category: "navigation",
	behaviorHook: "useTabs",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Outer container for the tab interface",
			},
			list: {
				element: "div",
				role: "tablist",
				ariaAttrs: ["aria-orientation"],
				description: "Container for tab triggers with roving tabindex",
			},
			trigger: {
				element: "button",
				role: "tab",
				ariaAttrs: ["aria-selected", "aria-controls", "aria-disabled"],
				description: "Activates its associated tab panel",
			},
			content: {
				element: "div",
				role: "tabpanel",
				ariaAttrs: ["aria-labelledby"],
				description: "Content panel associated with a tab trigger",
			},
		},
		keyboard: [
			{ key: "ArrowRight", action: "Move to next tab", condition: "horizontal orientation" },
			{ key: "ArrowLeft", action: "Move to previous tab", condition: "horizontal orientation" },
			{ key: "ArrowDown", action: "Move to next tab", condition: "vertical orientation" },
			{ key: "ArrowUp", action: "Move to previous tab", condition: "vertical orientation" },
			{ key: "Home", action: "Move to first tab" },
			{ key: "End", action: "Move to last tab" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
	},
});
