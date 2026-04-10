import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Sidebar anatomy — collapsible side navigation panel.
 *
 * WAI-ARIA: Uses <nav> landmark with aria-label to distinguish from other nav landmarks.
 */
export const sidebarAnatomy = createAnatomy("sidebar", {
	root: {
		description:
			"Sidebar container. Uses <nav> or <aside> with aria-label. Tracks expanded/collapsed/hidden state.",
		element: ["nav", "aside"],
		required: true,
		aria: { conditional: ["aria-label", "aria-labelledby"] },
		accepts: ["structural"],
		stateAttrs: ["data-state", "data-collapsible"],
	},
	header: {
		description: "Sidebar header area — logo, app name, or collapse toggle.",
		element: "div",
		required: false,
		accepts: ["any"],
	},
	content: {
		description: "Scrollable content area containing navigation items, groups, and sections.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	footer: {
		description: "Sidebar footer — user menu, settings link, collapse button.",
		element: "div",
		required: false,
		accepts: ["any"],
	},
	toggle: {
		description: "Collapse/expand toggle button. Must have aria-label describing the action.",
		element: "button",
		required: false,
		aria: { role: "button", required: ["aria-label"], conditional: ["aria-expanded"] },
		accepts: ["media"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
	},
});
