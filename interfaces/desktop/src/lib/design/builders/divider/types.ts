/**
 * @file builders/divider/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Divider builder.
 * role="separator", aria-orientation.
 * Functionally identical to Separator — provided as an alias for developer ergonomics.
 * WAI-ARIA APG: separator role.
 */

import type { MaybeGetter, Orientation } from "../_internal/types.js";

/** Constructor config for Divider. MaybeGetter for controlled/uncontrolled. */
export type DividerProps = {
	/** Orientation of the divider. @default "horizontal" */
	orientation?: MaybeGetter<Orientation | undefined>;
	/**
	 * Whether the divider is purely decorative.
	 * When true, role="none" is applied instead of "separator".
	 * @default false
	 */
	decorative?: MaybeGetter<boolean | undefined>;
};
