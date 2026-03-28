import { definePrimitive } from "../../schema/index.js";

export const gridListSpec = definePrimitive({
	kind: "grid-list",
	label: "Grid List",
	description: "A selectable list rendered as a grid with arrow key navigation between rows.",
	category: "interactive",
	behaviorHook: "useGridList",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "grid",
				ariaAttrs: ["aria-label", "aria-multiselectable", "aria-disabled"],
				description: "Container declaring the grid role for the selectable list",
			},
			item: {
				element: "div",
				role: "row",
				ariaAttrs: ["aria-selected", "aria-disabled"],
				description: "A selectable row within the grid list",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Move to next row" },
			{ key: "ArrowUp", action: "Move to previous row" },
			{ key: "Home", action: "Move to first row" },
			{ key: "End", action: "Move to last row" },
			{ key: "Space", action: "Toggle selection of focused row" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
	},
});
