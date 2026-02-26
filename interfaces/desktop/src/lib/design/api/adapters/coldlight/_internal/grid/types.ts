/**
 * @file builders/grid/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Grid builder.
 *
 * The Grid builder provides a CSS Grid layout container with no ARIA
 * complexity. Props are intentionally minimal; columns, rows, and gap
 * are handled at the primitive/component layer.
 */

/**
 * Constructor props for the {@link Grid} builder.
 *
 * Currently empty — the Grid builder requires no configuration.
 * Columns, rows, gap, and template areas are handled at the
 * primitive/component layer above the builder.
 */
export type GridProps = {
	// Layout builder — minimal props.
	// columns/rows/gap handled at primitive/component layer.
};
