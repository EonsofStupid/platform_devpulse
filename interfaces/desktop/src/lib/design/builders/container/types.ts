/**
 * @file builders/container/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Container builder.
 *
 * The Container builder provides a max-width wrapper with no ARIA
 * complexity. Props are intentionally minimal; max-width values and
 * responsive breakpoints are handled at the primitive/component layer.
 */

/**
 * Constructor props for the {@link Container} builder.
 *
 * Currently empty — the Container builder requires no configuration.
 * Max-width and responsive breakpoints are handled at the
 * primitive/component layer above the builder.
 */
export type ContainerProps = {
	// Layout builder — minimal props.
	// Max-width and responsive breakpoints handled at primitive/component layer.
};
