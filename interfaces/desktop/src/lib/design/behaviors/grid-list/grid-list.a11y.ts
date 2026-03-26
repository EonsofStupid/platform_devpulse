import type { A11ySpec } from "../../schema/a11y.schema.js";

export const gridListA11y: A11ySpec = {
	roles: { root: "grid", item: "row" },
	requiredAttrs: { root: ["aria-label", "aria-multiselectable"] },
	keyboard: [
		{ key: "ArrowDown", action: "next-item" },
		{ key: "ArrowUp", action: "prev-item" },
		{ key: "Home", action: "first-item" },
		{ key: "End", action: "last-item" },
		{ key: "Space", action: "select" },
	],
	focusStrategy: "roving",
};
