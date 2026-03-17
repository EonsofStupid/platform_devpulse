import type { A11ySpec } from "../../schema/a11y.schema.js";

export const sheetA11y: A11ySpec = {
	roles: { trigger: undefined, overlay: undefined, content: "dialog", title: undefined, description: undefined, close: undefined },
	requiredAttrs: { trigger: ["aria-haspopup", "aria-expanded"], content: ["aria-modal", "aria-labelledby"] },
	keyboard: [
		{ key: "Escape", action: "close" },
		{ key: "Tab", action: "cycle-focus", condition: "focus trapped" },
	],
	focusStrategy: "trap",
};
