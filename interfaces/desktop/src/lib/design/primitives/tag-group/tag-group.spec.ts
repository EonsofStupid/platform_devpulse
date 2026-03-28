import { definePrimitive } from "../../schema/index.js";

export const tagGroupSpec = definePrimitive({
	kind: "tag-group",
	label: "Tag Group",
	description: "A group of removable tags with keyboard navigation and deletion support.",
	category: "interactive",
	behaviorHook: "useTagGroup",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "grid",
				ariaAttrs: ["aria-label"],
				description: "Container declaring the grid role for the tag collection",
			},
			tag: {
				element: "div",
				role: "row",
				ariaAttrs: [],
				description: "An individual tag rendered as a grid row",
			},
			label: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Visible label for the tag group",
			},
			description: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Supplementary description for the tag group",
			},
			remove: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label", "aria-disabled"],
				description: "Button to remove an individual tag from the group",
			},
		},
		keyboard: [
			{ key: "ArrowRight", action: "Move to next tag" },
			{ key: "ArrowLeft", action: "Move to previous tag" },
			{ key: "Delete", action: "Remove focused tag" },
			{ key: "Backspace", action: "Remove focused tag" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
	},
});
