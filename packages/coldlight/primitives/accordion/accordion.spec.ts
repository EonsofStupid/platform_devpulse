import { definePrimitive } from "../../schema/index.js";

export const accordionSpec = definePrimitive({
	kind: "accordion",
	label: "Accordion",
	description:
		"A vertically stacked set of interactive headings that reveal or hide associated content.",
	category: "navigation",
	behaviorHook: "useAccordion",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Outer container for all accordion items",
			},
			item: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Container for a single trigger and content pair",
			},
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-expanded", "aria-controls", "aria-disabled"],
				description: "Button that toggles visibility of its associated content region",
			},
			content: {
				element: "div",
				role: "region",
				ariaAttrs: ["aria-labelledby"],
				description: "Collapsible content region associated with a trigger",
			},
		},
		keyboard: [
			{ key: "Space", action: "Toggle expanded state of focused section" },
			{ key: "Enter", action: "Toggle expanded state of focused section" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/",
	},
});
