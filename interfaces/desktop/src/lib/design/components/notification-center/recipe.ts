/**
 * @file NotificationCenter Recipe — Structural Classes Only
 * @kind notification-center
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function notificationCenterRecipe(): string {
	return cn("notification-center-root", "rounded-lg");
}
