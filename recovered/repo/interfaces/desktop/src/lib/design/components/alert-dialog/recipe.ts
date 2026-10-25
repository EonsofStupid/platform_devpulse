/**
 * @file AlertDialog Recipe — Structural Classes Only
 * @kind overlay
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

export function alertDialogRecipe() {
	return {
		overlay: "dialog-overlay",
		content: "dialog-content p-4 text-sm rounded-lg",
		header: "dialog-header",
		footer: "dialog-footer",
		title: "dialog-title",
		description: "dialog-description",
		action: "alertdialog-action h-10 px-4 text-sm rounded-md",
		cancel: "alertdialog-cancel h-10 px-4 text-sm rounded-md",
	};
}
