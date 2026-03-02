/**
 * @file Alert Recipe — Structural Classes Only
 * @kind alert
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

export function alertRecipe(): string {
	return cn(
		"alert",
		"relative w-full p-4",
		"flex items-start gap-3",
	);
}
