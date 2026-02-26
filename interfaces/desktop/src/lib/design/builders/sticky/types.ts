/**
 * @file builders/sticky/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Sticky builder.
 *
 * The Sticky builder provides a position-sticky wrapper with no ARIA
 * complexity. Props are intentionally minimal; sticky positioning
 * offsets and scroll boundaries are handled at the primitive/component layer.
 */

/**
 * Constructor props for the {@link Sticky} builder.
 *
 * Currently empty — the Sticky builder requires no configuration.
 * Sticky positioning offsets (top, bottom) and scroll boundary
 * configuration are handled at the primitive/component layer above the builder.
 */
export type StickyProps = {
	// Layout builder — minimal props.
	// Sticky positioning handled at primitive/component layer.
};
