import { definePrimitive } from "../../schema/index.js";

export const menuSpec = definePrimitive({
	kind: "menu",
	label: "Menu",
	description: "A list of actions or options revealed from a trigger button.",
	category: "overlay",
	behaviorHook: "useMenu",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Wrapper element containing trigger and content",
			},
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-haspopup", "aria-expanded", "aria-controls"],
				description: "Button that opens the menu",
			},
			content: {
				element: "div",
				role: "menu",
				ariaAttrs: ["aria-labelledby"],
				description: "The menu container holding items",
			},
			item: {
				element: "div",
				role: "menuitem",
				ariaAttrs: ["aria-disabled"],
				description: "An actionable item within the menu",
			},
			separator: {
				element: "div",
				role: "separator",
				decorative: true,
				ariaAttrs: [],
				description: "Visual divider between groups of menu items",
			},
			group: {
				element: "div",
				role: "group",
				ariaAttrs: ["aria-labelledby"],
				description: "A labeled grouping of related menu items",
			},
			label: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Label for a menu group",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Move focus to next menu item" },
			{ key: "ArrowUp", action: "Move focus to previous menu item" },
			{ key: "Enter", action: "Activate focused menu item" },
			{ key: "Space", action: "Activate focused menu item" },
			{ key: "Escape", action: "Close the menu and return focus to trigger" },
			{ key: "Home", action: "Move focus to first menu item" },
			{ key: "End", action: "Move focus to last menu item" },
		],
		focusStrategy: "activedescendant",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menu/",
	},
});
