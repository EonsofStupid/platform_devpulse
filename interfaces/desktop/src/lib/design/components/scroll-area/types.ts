/**
 * @file ScrollArea Component Types
 * @kind scroll-area
 * @layer components
 *
 * Extends primitive with ARIA state props and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ScrollAreaSize = "sm" | "md" | "lg";
export type ScrollAreaOrientation = "horizontal" | "vertical";

/** ScrollArea component props — ARIA + composition + ColdLight 8-axis */
export interface ScrollAreaComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Size variant — controls scrollbar thumb size. @default "md" */
	size?: ScrollAreaSize;
	/** Orientation of the scrollbar. @default "vertical" */
	orientation?: ScrollAreaOrientation;
	/** Accessible label for the scroll region. */
	label?: string;
}
