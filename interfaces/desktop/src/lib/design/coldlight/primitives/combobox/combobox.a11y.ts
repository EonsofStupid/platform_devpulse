import type { A11ySpec } from "../../schema/a11y.schema.js";

export const comboboxA11y: A11ySpec = {
	roles: { root: undefined, input: "combobox", trigger: undefined, listbox: "listbox", option: "option", label: undefined },
	requiredAttrs: { input: ["aria-expanded", "aria-haspopup", "aria-activedescendant", "aria-autocomplete", "aria-controls"] },
	keyboard: [
		{ key: "ArrowDown", action: "open-or-next" },
		{ key: "ArrowUp", action: "prev" },
		{ key: "Enter", action: "select" },
		{ key: "Escape", action: "close" },
		{ key: "Home", action: "first" },
		{ key: "End", action: "last" },
	],
	focusStrategy: "activedescendant",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
};
