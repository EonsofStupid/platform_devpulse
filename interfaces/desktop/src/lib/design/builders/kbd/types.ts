/**
 * @file builders/kbd/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight Kbd builder.
 * Mirrors primitives/kbd/contract.ts -- role: "none", zero ARIA.
 * Semantic `<kbd>` element provides implicit keyboard shortcut meaning.
 */

/**
 * Constructor config for Kbd builder.
 *
 * Display-only primitive -- no builder-level props needed.
 * Semantic meaning comes from the native `<kbd>` element.
 */
export type KbdProps = {
	// Display-only primitive -- no builder-level props needed.
	// Semantic meaning comes from the native <kbd> element.
};
