/**
 * @file Prose Component Types
 * @kind prose
 * @layer components
 *
 * Rich text content container with prose styling.
 * Markdown-friendly — applies typographic styling to child HTML.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ProseSize = "sm" | "base" | "lg";

/** Prose component props — rich text container + ColdLight 8-axis */
export interface ProseComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		Omit<ColdLightProps, "size"> {
	children?: Snippet;
	/** Prose size variant */
	size?: ProseSize;
}
