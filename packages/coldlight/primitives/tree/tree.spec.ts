import { definePrimitive } from "../../schema/index.js";

export const treeSpec = definePrimitive({
	kind: "tree",
	label: "Tree",
	description:
		"A hierarchical list of expandable and collapsible nodes for navigating nested structures.",
	category: "navigation",
	behaviorHook: "useTree",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "tree",
				ariaAttrs: ["aria-label", "aria-disabled"],
				description: "Container declaring the tree role for the hierarchical list",
			},
			item: {
				element: "div",
				role: "treeitem",
				ariaAttrs: ["aria-expanded", "aria-selected", "aria-level", "aria-disabled"],
				description: "A node in the tree that may be expandable and selectable",
			},
			group: {
				element: "div",
				role: "group",
				ariaAttrs: [],
				description: "Container for child tree items of an expanded node",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Move to next visible tree item" },
			{ key: "ArrowUp", action: "Move to previous visible tree item" },
			{ key: "ArrowRight", action: "Expand node or move to first child" },
			{ key: "ArrowLeft", action: "Collapse node or move to parent" },
			{ key: "Home", action: "Move to first visible tree item" },
			{ key: "End", action: "Move to last visible tree item" },
			{ key: "Space", action: "Toggle selection of focused item" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/",
	},
});
