/**
 * @file Toolbar Recipe
 * @kind toolbar
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { ToolbarSize } from "./types.js";

const base = [
	"flex items-center",
	"rounded-md border border-border-subtle",
	"bg-surface-primary",
].join(" ");

const sizeStyles: Record<ToolbarSize, string> = {
	sm: "gap-1 p-1",
	md: "gap-2 p-2",
	lg: "gap-3 p-3",
};

const orientationStyles: Record<string, string> = {
	horizontal: "flex-row",
	vertical: "flex-col",
};

export function toolbarRecipe(opts: {
	size: ToolbarSize;
	orientation?: string;
}): string {
	return `${base} ${sizeStyles[opts.size]} ${orientationStyles[opts.orientation ?? "horizontal"] ?? orientationStyles.horizontal}`;
}
