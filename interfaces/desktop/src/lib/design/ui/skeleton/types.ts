/**
 * @file Skeleton UI Types
 * @kind skeleton
 * @layer ui
 *
 * Styled skeleton — extends component (ARIA) with visual props.
 * This is the PUBLIC API. Users import from ui/skeleton/.
 */

import type { SkeletonComponentProps } from "$lib/design/components/skeleton/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type SkeletonVariant = "text" | "circular" | "rectangular";

/** Skeleton UI props — component (ARIA) + visual (ColdLight). */
export interface SkeletonUIProps extends SkeletonComponentProps, ColdLightProps {
	/** Shape variant — drives border-radius via recipe */
	variant?: SkeletonVariant;
}
