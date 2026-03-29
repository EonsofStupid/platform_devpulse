import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Skeleton anatomy — loading placeholder showing content shape.
 *
 * WAI-ARIA: Uses aria-hidden="true" — skeletons are decorative placeholders.
 * The loading state should be communicated separately via a live region.
 *
 * A skeleton renders a grey animated placeholder that mimics the shape
 * of the content being loaded. Used for perceived performance — shows
 * the user what the page will look like before data arrives.
 *
 * Keyboard: Not interactive.
 */
export const skeletonAnatomy = createAnatomy("skeleton", {
	root: {
		description:
			"Skeleton placeholder element. Purely decorative — aria-hidden='true'. Mimics the dimensions of the content being loaded. Animated with a shimmer/pulse effect.",
		element: "div",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
	},
});
