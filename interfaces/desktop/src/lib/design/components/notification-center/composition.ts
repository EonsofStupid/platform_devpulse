/**
 * @file NotificationCenter Composition — Structural Classes Only
 * @kind notification-center
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function notificationCenterComposition(): string {
	return cn("notification-center-root", "rounded-lg");
}
