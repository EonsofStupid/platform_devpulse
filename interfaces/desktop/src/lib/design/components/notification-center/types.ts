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
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** NotificationCenter component props — ColdLight 8-axis + ARIA + recipe + primitive */
export interface NotificationCenterComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Whether the notification center panel is open */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}
