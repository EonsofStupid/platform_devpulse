/**
 * @file Kbd Recipe
 * @kind kbd
 * @layer components
 *
 * Keyboard shortcut styling recipe — keycap appearance via Tailwind classes.
 */

import type { KbdSize } from "./types.js";

const base = [
	"inline-flex items-center justify-center",
	"font-mono font-medium",
	"bg-surface-elevated text-text-primary",
	"border border-border-subtle rounded",
	"shadow-sm",
].join(" ");

const sizeStyles: Record<KbdSize, string> = {
	sm: "min-w-5 h-5 px-1 text-xs",
	md: "min-w-6 h-6 px-1.5 text-sm",
	lg: "min-w-7 h-7 px-2 text-base",
};

export function kbdRecipe(opts: { size?: KbdSize }): string {
	return `${base} ${sizeStyles[opts.size ?? "md"]}`;
}
