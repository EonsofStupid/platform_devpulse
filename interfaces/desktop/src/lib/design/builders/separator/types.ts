/**
 * @file builders/separator/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Separator builder.
 * `role="separator"` with `aria-orientation`.
 * WAI-ARIA APG: separator role.
 */

import type { MaybeGetter, Orientation } from "../_internal/types.js";

/** Constructor config for Separator. MaybeGetter for controlled/uncontrolled. */
export type SeparatorProps = {
	/**
	 * Orientation of the separator.
	 * Maps to `aria-orientation` and `data-orientation` on the root element.
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<Orientation | undefined>;

	/**
	 * Whether the separator is purely decorative.
	 * When `true`, `role="none"` and `aria-hidden="true"` are applied
	 * instead of `role="separator"`.
	 *
	 * @default false
	 */
	decorative?: MaybeGetter<boolean | undefined>;
};
