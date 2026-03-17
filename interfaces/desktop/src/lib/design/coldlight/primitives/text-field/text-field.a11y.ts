import type { A11ySpec } from "../../schema/a11y.schema.js";

export const textFieldA11y: A11ySpec = {
	roles: { root: "group", input: undefined, label: undefined, description: undefined, error: "alert" },
	requiredAttrs: { input: ["aria-invalid", "aria-required", "aria-disabled", "aria-describedby"] },
	keyboard: [],
	focusStrategy: "direct",
};
