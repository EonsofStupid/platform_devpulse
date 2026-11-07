/**
 * @file Input UI Types
 * @kind input
 * @layer ui
 *
 * Styled input — extends component (ARIA) with visual props.
 */

import type { InputComponentProps } from "$lib/design/components/input/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type InputSize = "sm" | "md" | "lg";

/** Input UI props — component (ARIA) + visual (ColdLight). */
export interface InputUIProps extends InputComponentProps, Omit<ColdLightProps, "size"> {
	/** Size variant — structural sizing via recipe */
	size?: InputSize;
}
