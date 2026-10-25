import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Link anatomy — navigational anchor or action link.
 *
 * Links navigate to URLs or trigger actions. When used for navigation,
 * they render as `<a>` with `href`. When used as action triggers (no URL),
 * they render as `<span>` or `<div>` with `role="link"` and tabindex="0".
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/link/
 *
 * Keyboard: Enter activates. Tab for focus. Links do NOT activate on Space
 * (unlike buttons) — this is per ARIA APG specification.
 */
export const linkAnatomy = createAnatomy("link", {
	root: {
		description:
			"Navigational anchor or action link. Renders as <a> with href for navigation, or <span> with role='link' and tabindex='0' for action links. Use aria-current to indicate the current page/location in navigation contexts.",
		element: ["a", "span"],
		required: true,
		aria: {
			conditional: ["aria-disabled", "aria-label", "aria-current"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Enter"],
			focusable: true,
		},
	},
});
