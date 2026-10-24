import { definePrimitive } from "../../schema/index.js";

export const searchFieldSpec = definePrimitive({
	kind: "search-field",
	label: "Search Field",
	description:
		"A search landmark with searchbox input, decorative icon, and clear button with Escape-to-clear.",
	category: "form",
	behaviorHook: "useSearchField",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "search",
				ariaAttrs: ["aria-label"],
				description: "Search landmark container",
			},
			input: {
				element: "input",
				role: "searchbox",
				ariaAttrs: ["aria-label", "aria-describedby", "aria-disabled"],
				description: "Native search input element",
			},
			icon: {
				element: "span",
				role: null,
				decorative: true,
				container: false,
				ariaAttrs: [],
				description: "Decorative search icon, hidden from accessibility tree",
			},
			clear: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label", "aria-disabled"],
				description: "Button to clear the search input value",
			},
		},
		keyboard: [{ key: "Escape", action: "Clear input value and return focus to input" }],
		focusStrategy: "direct",
	},
});
