import type { A11ySpec } from "../../schema/a11y.schema.js";

export const tagGroupA11y: A11ySpec = {
	roles: { root: "grid", tag: "row", label: undefined, description: undefined, remove: undefined },
	requiredAttrs: { root: ["aria-label"] },
	keyboard: [
		{ key: "ArrowRight", action: "next-tag" },
		{ key: "ArrowLeft", action: "prev-tag" },
		{ key: "Delete", action: "remove" },
		{ key: "Backspace", action: "remove" },
	],
	focusStrategy: "roving",
};
