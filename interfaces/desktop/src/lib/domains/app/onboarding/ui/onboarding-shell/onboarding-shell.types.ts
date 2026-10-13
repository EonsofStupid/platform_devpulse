/**
 * @file OnboardingShell types.
 * @module @devpulse/domains/app/onboarding/ui/onboarding-shell
 */

import type { Snippet } from "svelte";

export interface OnboardingShellProps {
	/** Looping background video (the shared main-content loop). */
	videoSrc?: string;
	/** "Step 1 of 2", already filled; omitted on screens without progress. */
	progress?: string;
	/** The stage's content. */
	children: Snippet;
	/** Buttons along the bottom. */
	actions?: Snippet;
}

/** The main-content loop every first-run stage shares. */
export const ONBOARDING_VIDEO = "/imgs/backgrounds/bganimation_loop.mp4";
