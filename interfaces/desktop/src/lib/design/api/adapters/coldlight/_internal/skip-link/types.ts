/**
 * @file builders/skip-link/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight SkipLink builder.
 *
 * Accessibility skip-to-content link -- visually hidden until focused.
 * WAI-ARIA: skip navigation pattern.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/** Constructor config for the {@link SkipLink} builder. */
export type SkipLinkProps = {
	/**
	 * Target element href to skip to (e.g. `"#main-content"`).
	 *
	 * Pass a getter for controlled (reactive) mode or a static value
	 * for uncontrolled mode.
	 *
	 * @default "#main-content"
	 */
	href?: MaybeGetter<string | undefined>;

	/**
	 * Visible label text shown when the link receives focus.
	 *
	 * Also used as the `aria-label` value.
	 *
	 * @default "Skip to main content"
	 */
	label?: MaybeGetter<string | undefined>;
};
