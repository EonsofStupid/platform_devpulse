import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Empty state anatomy — placeholder when no data or content exists.
 *
 * An empty state communicates that a section has no content and guides
 * the user toward an action. Used for empty lists, search results,
 * first-run experiences, and error recovery.
 *
 * Keyboard:
 * - Tab: focus on action button (if present)
 * - Enter/Space: activate action
 */
export const emptyStateAnatomy = createAnatomy("empty-state", {
	root: {
		description:
			"Empty state container. Centers content vertically and horizontally. Communicates that no data exists and optionally provides a call to action.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	icon: {
		description:
			"Illustrative icon or graphic. Purely decorative — hidden from assistive technology. Sets the visual tone (empty box, search, error, etc.).",
		element: "div",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
	title: {
		description:
			"Brief heading explaining the empty state (e.g., 'No results found', 'No projects yet').",
		element: ["h2", "h3", "h4"],
		required: true,
		accepts: ["text"],
	},
	description: {
		description:
			"Additional context or guidance (e.g., 'Try adjusting your filters', 'Create your first project to get started').",
		element: "p",
		required: false,
		accepts: ["text"],
	},
	action: {
		description:
			"Primary call-to-action button (e.g., 'Create project', 'Clear filters', 'Try again').",
		element: "button",
		required: false,
		accepts: ["text", "media"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});
