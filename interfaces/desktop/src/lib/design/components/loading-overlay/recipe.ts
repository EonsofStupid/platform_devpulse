/**
 * @file LoadingOverlay Recipe
 * @kind loading-overlay
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * LoadingOverlay: full-area overlay with spinner and optional label text.
 */

const base = [
	"absolute inset-0 z-50",
	"flex flex-col items-center justify-center gap-3",
	"bg-surface-primary/80 backdrop-blur-sm",
	"text-sm text-text-secondary",
].join(" ");

export function loadingOverlayRecipe(): string {
	return base;
}
