/**
 * @file DynamicBackground Types
 * @kind dynamic-background
 * @layer components
 */

import type { Snippet } from "svelte";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type BackgroundVariant =
	| "boot"
	| "devpulse"
	| "overmind"
	| "wiredfront"
	| "devforge"
	| "maestro";

export interface DynamicBackgroundProps extends UIBaseProps {
	/** Which domain/state background to show */
	variant?: BackgroundVariant;
	/** Optional background image URL (e.g. /imgs/backgrounds/maincontentbackground.png) */
	src?: string;
	/** Enable subtle animation (pulse, breathe) */
	animated?: boolean;
	/** Style preset identifier */
	style?: string;
	/** Content rendered on top of the background */
	children?: Snippet;
}
