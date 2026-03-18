import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Checkbox accessibility specification — WAI-ARIA APG Checkbox Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */
export const checkboxA11y: A11ySpec = {
	roles: {
		root: "checkbox",
		indicator: undefined,
		label: undefined,
	},
	requiredAttrs: {
		root: ["aria-checked", "aria-disabled"],
	},
	keyboard: [{ key: "Space", action: "toggle" }],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
};
