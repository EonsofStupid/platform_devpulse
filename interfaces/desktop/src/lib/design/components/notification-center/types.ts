/**
 * @file NotificationCenter Component Types
 * @kind notification-center
 * @layer components
 *
 * Extends primitive with open/close state and accessible labelling.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

/** NotificationCenter component props — ARIA + recipe + primitive */
export interface NotificationCenterComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Whether the notification center panel is open */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}
