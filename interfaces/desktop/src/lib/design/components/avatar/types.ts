/**
 * @file Avatar Component Types
 * @kind avatar
 * @layer components
 *
 * Thumbnail representation of user/entity.
 * Compound: Root, Image, Fallback.
 * Image load state tracking with fallback display.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

export type AvatarLoadStatus = "loading" | "loaded" | "error";

export interface AvatarStatusChangeDetails {
	status: AvatarLoadStatus;
}

export interface AvatarIds {
	root?: string;
	image?: string;
	fallback?: string;
}

export interface AvatarRootProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class" | "dir">,
		Omit<PreparedComponentProps, "size"> {
	ids?: Partial<AvatarIds>;
	/** Image source URL. */
	src?: string;
	/** Alt text for the image. Required for accessibility. */
	alt: string;
	/** Fallback text when image fails (default: first letter of alt). */
	fallback?: string;
	/** Size in pixels. Default: 40. */
	size?: number;
	/** Callback when image load status changes. */
	onStatusChange?: (details: AvatarStatusChangeDetails) => void;
	/** Whether over a colored background (adjusts border). */
	isOverBackground?: boolean;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

interface AvatarSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface AvatarImageProps extends AvatarSlotProps {}
export interface AvatarFallbackProps extends AvatarSlotProps {}
