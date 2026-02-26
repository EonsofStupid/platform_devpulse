/**
 * @file ScrollArea Recipe
 * @kind scroll-area
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { ScrollAreaSize, ScrollAreaOrientation } from "./types.js";

const rootBase = [
	"relative overflow-hidden",
].join(" ");

const viewportBase = [
	"h-full w-full rounded-[inherit]",
].join(" ");

const scrollbarBase = [
	"flex touch-none select-none transition-colors",
].join(" ");

const thumbBase = [
	"relative flex-1 rounded-full",
	"bg-border-subtle",
	"hover:bg-border-focus",
	"transition-colors",
].join(" ");

const sizeStyles: Record<ScrollAreaSize, { scrollbar: string; thumb: string }> = {
	sm: { scrollbar: "p-px", thumb: "" },
	md: { scrollbar: "p-0.5", thumb: "" },
	lg: { scrollbar: "p-1", thumb: "" },
};

const orientationScrollbar: Record<ScrollAreaOrientation, string> = {
	vertical: "h-full w-2.5 border-l border-l-transparent",
	horizontal: "h-2.5 flex-col border-t border-t-transparent",
};

export function scrollAreaRecipe(opts: {
	size: ScrollAreaSize;
}): string {
	return rootBase;
}

export function scrollAreaViewportRecipe(): string {
	return viewportBase;
}

export function scrollAreaScrollbarRecipe(opts: {
	size: ScrollAreaSize;
	orientation: ScrollAreaOrientation;
}): string {
	return `${scrollbarBase} ${orientationScrollbar[opts.orientation]} ${sizeStyles[opts.size].scrollbar}`;
}

export function scrollAreaThumbRecipe(): string {
	return thumbBase;
}
