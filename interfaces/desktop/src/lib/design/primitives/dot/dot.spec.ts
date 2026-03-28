import { definePrimitive } from "../../schema/index.js";

export const dotSpec = definePrimitive({
	kind: "dot",
	label: "Dot",
	description: "A decorative status indicator span, hidden from the accessibility tree.",
	category: "display",
	behaviorHook: null,
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "span",
				role: null,
				ariaAttrs: ["aria-hidden"],
				decorative: true,
				container: false,
				description: "Decorative dot indicator, not exposed to assistive technology",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
