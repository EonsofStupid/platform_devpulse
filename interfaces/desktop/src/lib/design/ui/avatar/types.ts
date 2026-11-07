/**
 * @file Avatar UI Types
 * @kind avatar
 * @layer ui
 *
 * Styled avatar — extends component (ARIA) with visual props.
 */

import type { AvatarComponentProps } from "$lib/design/components/avatar/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type AvatarSize = "sm" | "md" | "lg";

/** Avatar UI props — component (ARIA) + visual (ColdLight). */
export interface AvatarUIProps extends Omit<AvatarComponentProps, "imageClass" | "fallbackClass">, ColdLightProps {
	/** Size variant — structural sizing via recipe */
	size?: AvatarSize;
}
