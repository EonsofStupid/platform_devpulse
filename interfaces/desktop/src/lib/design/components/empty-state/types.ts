/**
 * @file EmptyState Types
 * @kind empty-state
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type EmptyStateSize = "sm" | "md" | "lg";
export type EmptyStateIntent = "default" | "stark" | "glass" | "flat" | "matte";

export interface EmptyStateProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style intent preset */
	intent?: EmptyStateIntent;
	size?: EmptyStateSize;
}
