/**
 * @file LoadingOverlay Component Types
 * @kind loading-overlay
 * @layer components
 *
 * Extends primitive with visible state and accessible label.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type LoadingOverlayPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** LoadingOverlay component props — ColdLight 8-axis + ARIA + composition + primitive */
export interface LoadingOverlayComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style preset preset */
	preset?: LoadingOverlayPreset;
	/** Whether the overlay is visible */
	visible?: boolean;
	/** Called when visible state changes */
	onVisibleChange?: (visible: boolean) => void;
}
