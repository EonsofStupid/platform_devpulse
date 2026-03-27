/**
 * @file Avatar Types
 * @kind avatar
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type AvatarLoadStatus = "loading" | "loaded" | "error";
export type AvatarPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface AvatarStatusChangeDetails {
	status: AvatarLoadStatus;
}

export interface AvatarProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class"> {
	/** Image source URL */
	src?: string;
	/** Alt text for the image. Required for accessibility. */
	alt: string;
	/** Fallback text when image fails (default: first letter of alt) */
	fallback?: string;
	/** Size in pixels. Default: 40. */
	size?: number;
	/** Visual preset — selects the style preset */
	preset?: AvatarPreset;
	/** Callback when image load status changes */
	onStatusChange?: (details: AvatarStatusChangeDetails) => void;
}
