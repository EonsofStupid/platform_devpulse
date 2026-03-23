/**
 * @file Toolbar Component Types
 * @kind toolbar
 * @layer components
 *
 * Extends primitive with ARIA state props, visual intent, and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type ToolbarSize = "sm" | "md" | "lg";
export type ToolbarOrientation = "horizontal" | "vertical";

/** Toolbar component props — ColdLight 8-axis + ARIA + composition */
export interface ToolbarComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Size variant */
	size?: ToolbarSize;
	/** Orientation for keyboard navigation. @default "horizontal" */
	orientation?: ToolbarOrientation;
	/** Accessible label for the toolbar */
	label?: string;
	/** Disable the entire toolbar. @default false */
	disabled?: boolean;
	/** Whether arrow keys loop. @default true */
	loop?: boolean;
}
