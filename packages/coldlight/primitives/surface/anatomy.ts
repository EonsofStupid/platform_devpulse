import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Surface anatomy — universal semantic container.
 *
 * A surface is a polymorphic container element that renders as the
 * appropriate semantic HTML element (div, section, article, aside, main,
 * footer, header, nav). It's the foundation for cards, panels, widgets,
 * and any content region.
 *
 * When labeled (via aria-label or aria-labelledby), surfaces become
 * landmarks that screen readers can navigate to directly.
 */
export const surfaceAnatomy = createAnatomy("surface", {
	root: {
		description:
			"Universal semantic container. Renders as the element specified by the 'as' prop (div, section, article, etc.). When labeled, becomes a navigable landmark. Use role='group' for unlabeled groupings, role='region' for labeled sections.",
		element: ["div", "section", "article", "aside", "main", "footer", "header", "nav"],
		required: true,
		aria: {
			conditional: ["aria-label", "aria-labelledby", "role"],
		},
		accepts: ["any"],
	},
});
