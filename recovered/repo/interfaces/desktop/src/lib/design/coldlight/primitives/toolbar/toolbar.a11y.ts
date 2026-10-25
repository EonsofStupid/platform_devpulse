import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Toolbar accessibility — WAI-ARIA APG Toolbar Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */
export const toolbarA11y: A11ySpec = {
	roles: { root: "toolbar", item: undefined },
	requiredAttrs: { root: ["aria-orientation", "aria-label"] },
	keyboard: [
		{ key: "ArrowRight", action: "next-item", condition: "horizontal" },
		{ key: "ArrowLeft", action: "prev-item", condition: "horizontal" },
		{ key: "ArrowDown", action: "next-item", condition: "vertical" },
		{ key: "ArrowUp", action: "prev-item", condition: "vertical" },
		{ key: "Home", action: "first-item" },
		{ key: "End", action: "last-item" },
	],
	focusStrategy: "roving",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",
};
