import { definePrimitive } from "../../schema/index.js";

export const colorFieldSpec = definePrimitive({
	kind: "color-field",
	label: "Color Field",
	description: "A text input for hex color entry with a swatch preview and validation.",
	category: "form",
	behaviorHook: "useColorField",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Structural wrapper for the color field",
			},
			input: {
				element: "input",
				role: null,
				ariaAttrs: ["aria-label", "aria-labelledby", "aria-invalid", "aria-disabled"],
				description: "Text input for hex color value entry",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label linked to the input via for attribute",
			},
			swatch: {
				element: "span",
				role: null,
				decorative: true,
				container: false,
				ariaAttrs: [],
				description: "Color swatch preview, hidden from accessibility tree",
			},
		},
		keyboard: [],
		focusStrategy: "direct",
	},
});
