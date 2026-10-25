import type { A11ySpec } from "../../schema/a11y.schema.js";

export const tooltipA11y: A11ySpec = {
	roles: { trigger: undefined, content: "tooltip" },
	requiredAttrs: { trigger: ["aria-describedby"] },
	keyboard: [{ key: "Escape", action: "close" }],
	focusStrategy: "none",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",
};
