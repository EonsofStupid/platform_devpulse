/**
 * @file AlertDialog Recipe
 * @kind alert-dialog
 * @layer components
 *
 * SD5-driven styling for the alert dialog compound component.
 * Returns per-slot class strings.
 */

const overlayBase = [
	"fixed inset-0 z-50",
	"bg-black/60 backdrop-blur-sm",
	"animate-in fade-in-0",
].join(" ");

const contentBase = [
	"fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
	"w-full max-w-lg rounded-lg border p-6",
	"bg-neutral-950 text-white border-white/10",
	"shadow-2xl animate-in fade-in-0 zoom-in-95",
].join(" ");

const titleBase = "text-lg font-semibold leading-none tracking-tight";

const descriptionBase = "text-sm text-neutral-400";

const actionBase = [
	"inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
	"bg-red-600 text-white hover:bg-red-700",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
	"transition-colors",
].join(" ");

const cancelBase = [
	"inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
	"border border-white/10 bg-transparent text-white hover:bg-white/5",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950",
	"transition-colors",
].join(" ");

export function alertDialogRecipe(): {
	overlay: string;
	content: string;
	title: string;
	description: string;
	action: string;
	cancel: string;
} {
	return {
		overlay: overlayBase,
		content: contentBase,
		title: titleBase,
		description: descriptionBase,
		action: actionBase,
		cancel: cancelBase,
	};
}
