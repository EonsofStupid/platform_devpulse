import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Divider accessibility specification.
 *
 * A divider is a visual separator with the ARIA separator role.
 * It follows the same pattern as useSeparator — a non-focusable,
 * decorative divider between content sections.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/separator_role
 */
export const dividerA11y: A11ySpec = {
	roles: { root: "separator" },
	requiredAttrs: { root: ["aria-orientation"] },
	keyboard: [],
	focusStrategy: "none",
};
