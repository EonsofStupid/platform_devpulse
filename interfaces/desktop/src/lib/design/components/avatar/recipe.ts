/**
 * @file Avatar Recipe
 * @kind avatar
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 * Avatar has three parts: root container, image, and fallback.
 */

import type { AvatarSize } from "./types.js";

const rootBase = [
	"relative inline-flex items-center justify-center",
	"rounded-full overflow-hidden",
	"bg-surface-muted",
	"border border-border-subtle",
	"shrink-0",
].join(" ");

const imageBase = [
	"h-full w-full object-cover",
].join(" ");

const fallbackBase = [
	"flex items-center justify-center",
	"h-full w-full",
	"bg-surface-elevated text-text-primary",
	"font-medium uppercase select-none",
].join(" ");

const sizeStyles: Record<AvatarSize, string> = {
	sm: "h-8 w-8 text-xs",
	md: "h-10 w-10 text-sm",
	lg: "h-14 w-14 text-base",
};

export function avatarRootRecipe(opts: { size: AvatarSize }): string {
	return `${rootBase} ${sizeStyles[opts.size]}`;
}

export function avatarImageRecipe(): string {
	return imageBase;
}

export function avatarFallbackRecipe(): string {
	return fallbackBase;
}
