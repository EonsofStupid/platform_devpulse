/**
 * @file Progress Recipe
 * @kind progress
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 * Progress has two parts: track (root) and indicator (inner bar).
 */

import type { ProgressSize } from "./types.js";

const trackBase = [
	"relative w-full overflow-hidden rounded-full",
	"bg-surface-muted",
	"border border-border-subtle",
].join(" ");

const indicatorBase = [
	"h-full rounded-full",
	"bg-teal-500",
	"transition-all duration-fast",
].join(" ");

const sizeStyles: Record<ProgressSize, string> = {
	sm: "h-1.5",
	md: "h-2.5",
	lg: "h-4",
};

export function progressTrackRecipe(opts: { size: ProgressSize }): string {
	return `${trackBase} ${sizeStyles[opts.size]}`;
}

export function progressIndicatorRecipe(): string {
	return indicatorBase;
}
