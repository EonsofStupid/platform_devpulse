import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Link accessibility specification — WAI-ARIA APG Link Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/link/
 */
export const linkA11y: A11ySpec = {
	roles: { root: "link" },
	requiredAttrs: { root: [] },
	keyboard: [
		{ key: "Enter", action: "activate" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/link/",
};
