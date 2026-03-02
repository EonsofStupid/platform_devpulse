/**
 * @file Badge Recipe — Structural Classes Only
 * @kind badge
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";
import type { BadgeSize } from "./types.js";

const SIZE_CLASSES: Record<BadgeSize, string> = {
	sm: "h-5 px-1.5 text-xs",
	md: "h-6 px-2 text-xs",
	lg: "h-7 px-2.5 text-sm",
};

export function badgeRecipe(size: BadgeSize = "md"): string {
	return cn(
		"badge",
		"inline-flex items-center justify-center font-medium whitespace-nowrap",
		SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	);
}
