/**
 * @file Accordion Recipe
 * @kind accordion
 * @layer components
 *
 * SD5-driven styling for the accordion compound component.
 * Returns per-slot class strings for root, trigger, and content.
 */

const base = "border border-white/8 rounded-lg divide-y divide-white/8";

const triggerBase = [
	"flex w-full items-center justify-between",
	"px-4 py-3 text-sm font-medium text-white/90",
	"hover:bg-white/5 transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
].join(" ");

const contentBase = "px-4 py-3 text-sm text-white/80";

export function accordionRecipe(): { root: string; trigger: string; content: string } {
	return {
		root: base,
		trigger: triggerBase,
		content: contentBase,
	};
}
