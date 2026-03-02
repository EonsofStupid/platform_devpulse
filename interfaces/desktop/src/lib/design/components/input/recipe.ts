/**
 * @file Input Recipe — Structural Classes Only
 * @kind input
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";
import type { InputSize } from "./types.js";

const SIZE_CLASSES: Record<InputSize, string> = {
	sm: "h-8 px-2.5 text-sm",
	md: "h-10 px-3 text-sm",
	lg: "h-12 px-4 text-base",
};

export function inputRecipe(size: InputSize = "md"): string {
	return cn(
		"input-root",
		"w-full",
		"placeholder:text-current/40",
		"focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current",
		"disabled:pointer-events-none disabled:opacity-50",
		"data-[invalid]:ring-2 data-[invalid]:ring-red-500/50",
		SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	);
}
