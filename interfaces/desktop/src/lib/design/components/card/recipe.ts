/**
 * @file Card Recipe — Structural Classes Only
 * @kind card
 * @layer components
 *
 * Visual appearance flows through useColdLight(). Recipe = structural layout only.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { CardSize } from "./types.js";

const SIZE_CLASSES: Record<CardSize, string> = {
	sm: "p-3",
	md: "p-4",
	lg: "p-6",
};

export function cardRecipe(size: CardSize = "md"): string {
	return cn("block overflow-hidden", SIZE_CLASSES[size] ?? SIZE_CLASSES.md);
}
