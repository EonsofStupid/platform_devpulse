/**
 * @file NotificationCenter Recipe
 * @kind notification-center
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * NotificationCenter: panel container for notification list with header and actions.
 */

const base = [
	"flex flex-col",
	"rounded-lg border border-border-subtle",
	"bg-surface-primary shadow-lg",
	"overflow-hidden",
	"w-80 max-h-96",
].join(" ");

export function notificationCenterRecipe(): string {
	return base;
}
