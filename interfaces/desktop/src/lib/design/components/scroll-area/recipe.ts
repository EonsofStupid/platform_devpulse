/**
 * @file ScrollArea Recipe
 * @kind scroll-area
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type ScrollAreaRecipeProps = { size?: string };
type ScrollbarRecipeProps = { size?: string; orientation?: string };

export function scrollAreaRecipe(props: ScrollAreaRecipeProps = {}): string {
	return "relative overflow-hidden";
}

export function scrollAreaScrollbarRecipe(props: ScrollbarRecipeProps = {}): string {
	const isVertical = props.orientation !== "horizontal";
	return cn(
		"flex touch-none select-none transition-colors",
		isVertical
			? "h-full w-2.5 border-l border-l-transparent p-px"
			: "h-2.5 flex-col border-t border-t-transparent p-px",
	);
}

export function scrollAreaThumbRecipe(): string {
	return "relative flex-1 rounded-full bg-[oklch(1_0_0/0.15)]";
}

export function scrollAreaViewportRecipe(): string {
	return "h-full w-full rounded-[inherit]";
}
