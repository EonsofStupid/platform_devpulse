import { definePrimitive } from "../../schema/index.js";

export const dropdownMenuSpec = definePrimitive({
	kind: "dropdown-menu",
	label: "Dropdown Menu",
	description: "A menu of actions opened from a disclosure trigger.",
	category: "overlay",
	behaviorHook: "useMenu",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Wrapper holding the trigger and anchoring the content",
			},
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-haspopup", "aria-expanded", "aria-controls"],
				description: "Button that opens and closes the menu",
			},
			content: {
				element: "div",
				role: "menu",
				ariaAttrs: ["aria-labelledby", "aria-orientation"],
				description: "The menu, visible when open",
			},
			item: {
				element: "div",
				role: "menuitem",
				ariaAttrs: ["aria-disabled"],
				description: "One action in the menu",
			},
			separator: {
				element: "div",
				role: "separator",
				decorative: true,
				ariaAttrs: [],
				description: "Divider between groups of items",
			},
			group: {
				element: "div",
				role: "group",
				ariaAttrs: ["aria-label"],
				description: "Related items",
			},
			"group-label": {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Heading for a group of items",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Open the menu; move focus to the next item" },
			{ key: "ArrowUp", action: "Open the menu; move focus to the previous item" },
			{ key: "Enter", action: "Activate the focused item" },
			{ key: "Space", action: "Activate the focused item" },
			{ key: "Escape", action: "Close the menu and return focus to the trigger" },
			{ key: "Home", action: "Move focus to the first item" },
			{ key: "End", action: "Move focus to the last item" },
		],
		focusStrategy: "activedescendant",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menu/",
	},
});
