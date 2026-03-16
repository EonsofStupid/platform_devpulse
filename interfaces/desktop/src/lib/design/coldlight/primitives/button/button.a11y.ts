import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Button accessibility specification — WAI-ARIA APG Button Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */
export const buttonA11y: A11ySpec = {
	roles: { root: "button" },
	requiredAttrs: {
		root: ["aria-disabled"],
	},
	keyboard: [
		{ key: "Space", action: "activate" },
		{ key: "Enter", action: "activate" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
};
