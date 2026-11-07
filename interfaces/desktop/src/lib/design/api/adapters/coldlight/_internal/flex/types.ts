/**
 * @file builders/flex/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Flex builder.
 *
 * The Flex builder provides a flexbox layout container with no ARIA
 * complexity. Props are intentionally minimal; gap, alignment, and
 * justification are handled at the primitive/component layer.
 */

/**
 * Constructor props for the {@link Flex} builder.
 *
 * Currently empty — the Flex builder requires no configuration.
 * Gap, align, justify, direction, and wrap are handled at the
 * primitive/component layer above the builder.
 */
export type FlexProps = {
	// Layout builder — minimal props.
	// gap/align/justify handled at primitive/component layer.
};
