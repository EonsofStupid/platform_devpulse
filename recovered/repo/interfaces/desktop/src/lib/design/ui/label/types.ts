/**
 * @file Label UI Types
 * @kind label
 * @layer ui
 *
 * Styled label — extends component (ARIA) with visual props.
 */

import type { LabelComponentProps } from "$lib/design/components/label/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type LabelSize = "sm" | "md" | "lg";

/** Label UI props — component (ARIA) + visual (ColdLight). */
export interface LabelUIProps extends LabelComponentProps, ColdLightProps {
	/** Size variant — structural sizing via recipe */
	size?: LabelSize;
}
