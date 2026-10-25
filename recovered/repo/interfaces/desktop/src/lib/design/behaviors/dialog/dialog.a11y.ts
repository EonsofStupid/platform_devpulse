import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Dialog accessibility specification — WAI-ARIA APG Dialog (Modal) Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
export const dialogA11y: A11ySpec = {
	roles: {
		trigger: undefined,
		overlay: undefined,
		content: "dialog",
		title: undefined,
		description: undefined,
		close: undefined,
	},
	requiredAttrs: {
		trigger: ["aria-haspopup", "aria-expanded", "aria-controls"],
		content: ["aria-modal", "aria-labelledby", "aria-describedby"],
	},
	keyboard: [
		{ key: "Escape", action: "close", condition: "closeOnEscape enabled" },
		{ key: "Tab", action: "cycle-focus", condition: "focus trapped within content" },
		{ key: "Shift+Tab", action: "cycle-focus-reverse", condition: "focus trapped within content" },
	],
	focusStrategy: "trap",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
};
