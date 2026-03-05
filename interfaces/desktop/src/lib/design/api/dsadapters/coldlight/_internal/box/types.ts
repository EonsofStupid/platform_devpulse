/**
 * @file builders/box/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Box builder.
 *
 * The Box is the most fundamental layout container — a generic wrapper
 * with no ARIA complexity. Props are intentionally minimal; styling and
 * polymorphic `as` behavior are handled at the primitive/component layer.
 */

/**
 * Constructor props for the {@link Box} builder.
 *
 * Currently empty — the Box builder requires no configuration.
 * Styling, spacing, and polymorphic element selection are handled
 * at the primitive/component layer above the builder.
 */
export type BoxProps = {
	// Layout builder — minimal props.
	// Styling and polymorphic `as` handled at primitive/component layer.
};
