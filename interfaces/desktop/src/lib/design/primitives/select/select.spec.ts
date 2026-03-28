import { definePrimitive } from "../../schema/index.js";

export const selectSpec = definePrimitive({
	kind: "select",
	label: "Select",
	description: "A form control for choosing one option from a collapsed listbox.",
	category: "form",
	behaviorHook: "useSelect",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Wrapper element containing trigger and listbox",
			},
			trigger: {
				element: "button",
				role: "combobox",
				ariaAttrs: [
					"aria-haspopup",
					"aria-expanded",
					"aria-controls",
					"aria-activedescendant",
					"aria-labelledby",
				],
				description: "Button that displays the selected value and opens the listbox",
			},
			value: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Display of the currently selected value",
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
				description: "Accessible label for the select",
			},
		},
		keyboard: [
			{ key: "ArrowDown", action: "Open listbox or move to next option" },
			{ key: "ArrowUp", action: "Move to previous option" },
			{ key: "Enter", action: "Select the focused option and close listbox" },
			{ key: "Space", action: "Open listbox or select focused option" },
			{ key: "Escape", action: "Close the listbox" },
			{ key: "Home", action: "Move to first option" },
			{ key: "End", action: "Move to last option" },
		],
		focusStrategy: "activedescendant",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/select-only/",
	},
});
