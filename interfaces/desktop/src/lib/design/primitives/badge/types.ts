/**
 * @file Badge Primitive Types
 * @description Structural type declarations for the badge primitive.
 * Aligned to taxonomy contract: kind="badge"
 * Slots: root
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Badge root — inline status indicator */
export interface BadgeProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
