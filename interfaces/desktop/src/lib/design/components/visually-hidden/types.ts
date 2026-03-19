/**
 * @file VisuallyHidden Component Types
 * @kind visually-hidden
 * @layer components
 *
 * Pure CSS utility component — renders content visually hidden but accessible
 * to screen readers. No builder, no transport, no primitive dependency.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

/** VisuallyHidden component props -- ColdLight 8-axis */
export interface VisuallyHiddenComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	/** Override the rendered element. @default "span" */
	as?: "span" | "div";
}
