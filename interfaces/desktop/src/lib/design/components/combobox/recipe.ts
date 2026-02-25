/**
 * @file Combobox Recipe
 * @kind combobox
 * @layer components
 *
 * SD5-driven styling for the combobox compound component.
 * Returns per-slot class strings.
 */

const inputBase = [
	"flex-1 w-full bg-transparent",
	"px-3 py-2 text-sm text-white/90",
	"placeholder:text-white/40",
	"outline-none",
].join(" ");

const triggerBase = [
	"inline-flex items-center justify-center",
	"px-2 py-2 text-sm",
	"text-white/60 hover:text-white/90 transition-colors",
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

const emptyBase = [
	"py-6 text-center text-sm text-white/50",
].join(" ");

const labelBase = "text-sm font-medium text-white/70 mb-1.5";

const wrapperBase = [
	"inline-flex w-full items-center",
	"border border-white/8 rounded-lg",
	"bg-white/[0.03]",
	"focus-within:ring-2 focus-within:ring-border-focus",
].join(" ");

export function comboboxRecipe(): {
	wrapper: string;
	input: string;
	trigger: string;
	content: string;
	item: string;
	empty: string;
	label: string;
} {
	return {
		wrapper: wrapperBase,
		input: inputBase,
		trigger: triggerBase,
		content: contentBase,
		item: itemBase,
		empty: emptyBase,
		label: labelBase,
	};
}
