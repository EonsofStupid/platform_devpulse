import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Spinner anatomy — loading indicator with ARIA live announcement.
 *
 * WAI-ARIA: role="status" with aria-live="polite" for non-blocking loading,
 * or role="alert" with aria-live="assertive" for critical loading states.
 *
 * A spinner indicates that content is loading. It MUST have an accessible
 * label — either via aria-label or a visible label slot. Screen readers
 * announce the loading state via the live region.
 *
 * Keyboard: Not interactive.
 */
export const spinnerAnatomy = createAnatomy("spinner", {
	root: {
		description:
			"Spinner container. Uses role='status' with aria-live='polite' to announce loading state to screen readers. Must have aria-label (e.g., 'Loading') or a visible label.",
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
		description:
			"Visual spinning animation. Purely decorative — hidden from assistive technology. The accessible name comes from the root's aria-label.",
		element: "span",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
	label: {
		description:
			"Optional visible label text (e.g., 'Loading...', 'Saving...'). When present, referenced by root's aria-labelledby. When absent, root MUST have aria-label.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
});
