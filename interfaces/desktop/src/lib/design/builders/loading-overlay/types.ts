/**
 * @file builders/loading-overlay/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the LoadingOverlay builder.
 * Contract: role="alert", aria-busy="true", aria-label.
 * Synced<boolean> for visible state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for LoadingOverlay builder. */
export type LoadingOverlayProps = {
	/** Whether the overlay is visible. Getter = controlled, static = uncontrolled. @default false */
	visible?: MaybeGetter<boolean | undefined>;
	/** Called when visible state changes. */
	onVisibleChange?: (visible: boolean) => void;
	/** Accessible label for the loading region. @default "Loading" */
	"aria-label"?: MaybeGetter<string | undefined>;
};
