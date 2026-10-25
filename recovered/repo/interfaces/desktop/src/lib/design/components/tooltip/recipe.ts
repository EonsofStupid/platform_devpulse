/**
 * @file Tooltip Recipe
 * @kind tooltip
 * @layer components
 *
 * SD5-driven styling for the tooltip compound component.
 * Returns per-slot class strings for content and arrow.
 */

const contentBase = [
	"z-50 rounded-md px-3 py-1.5 text-sm",
	"bg-neutral-900 text-white border border-white/10",
	"shadow-lg animate-in fade-in-0 zoom-in-95",
].join(" ");

const arrowBase = "fill-neutral-900";

export function tooltipRecipe(): { content: string; arrow: string } {
	return {
		content: contentBase,
		arrow: arrowBase,
	};
}
