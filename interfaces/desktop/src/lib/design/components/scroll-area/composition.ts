/**
 * @file ScrollArea Composition — Shortcode Composition
 * @kind scroll-area
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in composition output.
 *
 * Structural classes (scroll-area-*) handle all layout/positioning.
 * Orientation is handled via data-orientation attribute in CSS.
 */

type ScrollAreaRecipeProps = { size?: string };
type ScrollbarRecipeProps = { size?: string; orientation?: string };

export function scrollAreaComposition(_props: ScrollAreaRecipeProps = {}): string {
	return "scroll-area-root";
}

export function scrollAreaScrollbarComposition(_props: ScrollbarRecipeProps = {}): string {
	return "scroll-area-scrollbar";
}

export function scrollAreaThumbComposition(): string {
	return "scroll-area-thumb";
}

export function scrollAreaViewportComposition(): string {
	return "scroll-area-viewport";
}
