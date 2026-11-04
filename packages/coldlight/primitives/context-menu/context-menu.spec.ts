import { definePrimitive } from "../../schema/index.js";

export const contextMenuSpec = definePrimitive({
	kind: "context-menu",
	label: "Context Menu",
	description: "A menu of actions opened by right-click at the pointer.",
	category: "overlay",
	behaviorHook: "useContextMenu",
	compound: true,
	a11y: {
		slots: {
			trigger: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Zone that opens the menu on the contextmenu event",
			},
			content: {
				element: "div",
				role: "menu",
				ariaAttrs: ["aria-label", "aria-orientation"],
				description: "The menu, placed at the pointer",
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
			{ key: "ArrowDown", action: "Move focus to the next item" },
			{ key: "ArrowUp", action: "Move focus to the previous item" },
			{ key: "Enter", action: "Activate the focused item" },
			{ key: "Space", action: "Activate the focused item" },
			{ key: "Escape", action: "Close the menu and return focus" },
			{ key: "Home", action: "Move focus to the first item" },
			{ key: "End", action: "Move focus to the last item" },
		],
		focusStrategy: "activedescendant",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menu/",
	},
});
