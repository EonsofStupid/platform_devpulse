import type { A11ySpec } from "../../schema/a11y.schema.js";

export const treeA11y: A11ySpec = {
	roles: { root: "tree", item: "treeitem", group: "group" },
	requiredAttrs: { root: ["aria-label"], item: ["aria-expanded", "aria-selected"] },
	keyboard: [
		{ key: "ArrowDown", action: "next-visible" },
		{ key: "ArrowUp", action: "prev-visible" },
		{ key: "ArrowRight", action: "expand-or-child" },
		{ key: "ArrowLeft", action: "collapse-or-parent" },
		{ key: "Home", action: "first" },
		{ key: "End", action: "last-visible" },
		{ key: "Enter", action: "activate" },
		{ key: "Space", action: "select" },
	],
	focusStrategy: "roving",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/",
};
