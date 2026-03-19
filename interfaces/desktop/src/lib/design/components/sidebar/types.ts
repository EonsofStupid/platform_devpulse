/**
 * @file Sidebar Component Types
 * @kind sidebar
 * @layer components
 *
 * Extends primitive with ARIA state props, expand/collapse, and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SidebarSize = "sm" | "md" | "lg";

/** Sidebar component props — ARIA + recipe + ColdLight 8-axis */
export interface SidebarComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
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
}
