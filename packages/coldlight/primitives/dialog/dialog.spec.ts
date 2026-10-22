import { definePrimitive } from "../../schema/index.js";

export const dialogSpec = definePrimitive({
	kind: "dialog",
	label: "Dialog",
	description: "A modal window that overlays the page and requires user interaction.",
	category: "overlay",
	behaviorHook: "useDialog",
	compound: true,
	a11y: {
		slots: {
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-haspopup", "aria-expanded", "aria-controls"],
				description: "Button that opens the dialog",
			},
			overlay: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "Backdrop overlay behind the dialog content",
			},
			content: {
				element: "dialog",
				role: "dialog",
				ariaAttrs: ["aria-modal", "aria-labelledby", "aria-describedby"],
				description: "The dialog container that traps focus",
			},
			title: {
				element: "h2",
				role: null,
				ariaAttrs: [],
				description: "Dialog heading, referenced by aria-labelledby on content",
			},
			description: {
				element: "p",
				role: null,
				ariaAttrs: [],
				description: "Dialog description, referenced by aria-describedby on content",
			},
			close: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label"],
				description: "Button that closes the dialog",
			},
		},
		keyboard: [{ key: "Escape", action: "Close the dialog" }],
		focusStrategy: "trap",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
	},
});
