import type { A11ySpec } from "../../schema/a11y.schema.js";

export const popoverA11y: A11ySpec = {
	roles: { trigger: undefined, content: "dialog", arrow: undefined, close: undefined },
	requiredAttrs: { trigger: ["aria-expanded", "aria-haspopup", "aria-controls"] },
	keyboard: [{ key: "Escape", action: "close" }],
	focusStrategy: "direct",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
};
