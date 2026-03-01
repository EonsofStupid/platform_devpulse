/**
 * @file NotificationCenter Recipe
 * @kind notification-center
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by notification-center-root @utility.
 */

import { cn } from "$lib/design/utils/cn.js";

export function notificationCenterRecipe(): string {
	return cn("notification-center-root", "v-s1 v-d2", "rounded-lg");
}
