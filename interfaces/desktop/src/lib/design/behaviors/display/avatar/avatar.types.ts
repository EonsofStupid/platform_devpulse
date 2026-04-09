import type { HTMLAttributes, HTMLImgAttributes } from "svelte/elements";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarImageStatus = "idle" | "loading" | "loaded" | "error";

export interface UseAvatarProps {
	/** Image src URL. When absent, fallback slot is shown. */
	src?: string;
	/** Accessible label for the avatar. Used as alt text and aria-label. */
	alt?: string;
	/** Visual size token. Defaults to "md". */
	size?: AvatarSize;
	/**
	 * Delay in ms before showing the fallback after image error.
	 * Prevents layout flash on slow connections. Defaults to 600.
	 */
	fallbackDelay?: number;
}

export type AvatarRootAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "avatar";
	"data-slot": "root";
	"data-size": AvatarSize;
	"data-status": AvatarImageStatus;
};

export type AvatarImageAttrs = HTMLImgAttributes & {
	"data-kind": "avatar";
	"data-slot": "image";
};

export type AvatarFallbackAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "avatar";
	"data-slot": "fallback";
};

export interface UseAvatarReturn {
	/** Current image load status. */
	readonly status: AvatarImageStatus;
	/** True when fallback should be rendered (no src, loading, or error + delay elapsed). */
	readonly showFallback: boolean;
	/** Spread onto the root <span> element. */
	readonly root: AvatarRootAttrs;
	/** Spread onto the <img> element. Only rendered when src is provided. */
	readonly image: AvatarImageAttrs;
	/** Spread onto the fallback <span> element. */
	readonly fallback: AvatarFallbackAttrs;
}
