import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Search field accessibility — search landmark + searchbox role.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html
 */
export const searchFieldA11y: A11ySpec = {
	roles: { root: "search", input: "searchbox", icon: undefined, clear: undefined },
	requiredAttrs: { input: ["aria-label"] },
	keyboard: [{ key: "Escape", action: "clear", condition: "has value" }],
	focusStrategy: "direct",
};
