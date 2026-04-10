import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Spinner anatomy — loading indicator with ARIA live announcement.
 *
 * WAI-ARIA: role="status" with aria-live="polite" for non-blocking loading.
 */
export const spinnerAnatomy = createAnatomy("spinner", {
	root: {
		description:
			"Spinner container. Uses role='status' with aria-live='polite' to announce loading state.",
		element: "div",
		required: true,
		aria: {
			role: "status",
			required: ["aria-live"],
			conditional: ["aria-label", "aria-labelledby"],
		},
		accepts: ["structural"],
	},
	indicator: {
		description: "Visual spinning animation. Purely decorative — hidden from assistive technology.",
		element: "span",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
	label: {
		description: "Optional visible label text. When present, referenced by root's aria-labelledby.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
});
