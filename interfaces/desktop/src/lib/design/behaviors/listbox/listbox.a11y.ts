import type { A11ySpec } from "../../schema/a11y.schema.js";

export const listboxA11y: A11ySpec = {
	roles: { root: "listbox", option: "option", group: "group", label: undefined },
	requiredAttrs: { root: ["aria-label", "aria-activedescendant"], option: ["aria-selected"] },
	keyboard: [
		{ key: "ArrowDown", action: "next-option" },
		{ key: "ArrowUp", action: "prev-option" },
		{ key: "Home", action: "first-option" },
		{ key: "End", action: "last-option" },
		{ key: "Enter", action: "select" },
		{ key: "Space", action: "select" },
	],
	focusStrategy: "activedescendant",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
};
