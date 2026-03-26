import type { A11ySpec } from "../../schema/a11y.schema.js";

/**
 * Progress accessibility specification — progressbar role.
 * Uses aria-live region for screen reader announcements on value changes.
 */
export const progressA11y: A11ySpec = {
	roles: { root: "progressbar", track: undefined, fill: undefined, label: undefined },
	requiredAttrs: {
		root: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
	},
	keyboard: [],
	focusStrategy: "none",
};
