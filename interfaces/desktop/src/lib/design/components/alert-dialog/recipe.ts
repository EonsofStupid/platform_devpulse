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
		content: "dialog-content v-s1 v-d3 sz-md rounded-lg",
		header: "dialog-header",
		footer: "dialog-footer",
		title: "dialog-title",
		description: "dialog-description",
		action: "alertdialog-action v-s6 v-d1 v-g3 sz-md rounded-md",
		cancel: "alertdialog-cancel v-s1 sz-md rounded-md",
	};
}
