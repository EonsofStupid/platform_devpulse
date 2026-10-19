import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Skeleton anatomy — loading placeholder showing content shape.
 *
 * WAI-ARIA: Uses aria-hidden="true" — skeletons are decorative placeholders.
 */
export const skeletonAnatomy = createAnatomy("skeleton", {
	root: {
		description:
			"Skeleton placeholder element. Purely decorative — aria-hidden='true'. Animated with a shimmer/pulse effect.",
		element: "div",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
	},
});
