/**
 * @file Toggle UI Types
 * @kind toggle
 * @layer ui
 *
 * Styled toggle — extends component (ARIA) with visual props.
 */

import type { ToggleComponentProps } from "$lib/design/components/toggle/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type ToggleSize = "sm" | "md" | "lg";

/** Toggle UI props — component (ARIA) + visual (ColdLight). */
export interface ToggleUIProps extends ToggleComponentProps, ColdLightProps {
	/** Size variant — structural sizing via recipe */
	size?: ToggleSize;
}
