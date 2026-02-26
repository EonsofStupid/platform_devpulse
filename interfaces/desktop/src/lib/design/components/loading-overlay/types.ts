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
import type { BaseProps } from "$lib/design/primitives/types.js";

/** LoadingOverlay component props — ARIA + recipe + primitive */
export interface LoadingOverlayComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Whether the overlay is visible */
	visible?: boolean;
	/** Called when visible state changes */
	onVisibleChange?: (visible: boolean) => void;
}
