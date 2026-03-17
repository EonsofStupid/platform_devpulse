import type { A11ySpec } from "../../schema/a11y.schema.js";

export const selectA11y: A11ySpec = {
	roles: { root: undefined, trigger: "combobox", value: undefined, listbox: "listbox", option: "option", label: undefined },
	requiredAttrs: { trigger: ["aria-expanded", "aria-haspopup", "aria-activedescendant"] },
	keyboard: [
		{ key: "ArrowDown", action: "open-or-next" },
		{ key: "ArrowUp", action: "open-or-prev" },
		{ key: "Enter", action: "select" },
		{ key: "Space", action: "open-or-select" },
		{ key: "Escape", action: "close" },
		{ key: "Home", action: "first" },
		{ key: "End", action: "last" },
	],
	focusStrategy: "activedescendant",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/",
};
