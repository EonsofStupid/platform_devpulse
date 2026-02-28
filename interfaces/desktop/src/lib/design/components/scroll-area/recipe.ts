/**
 * @file ScrollArea Recipe — Shortcode Composition
 * @kind scroll-area
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (scroll-area-*) handle all layout/positioning.
 * Orientation is handled via data-orientation attribute in CSS.
 */

type ScrollAreaRecipeProps = { size?: string };
type ScrollbarRecipeProps = { size?: string; orientation?: string };

export function scrollAreaRecipe(props: ScrollAreaRecipeProps = {}): string {
	return "scroll-area-root";
}

export function scrollAreaScrollbarRecipe(props: ScrollbarRecipeProps = {}): string {
	return "scroll-area-scrollbar";
}

export function scrollAreaThumbRecipe(): string {
	return "scroll-area-thumb";
}

export function scrollAreaViewportRecipe(): string {
	return "scroll-area-viewport";
}
