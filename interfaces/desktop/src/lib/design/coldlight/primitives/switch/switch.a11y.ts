import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Switch accessibility specification — WAI-ARIA APG Switch Pattern.
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */
export const switchA11y: A11ySpec = {
	roles: { root: "switch", thumb: undefined, label: undefined },
	requiredAttrs: { root: ["aria-checked", "aria-disabled"] },
	keyboard: [
		{ key: "Space", action: "toggle" },
		{ key: "Enter", action: "toggle" },
	],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/switch/",
};
