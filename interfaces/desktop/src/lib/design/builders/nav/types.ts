/**
 * @file builders/nav/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Nav builder.
 * WAI-ARIA: navigation landmark.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Constructor config for the Nav builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type NavProps = {
	/**
	 * Accessible label for the navigation landmark.
	 * Sets `aria-label` on the root `<nav>` element.
	 * Use this to distinguish multiple navigation regions on a page.
	 * Getter = controlled, static = uncontrolled.
	 * @default ""
	 */
	label?: MaybeGetter<string | undefined>;
};
