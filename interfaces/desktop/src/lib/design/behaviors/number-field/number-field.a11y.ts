import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Number field accessibility — WAI-ARIA APG Spinbutton Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */
export const numberFieldA11y: A11ySpec = {
	roles: { root: "group", input: "spinbutton", increment: undefined, decrement: undefined },
	requiredAttrs: { input: ["aria-valuenow", "aria-valuemin", "aria-valuemax"] },
	keyboard: [
		{ key: "ArrowUp", action: "increment" },
		{ key: "ArrowDown", action: "decrement" },
		{ key: "Home", action: "set-min", condition: "min is finite" },
		{ key: "End", action: "set-max", condition: "max is finite" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
};
