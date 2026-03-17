import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Breadcrumbs accessibility — WAI-ARIA APG Breadcrumb Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */
export const breadcrumbsA11y: A11ySpec = {
	roles: { root: "navigation", list: undefined, item: undefined, link: undefined, separator: undefined },
	requiredAttrs: { root: ["aria-label"] },
	keyboard: [],
	focusStrategy: "none",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/",
};
