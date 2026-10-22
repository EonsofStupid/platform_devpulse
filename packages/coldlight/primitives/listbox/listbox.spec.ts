import { definePrimitive } from "../../schema/index.js";

export const listboxSpec = definePrimitive({
	kind: "listbox",
	label: "Listbox",
	description: "A selectable list of options where one or more can be chosen.",
	category: "form",
	behaviorHook: "useListBox",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "listbox",
				ariaAttrs: [
					"aria-multiselectable",
					"aria-activedescendant",
					"aria-label",
					"aria-labelledby",
					"aria-disabled",
				],
				description: "Container declaring the listbox role with activedescendant focus",
			},
			option: {
				element: "div",
				role: "option",
				ariaAttrs: ["aria-selected", "aria-disabled"],
				description: "An individual selectable option within the listbox",
			},
			group: {
				element: "div",
				role: "group",
				ariaAttrs: ["aria-label"],
				description: "A labeled group of related options",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label for the listbox",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Highlight next option" },
			{ key: "ArrowUp", action: "Highlight previous option" },
			{ key: "Home", action: "Highlight first option" },
			{ key: "End", action: "Highlight last option" },
			{ key: "Enter", action: "Select highlighted option" },
			{ key: "Space", action: "Select highlighted option" },
		],
		focusStrategy: "activedescendant",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
	},
});
