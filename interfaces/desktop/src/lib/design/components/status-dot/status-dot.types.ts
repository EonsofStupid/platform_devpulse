/**
 * @file StatusDot Types
 * @kind status-dot
 * @render html
 * @category feedback
 */

import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type StatusDotStatus = "online" | "offline" | "loading" | "ready" | "failed" | "pending" | "hybrid";
export type StatusDotSize = "sm" | "md" | "lg";

export interface StatusDotProps extends ComponentProps {
	/** Health/presence state — maps to signal/text token colors */
	status?: StatusDotStatus;
	/** Dot diameter */
	size?: StatusDotSize;
	/** Pulse animation on the dot */
	animate?: boolean;
	/** Glow halo around the dot (uses status color) */
	glow?: boolean;
}
