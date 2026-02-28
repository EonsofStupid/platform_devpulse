/**
 * @file AlertDialog Recipe — Shortcode Class Composition
 * @kind overlay
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (dialog-*, alertdialog-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Reuses dialog-* structural classes for overlay/content/header/footer/title/description.
 */

export function alertDialogRecipe() {
	return {
		overlay: "dialog-overlay",
		content: "dialog-content v-void s-glass e-3 sz-md rounded-lg",
		header: "dialog-header",
		footer: "dialog-footer",
		title: "dialog-title",
		description: "dialog-description",
		action: "alertdialog-action v-molten s-solid e-1 sz-md rounded-md",
		cancel: "alertdialog-cancel v-void s-glass e-0 sz-md rounded-md",
	};
}
