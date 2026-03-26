import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Accordion accessibility — WAI-ARIA APG Accordion Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 */
export const accordionA11y: A11ySpec = {
	roles: { root: undefined, item: undefined, trigger: "button", content: "region" },
	requiredAttrs: {
		trigger: ["aria-expanded", "aria-controls"],
		content: ["aria-labelledby"],
	},
	keyboard: [
		{ key: "Space", action: "toggle" },
		{ key: "Enter", action: "toggle" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",
};
