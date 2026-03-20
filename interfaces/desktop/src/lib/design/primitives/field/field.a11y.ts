import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Field accessibility specification — compound form field pattern.
 * Links label → control → description → error via ARIA attributes.
 */
export const fieldA11y: A11ySpec = {
	roles: {
		root: "group",
		label: undefined,
		control: undefined,
		description: undefined,
		error: "alert",
	},
	requiredAttrs: {
		root: ["aria-labelledby"],
		control: ["aria-describedby", "aria-invalid", "aria-required"],
	},
	keyboard: [],
	focusStrategy: "none",
};
