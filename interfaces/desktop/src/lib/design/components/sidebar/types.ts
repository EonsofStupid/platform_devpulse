/**
 * @file Sidebar Component Types
 * @kind sidebar
 * @layer components
 *
 * Extends SidebarPrimitiveProps with visual preset, sizing, and expand/collapse state.
 */

import type { Snippet } from "svelte";
import type { SidebarPrimitiveProps } from "$lib/design/behaviors/navigation/sidebar/index.js";

export type SidebarSize = "sm" | "md" | "lg";

export type SidebarPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Sidebar component props — primitive + ColdLight visual */
export interface SidebarComponentProps extends Omit<SidebarPrimitiveProps, "onStateChange"> {
	/** Header content snippet */
	header?: Snippet;
	/** Footer content snippet */
	footer?: Snippet;
	/** Size variant — controls width when expanded. @default "md" */
	size?: SidebarSize;
	/** Whether the sidebar is expanded. @default true */
	expanded?: boolean;
	/** Called when expanded state changes. */
	onExpandedChange?: (expanded: boolean) => void;
	/** Accessible label for the sidebar navigation. */
	label?: string;
	/** Style preset. Default: "default". */
	preset?: SidebarPreset;
}
