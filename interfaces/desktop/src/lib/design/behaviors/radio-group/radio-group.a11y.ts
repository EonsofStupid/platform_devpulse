import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * RadioGroup accessibility specification — WAI-ARIA APG Radio Group Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */
export const radioGroupA11y: A11ySpec = {
	roles: { root: "radiogroup", radio: "radio", label: undefined, description: undefined },
	requiredAttrs: {
		root: ["aria-label"],
		radio: ["aria-checked"],
	},
	keyboard: [
		{ key: "ArrowRight", action: "next-radio", condition: "horizontal" },
		{ key: "ArrowLeft", action: "prev-radio", condition: "horizontal" },
		{ key: "ArrowDown", action: "next-radio" },
		{ key: "ArrowUp", action: "prev-radio" },
		{ key: "Space", action: "select" },
	],
	focusStrategy: "roving",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",
};
