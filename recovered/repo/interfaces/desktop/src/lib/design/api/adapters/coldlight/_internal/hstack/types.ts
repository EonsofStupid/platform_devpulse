/**
 * @file builders/hstack/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight HStack builder.
 *
 * The HStack builder provides a horizontal flex shorthand with no ARIA
 * complexity. Props are intentionally minimal; gap is tokenized via
 * the SD5 space scale at the primitive/component layer.
 */

/**
 * Constructor props for the {@link HStack} builder.
 *
 * Currently empty — the HStack builder requires no configuration.
 * Gap tokenization via SD5 space scale is handled at the
 * primitive/component layer above the builder.
 */
export type HStackProps = {
	// Layout builder — minimal props.
	// Gap tokenized via SD5 space scale at primitive/component layer.
};
