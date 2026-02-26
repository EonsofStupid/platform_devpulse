/**
 * @file builders/loading-overlay/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight LoadingOverlay builder.
 *
 * Contract: `role="alert"`, `aria-busy="true"`, `aria-label`.
 * Synced<boolean> for visible state.
 */

import type { MaybeGetter } from "../../../../../builders/_internal/types.js";

/** Constructor config for the {@link LoadingOverlay} builder. */
export type LoadingOverlayProps = {
	/**
	 * Whether the overlay is visible.
	 *
	 * Pass a getter for controlled (reactive) mode or a static value
	 * for uncontrolled mode.
	 *
	 * @default false
	 */
	visible?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the visible state changes.
	 *
	 * Fires on programmatic `show()` / `hide()` calls.
	 */
	onVisibleChange?: (visible: boolean) => void;

	/**
	 * Accessible label for the loading region.
	 *
	 * Applied as `aria-label` on the root element.
	 *
	 * @default "Loading"
	 */
	"aria-label"?: MaybeGetter<string | undefined>;
};
