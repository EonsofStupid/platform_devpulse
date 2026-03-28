import { definePrimitive } from "../../schema/index.js";

export const iconSlotSpec = definePrimitive({
	kind: "icon-slot",
	label: "Icon Slot",
	description: "A decorative icon container span, hidden from the accessibility tree.",
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
				container: true,
				description: "Decorative icon wrapper, not exposed to assistive technology",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});
