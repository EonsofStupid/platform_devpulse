import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Toggle accessibility specification — WAI-ARIA APG Button (Toggle) Pattern.
 * A toggle is a button with aria-pressed state.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */
export const toggleA11y: A11ySpec = {
	roles: { root: "button" },
	requiredAttrs: { root: ["aria-pressed", "aria-disabled"] },
	keyboard: [
		{ key: "Space", action: "toggle" },
		{ key: "Enter", action: "toggle" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
};
