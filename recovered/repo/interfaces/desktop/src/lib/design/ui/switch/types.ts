/**
 * @file Switch UI Types
 * @kind switch
 * @layer ui
 *
 * Styled switch — extends component (ARIA) with visual props.
 */

import type { SwitchComponentProps } from "$lib/design/components/switch/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type SwitchSize = "sm" | "md" | "lg";

/** Switch UI props — component (ARIA) + visual (ColdLight). */
export interface SwitchUIProps extends Omit<SwitchComponentProps, "thumbClass">, ColdLightProps {
	/** Size variant — structural sizing via recipe */
	size?: SwitchSize;
}
