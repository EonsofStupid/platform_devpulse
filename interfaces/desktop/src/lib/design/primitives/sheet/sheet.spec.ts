import { definePrimitive } from "../../schema/index.js";

export const sheetSpec = definePrimitive({
	kind: "sheet",
	label: "Sheet",
	description: "A panel that slides in from a screen edge, overlaying page content.",
	category: "overlay",
	behaviorHook: "useSheet",
	compound: true,
	a11y: {
		slots: {
			trigger: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-haspopup", "aria-expanded", "aria-controls"],
				description: "Button that opens the sheet",
			},
			overlay: {
				element: "div",
				role: null,
				decorative: true,
				ariaAttrs: [],
				description: "Backdrop overlay behind the sheet",
			},
			content: {
				element: "div",
				role: "dialog",
				ariaAttrs: ["aria-modal", "aria-labelledby", "aria-describedby"],
				description: "The sheet panel container that traps focus",
			},
			title: {
				element: "h2",
				role: null,
				ariaAttrs: [],
				description: "Sheet heading, referenced by aria-labelledby on content",
			},
			description: {
				element: "p",
				role: null,
				ariaAttrs: [],
				description: "Sheet description, referenced by aria-describedby on content",
			},
			close: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label"],
				description: "Button that closes the sheet",
			},
		},
		keyboard: [{ key: "Escape", action: "Close the sheet" }],
		focusStrategy: "trap",
	},
});
