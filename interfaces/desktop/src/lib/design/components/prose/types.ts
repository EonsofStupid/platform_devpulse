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
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ProseSize = "sm" | "base" | "lg";
export type ProseIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** Prose component props — rich text container + ColdLight 8-axis */
export interface ProseComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent preset */
	intent?: ProseIntent;
	/** Prose size variant */
	size?: ProseSize;
}
