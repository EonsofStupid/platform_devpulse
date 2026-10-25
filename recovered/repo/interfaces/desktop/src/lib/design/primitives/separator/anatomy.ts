import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Separator anatomy — visual divider between content sections.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/separator/
 *
 * Two modes:
 * - Semantic: role="separator" with aria-orientation — announced by screen readers
 * - Decorative: role="none" — purely visual, invisible to assistive technology
 *
 * Keyboard: Not focusable (static separator). Focusable separators
 * (resizable splitters) are a different pattern — use slider instead.
 */
export const separatorAnatomy = createAnatomy("separator", {
	root: {
		description:
			"Visual divider between content sections. Use role='separator' with aria-orientation for meaningful divisions (e.g., between menu groups, form sections). Use role='none' for purely decorative lines that carry no structural meaning.",
		element: "div",
		required: true,
		aria: {
			role: "separator",
			conditional: ["aria-orientation"],
		},
		accepts: ["none"],
		stateAttrs: ["data-orientation"],
	},
});
