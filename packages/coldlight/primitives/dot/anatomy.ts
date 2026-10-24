import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Dot anatomy — colored circle status indicator.
 *
 * A dot is a small visual indicator communicating status (online/offline,
 * active/inactive, severity levels). Typically decorative — hidden from
 * assistive technology unless it conveys meaningful information.
 *
 * When the dot carries meaning (e.g., "user is online"), provide aria-label.
 * When purely decorative, use aria-hidden="true".
 */
export const dotAnatomy = createAnatomy("dot", {
	root: {
		description:
			"Colored circle indicator. Renders as a <span>. When decorative, use aria-hidden='true'. When meaningful (e.g., online status), provide aria-label describing the status.",
		element: "span",
		required: true,
		aria: {
			conditional: ["aria-hidden", "aria-label"],
		},
		accepts: ["none"],
	},
});
