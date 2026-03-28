import { definePrimitive } from "../../schema/index.js";

export const popoverSpec = definePrimitive({
	kind: "popover",
	label: "Popover",
	description: "A floating panel anchored to a trigger element for contextual content.",
	category: "overlay",
	behaviorHook: "usePopover",
	compound: true,
	a11y: {
		slots: {
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-haspopup", "aria-expanded", "aria-controls"],
				description: "Button that toggles the popover",
			},
			content: {
				element: "div",
				role: "dialog",
				ariaAttrs: ["aria-labelledby"],
				description: "The popover floating panel",
			},
			arrow: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "Visual arrow pointing from content to trigger",
			},
			close: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label"],
				description: "Button that closes the popover",
			},
		},
		keyboard: [{ key: "Escape", action: "Close the popover" }],
		focusStrategy: "trap",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
	},
});
