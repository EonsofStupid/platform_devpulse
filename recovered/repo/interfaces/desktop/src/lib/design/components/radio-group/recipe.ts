/**
 * @file RadioGroup Recipe
 * @kind radio-group
 * @layer components
 *
 * SD5-driven styling for the radio group compound component.
 * Returns per-slot class strings.
 */

const rootBase = "flex flex-col gap-2";

const itemBase = [
	"inline-flex items-center gap-2",
	"rounded-full border border-white/8",
	"h-5 w-5 shrink-0",
	"text-teal-500 transition-colors",
	"hover:border-white/20",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
	"disabled:pointer-events-none disabled:opacity-50",
	"aria-[checked=true]:border-teal-500 aria-[checked=true]:bg-teal-500",
].join(" ");

const labelBase = "text-sm font-medium text-white/90";

export function radioGroupRecipe(): {
	root: string;
	item: string;
	label: string;
} {
	return {
		root: rootBase,
		item: itemBase,
		label: labelBase,
	};
}
