/**
 * @file Collapsible Recipe
 * @kind collapsible
 * @layer components
 *
 * Minimal SD5-driven styling for the collapsible compound component.
 * Returns per-slot class strings for trigger and content.
 */

const triggerBase = [
	"flex w-full items-center justify-between",
	"text-sm font-medium text-white/90",
].join(" ");

const contentBase = "overflow-hidden text-sm text-white/80";

export function collapsibleRecipe(): { trigger: string; content: string } {
	return {
		trigger: triggerBase,
		content: contentBase,
	};
}
