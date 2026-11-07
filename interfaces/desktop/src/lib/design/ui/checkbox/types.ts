/**
 * @file Checkbox UI Types
 * @kind checkbox
 * @layer ui
 *
 * Styled checkbox — extends component (ARIA) with visual props.
 */

import type { CheckboxComponentProps } from "$lib/design/components/checkbox/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type CheckboxIntent = "default";
export type CheckboxSize = "sm" | "md" | "lg";

/** Checkbox UI props — component (ARIA) + visual (ColdLight). */
export interface CheckboxUIProps extends CheckboxComponentProps, ColdLightProps {
	/** Visual intent */
	intent?: CheckboxIntent;
	/** Size variant — structural sizing via recipe */
	size?: CheckboxSize;
}
