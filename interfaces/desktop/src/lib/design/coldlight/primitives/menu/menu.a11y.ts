import type { A11ySpec } from "../../schema/a11y.schema.js";

export const menuA11y: A11ySpec = {
	roles: { root: undefined, trigger: undefined, content: "menu", item: "menuitem", separator: "separator", group: "group", label: undefined },
	requiredAttrs: { trigger: ["aria-expanded", "aria-haspopup"], content: ["aria-label"] },
	keyboard: [
		{ key: "ArrowDown", action: "next-item" },
		{ key: "ArrowUp", action: "prev-item" },
		{ key: "Home", action: "first-item" },
		{ key: "End", action: "last-item" },
		{ key: "Enter", action: "activate" },
		{ key: "Space", action: "activate" },
		{ key: "Escape", action: "close" },
	],
	focusStrategy: "roving",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/",
};
