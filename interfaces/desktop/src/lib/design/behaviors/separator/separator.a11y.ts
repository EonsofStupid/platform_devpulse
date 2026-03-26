import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Separator accessibility specification — WAI-ARIA separator role.
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/separator_role
 */
export const separatorA11y: A11ySpec = {
	roles: { root: "separator" },
	requiredAttrs: { root: ["aria-orientation"] },
	keyboard: [],
	focusStrategy: "none",
};
