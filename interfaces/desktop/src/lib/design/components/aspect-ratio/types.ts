/**
 * @file AspectRatio Component Types
 * @kind aspect-ratio
 * @layer components
 *
 * Fixed aspect ratio container for media and content.
 * Builder provides style attribute with aspect-ratio CSS.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type AspectRatioPreset = "square" | "video" | "portrait" | "wide" | "ultrawide";

/** AspectRatio component props — fixed ratio container + ColdLight 8-axis */
export interface AspectRatioComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		Omit<ColdLightProps, "preset"> {
	children?: Snippet;
	/** Numeric aspect ratio (width/height). Overrides preset. */
	ratio?: number;
	/** Named aspect ratio preset */
	preset?: AspectRatioPreset;
}
