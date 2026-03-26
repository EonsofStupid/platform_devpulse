import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * ColorField accessibility specification.
 * Uses native text input with aria-label for hex/rgb color entry.
 */
export const colorFieldA11y: A11ySpec = {
	roles: { root: undefined, input: undefined, label: undefined, swatch: undefined },
	requiredAttrs: {
		input: ["aria-label"],
	},
	keyboard: [],
	focusStrategy: "direct",
};
