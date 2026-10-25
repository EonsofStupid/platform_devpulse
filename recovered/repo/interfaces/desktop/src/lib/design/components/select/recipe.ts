/**
 * @file Select Recipe
 * @kind select
 * @layer components
 *
 * SD5-driven styling for the select compound component.
 * Returns per-slot class strings.
 */

const triggerBase = [
	"inline-flex w-full items-center justify-between",
	"px-3 py-2 text-sm",
	"border border-white/8 rounded-lg",
	"bg-white/[0.03] text-white/90",
	"hover:bg-white/[0.06] transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
].join(" ");

const contentBase = [
	"z-50 overflow-hidden",
	"border border-white/8 rounded-lg",
	"bg-surface-glass-void p-1",
	"data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
].join(" ");

const itemBase = [
	"relative flex w-full cursor-pointer select-none items-center",
	"rounded-md px-2 py-1.5 text-sm text-white/80",
	"outline-none transition-colors",
	"data-[highlighted]:bg-white/10 data-[highlighted]:text-white",
	"aria-[selected=true]:bg-teal-500/20 aria-[selected=true]:text-teal-300",
].join(" ");

const labelBase = "text-sm font-medium text-white/70 mb-1.5";

const groupBase = "overflow-hidden";

export function selectRecipe(): {
	trigger: string;
	content: string;
	item: string;
	label: string;
	group: string;
} {
	return {
		trigger: triggerBase,
		content: contentBase,
		item: itemBase,
		label: labelBase,
		group: groupBase,
	};
}
