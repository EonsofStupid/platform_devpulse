import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Icon slot anatomy — constrained container for icon content.
 *
 * An icon slot provides consistent sizing for icon content within
 * components. Always decorative — hidden from assistive technology.
 * When an icon carries meaning, the PARENT element should have aria-label,
 * not the icon slot itself.
 */
export const iconSlotAnatomy = createAnatomy("icon-slot", {
	root: {
		description:
			"Icon container that constrains icon sizing. Always aria-hidden='true' because icons are decorative. Meaningful icons get their accessible name from the parent element's aria-label.",
		element: "span",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
});
