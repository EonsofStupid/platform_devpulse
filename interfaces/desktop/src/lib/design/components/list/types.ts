/**
 * @file List Component Types
 * @kind list
 * @layer components
 *
 * Extends primitive with ARIA label, list type, and sizing props.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ListSize = "sm" | "md" | "lg";
export type ListVariant = "none" | "disc" | "decimal";
export type ListSpacing = "compact" | "default" | "relaxed";
export type ListIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** List component props — ARIA + composition + ColdLight 8-axis */
export interface ListComponentProps
	extends Omit<HTMLAttributes<HTMLUListElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent preset */
	intent?: ListIntent;
	/** Size variant — controls font size */
	size?: ListSize;
	/** List marker style — controls list-style-type */
	variant?: ListVariant;
	/** Vertical spacing between items */
	spacing?: ListSpacing;
	/** Accessible label for the list */
	label?: string;
}
