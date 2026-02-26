/**
 * @file builders/center/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Center builder.
 *
 * The Center builder provides a centering layout container with no ARIA
 * complexity. Props are intentionally minimal; centering behavior is
 * handled at the primitive/component layer via CSS.
 */

/**
 * Constructor props for the {@link Center} builder.
 *
 * Currently empty — the Center builder requires no configuration.
 * Centering behavior and axis selection are handled at the
 * primitive/component layer above the builder.
 */
export type CenterProps = {
	// Layout builder — minimal props.
	// Centering behavior handled at primitive/component layer.
};
