import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Tabs accessibility specification — WAI-ARIA APG Tabs Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
export const tabsA11y: A11ySpec = {
	roles: { root: undefined, list: "tablist", trigger: "tab", content: "tabpanel" },
	requiredAttrs: {
		list: ["aria-orientation"],
		trigger: ["aria-selected", "aria-controls"],
		content: ["aria-labelledby"],
	},
	keyboard: [
		{ key: "ArrowRight", action: "next-tab", condition: "horizontal" },
		{ key: "ArrowLeft", action: "prev-tab", condition: "horizontal" },
		{ key: "ArrowDown", action: "next-tab", condition: "vertical" },
		{ key: "ArrowUp", action: "prev-tab", condition: "vertical" },
		{ key: "Home", action: "first-tab" },
		{ key: "End", action: "last-tab" },
	],
	focusStrategy: "roving",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
};
