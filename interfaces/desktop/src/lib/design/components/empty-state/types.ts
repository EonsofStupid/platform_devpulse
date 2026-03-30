/**
 * @file EmptyState Types
 * @kind empty-state
 * @layer components
 */

import type { EmptyStatePrimitiveProps } from "$lib/design/primitives/empty-state/index.js";

export type EmptyStateSize = "sm" | "md" | "lg";
export type EmptyStatePreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface EmptyStateProps extends EmptyStatePrimitiveProps {
	/** Style preset */
	preset?: EmptyStatePreset;
	size?: EmptyStateSize;
}
