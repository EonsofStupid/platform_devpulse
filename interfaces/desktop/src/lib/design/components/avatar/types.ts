/**
 * @file Avatar Component Types
 * @kind avatar
 * @layer components
 *
 * DUMB compound component. Image load state + fallback.
 * Visual treatment via class prop from caller.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

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
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class" | "dir"> {
	/** CSS classes — structural + visual from caller */
	class?: string;
	/** Children snippet */
	children?: Snippet;
	/** Override auto-generated IDs */
	ids?: Partial<AvatarIds>;
	/** Image source URL */
	src?: string;
	/** Alt text for the image. Required for accessibility. */
	alt: string;
	/** Fallback text when image fails (default: first letter of alt) */
	fallback?: string;
	/** Size in pixels. Default: 40. */
	size?: number;
	/** Callback when image load status changes */
	onStatusChange?: (details: AvatarStatusChangeDetails) => void;
	/** Whether over a colored background (adjusts border) */
	isOverBackground?: boolean;
	/** Text/writing direction */
	dir?: "ltr" | "rtl";
}

interface AvatarSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface AvatarImageProps extends AvatarSlotProps {}
export interface AvatarFallbackProps extends AvatarSlotProps {}
