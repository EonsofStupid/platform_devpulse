/**
 * @file builders/skeleton/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Skeleton builder.
 * Contract: `aria-busy="true"`, `aria-label` (defaults to "Loading").
 * Synced `<boolean>` for loading state.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Constructor config for Skeleton builder. */
export type SkeletonProps = {
	/**
	 * Whether the skeleton is in the loading state.
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default true
	 */
	loading?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the loading state changes.
	 */
	onLoadingChange?: (loading: boolean) => void;

	/**
	 * Accessible label for screen readers.
	 * Applied as `aria-label` on the root element.
	 *
	 * @default "Loading"
	 */
	"aria-label"?: MaybeGetter<string | undefined>;
};
