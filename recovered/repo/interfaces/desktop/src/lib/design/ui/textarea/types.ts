/**
 * @file Textarea UI Types
 * @kind textarea
 * @layer ui
 *
 * Styled textarea — extends component (ARIA) with visual props.
 */

import type { TextareaComponentProps } from "$lib/design/components/textarea/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type TextareaSize = "sm" | "md" | "lg";

/** Textarea UI props — component (ARIA) + visual (ColdLight). */
export interface TextareaUIProps extends TextareaComponentProps, Omit<ColdLightProps, "size"> {
	/** Size variant — structural sizing via recipe */
	size?: TextareaSize;
}
