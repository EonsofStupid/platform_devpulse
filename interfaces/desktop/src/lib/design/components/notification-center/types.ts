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
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type NotificationCenterIntent = "default" | "stark" | "glass" | "flat" | "matte";

/** NotificationCenter component props — ColdLight 8-axis + ARIA + composition + primitive */
export interface NotificationCenterComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent preset */
	intent?: NotificationCenterIntent;
	/** Whether the notification center panel is open */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}
