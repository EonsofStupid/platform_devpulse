/**
 * @file NotificationCenter — Seed Style Presets
 * @kind notification-center
 * @package @devpulse/coldlight
 */

export const notificationCenterPresets = {
	"neuro-toast": {
		"notification-center.toast.background": "{glass.deep}",
		"notification-center.toast.border.color": "{border.strong}",
		"notification-center.toast.border-radius": "{radius.lg}",
		"notification-center.toast.shadow": "0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
		"notification-center.toast.color": "#e2e8f0",
		"notification-center.toast.color.secondary": "#94a3b8",
	},
	"flat-toast": {
		"notification-center.toast.background": "{surface.base}",
		"notification-center.toast.border.color": "{border.divider}",
		"notification-center.toast.border-radius": "{radius.md}",
		"notification-center.toast.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
		"notification-center.toast.color": "#e2e8f0",
		"notification-center.toast.color.secondary": "#64748b",
	},
} as const;
