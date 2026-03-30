/**
 * @file Toolbar Component Types
 * @kind toolbar
 * @layer components
 *
 * Extends ToolbarPrimitiveProps with visual preset, sizing, and ARIA state.
 */

import type { ToolbarPrimitiveProps } from "$lib/design/primitives/toolbar/index.js";

export type ToolbarSize = "sm" | "md" | "lg";

export type ToolbarPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type ToolbarOrientation = "horizontal" | "vertical";

/** Toolbar component props — primitive + ColdLight visual */
export interface ToolbarComponentProps extends ToolbarPrimitiveProps {
	/** Size variant */
	size?: ToolbarSize;
	/** Accessible label for the toolbar */
	label?: string;
	/** Disable the entire toolbar. @default false */
	disabled?: boolean;
	/** Whether arrow keys loop. @default true */
	loop?: boolean;
	/** Style preset. Default: "default". */
	preset?: ToolbarPreset;
}
