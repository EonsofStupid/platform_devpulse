import { definePrimitive } from "../../schema/index.js";

export const comboboxSpec = definePrimitive({
	kind: "combobox",
	label: "Combobox",
	description: "A text input combined with a listbox for selecting from filtered options.",
	category: "form",
	behaviorHook: "useComboBox",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Wrapper element containing input, trigger, and listbox",
			},
			input: {
				element: "input",
				role: "combobox",
				ariaAttrs: [
					"aria-expanded",
					"aria-controls",
					"aria-activedescendant",
					"aria-autocomplete",
					"aria-haspopup",
					"aria-labelledby",
				],
				description: "Text input for typing and filtering options",
			},
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label"],
				description: "Button that toggles the listbox open or closed",
			},
			listbox: {
				element: "div",
				role: "listbox",
				ariaAttrs: ["aria-labelledby"],
				description: "The dropdown list of available options",
			},
			option: {
				element: "div",
				role: "option",
				ariaAttrs: ["aria-selected", "aria-disabled"],
				description: "A single selectable option within the listbox",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label for the combobox",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Open listbox or move to next option" },
			{ key: "ArrowUp", action: "Move to previous option" },
			{ key: "Enter", action: "Select the focused option" },
			{ key: "Escape", action: "Close the listbox" },
			{ key: "Home", action: "Move to first option", condition: "When listbox is open" },
			{ key: "End", action: "Move to last option", condition: "When listbox is open" },
		],
		focusStrategy: "activedescendant",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
	},
});
