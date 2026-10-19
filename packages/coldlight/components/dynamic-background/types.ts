/**
 * @file DynamicBackground Types
 * @kind dynamic-background
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export type BackgroundVariant =
	| "boot"
	| "primary"
	| "devpulse"
	| "overmind"
	| "wiredfront"
	| "devforge"
	| "clyffy";

export interface DynamicBackgroundProps extends UIBaseProps {
	/** Which semantic / domain background to show */
	variant?: BackgroundVariant;
	/** Optional still-image URL (CSS background-image). For looping video, use videoSrc instead. */
	src?: string;
	/** Optional looping video URL (e.g. /imgs/backgrounds/bganimation_loop.mp4).
	 *  Renders a real <video autoplay muted loop playsinline> layer above src
	 *  and below the tint overlay. When present, the tint overlay dims so video shows through. */
	videoSrc?: string;
	/** Enable subtle animation (pulse, breathe) on still-image layer */
	animated?: boolean;
	/** Style preset identifier */
	style?: string;
	/** Content rendered on top of the background */
	children?: Snippet;
}
