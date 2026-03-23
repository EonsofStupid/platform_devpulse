/**
 * @file StatusDot Types
 * @kind status-dot
 */

import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type StatusDotStatus = "online" | "offline" | "loading" | "ready" | "failed" | "pending" | "hybrid";
export type StatusDotSize = "sm" | "md" | "lg";

export interface StatusDotProps extends ComponentProps {
	status?: StatusDotStatus;
	size?: StatusDotSize;
	animate?: boolean;
}
