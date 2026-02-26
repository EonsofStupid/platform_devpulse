/**
 * @file builders/spacer/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Spacer builder.
 *
 * The Spacer builder provides a purely decorative spacing element that
 * is hidden from the accessibility tree. Props are intentionally minimal;
 * the Spacer is a self-closing decorative element with no children.
 */

/**
 * Constructor props for the {@link Spacer} builder.
 *
 * Currently empty — the Spacer builder requires no configuration.
 * Size and axis are handled at the primitive/component layer above
 * the builder.
 */
export type SpacerProps = {
	// Layout builder — minimal props.
	// Spacer is a self-closing decorative element.
};
