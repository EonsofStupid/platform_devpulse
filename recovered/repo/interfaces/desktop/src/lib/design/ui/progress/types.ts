/**
 * @file Progress UI Types
 * @kind progress
 * @layer ui
 *
 * Styled progress — extends component (ARIA) with visual props.
 */

import type { ProgressComponentProps } from "$lib/design/components/progress/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type ProgressSize = "sm" | "md" | "lg";

/** Progress UI props — component (ARIA) + visual (ColdLight). */
export interface ProgressUIProps extends Omit<ProgressComponentProps, "indicatorClass">, ColdLightProps {
	/** Size variant — structural sizing via recipe */
	size?: ProgressSize;
}
