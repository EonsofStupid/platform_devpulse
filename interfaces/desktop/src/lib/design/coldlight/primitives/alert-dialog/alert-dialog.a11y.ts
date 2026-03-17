import type { A11ySpec } from "../../schema/a11y.schema.js";

export const alertDialogA11y: A11ySpec = {
	roles: { trigger: undefined, overlay: undefined, content: "alertdialog", title: undefined, description: undefined, cancel: undefined, action: undefined },
	requiredAttrs: { trigger: ["aria-haspopup"], content: ["aria-modal", "aria-labelledby", "aria-describedby"] },
	keyboard: [
		{ key: "Escape", action: "close" },
		{ key: "Tab", action: "cycle-focus", condition: "focus trapped" },
	],
	focusStrategy: "trap",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/",
};
