/**
 * @file builders/stack/types.ts
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Stack builder.
 *
 * The Stack builder provides a vertical flex shorthand with no ARIA
 * complexity. Props are intentionally minimal; gap is tokenized via
 * the SD5 space scale at the primitive/component layer.
 */

/**
 * Constructor props for the {@link Stack} builder.
 *
 * Currently empty — the Stack builder requires no configuration.
 * Gap tokenization via SD5 space scale is handled at the
 * primitive/component layer above the builder.
 */
export type StackProps = {
	// Layout builder — minimal props.
	// Gap tokenized via SD5 space scale at primitive/component layer.
};
