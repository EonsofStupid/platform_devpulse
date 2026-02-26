/**
 * @file builders/skeleton/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Skeleton builder.
 * Contract: aria-busy="true", aria-label (defaults to "Loading").
 * Synced<boolean> for loading state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Skeleton builder. */
export type SkeletonProps = {
	/** Whether the skeleton is in loading state. Getter = controlled, static = uncontrolled. @default true */
	loading?: MaybeGetter<boolean | undefined>;
	/** Called when loading state changes. */
	onLoadingChange?: (loading: boolean) => void;
	/** Accessible label for screen readers. @default "Loading" */
	"aria-label"?: MaybeGetter<string | undefined>;
};
