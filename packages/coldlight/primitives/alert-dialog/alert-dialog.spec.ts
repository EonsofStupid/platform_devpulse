import { definePrimitive } from "../../schema/index.js";

export const alertDialogSpec = definePrimitive({
	kind: "alert-dialog",
	label: "Alert Dialog",
	description: "A modal dialog for critical confirmations requiring explicit user action.",
	category: "overlay",
	behaviorHook: "useAlertDialog",
	compound: true,
	a11y: {
		slots: {
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-haspopup", "aria-expanded", "aria-controls"],
				description: "Button that opens the alert dialog",
			},
			overlay: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "Backdrop overlay behind the alert dialog",
			},
			content: {
				element: "dialog",
				role: "alertdialog",
				ariaAttrs: ["aria-modal", "aria-labelledby", "aria-describedby"],
				description: "The alert dialog container that traps focus",
			},
			title: {
				element: "h2",
				role: null,
				ariaAttrs: [],
				description: "Alert dialog heading, referenced by aria-labelledby on content",
			},
			description: {
				element: "p",
				role: null,
				ariaAttrs: [],
				description: "Alert dialog description, referenced by aria-describedby on content",
			},
			cancel: {
				element: "button",
				role: null,
				ariaAttrs: [],
				description: "Button that cancels and closes the alert dialog",
			},
			action: {
				element: "button",
				role: null,
				ariaAttrs: [],
				description: "Button that confirms the destructive or critical action",
			},
		},
		keyboard: [{ key: "Escape", action: "Close the alert dialog", condition: "When dismissible" }],
		focusStrategy: "trap",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/",
	},
});
