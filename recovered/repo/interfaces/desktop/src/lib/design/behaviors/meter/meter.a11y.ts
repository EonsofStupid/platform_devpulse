import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Meter accessibility specification — meter role.
 * Represents a scalar measurement within a known range (e.g., disk usage, password strength).
 * Unlike progressbar, meter is NOT for task completion.
 */
export const meterA11y: A11ySpec = {
	roles: { root: "meter", track: undefined, fill: undefined, label: undefined },
	requiredAttrs: {
		root: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
	},
	keyboard: [],
	focusStrategy: "none",
};
