/**
 * @file Tabs — Seed Style Presets
 * @kind tabs
 * @package @devpulse/coldlight
 *
 * Ref: CHAT-REFERENCE-01.png (DEVELOPMENTS / OUTER MEMORY tabs with glow indicator)
 */

export const tabsPresets = {
	"neuro-bar": {
		"tabs.list.background": "rgba(5, 8, 15, 0.6)",
		"tabs.list.backdrop-blur": "8px",
		"tabs.list.border.color": "rgba(0, 200, 200, 0.12)",
		"tabs.list.border-radius": "12px",
		"tabs.trigger.color.default": "#64748b",
		"tabs.trigger.color.hover": "#94a3b8",
		"tabs.trigger.color.active": "#e0f7fa",
		"tabs.trigger.background.hover": "rgba(255, 255, 255, 0.03)",
		"tabs.trigger.background.active": "rgba(0, 200, 200, 0.08)",
		"tabs.trigger.border-radius": "8px",
		"tabs.indicator.background": "#00c8c8",
		"tabs.indicator.shadow": "0 0 8px rgba(0, 200, 200, 0.5), 0 0 16px rgba(0, 200, 200, 0.2)",
		"tabs.indicator.height": "2px",
	},
	"neuro-pills": {
		"tabs.list.background": "transparent",
		"tabs.list.border.color": "transparent",
		"tabs.list.border-radius": "0px",
		"tabs.trigger.color.default": "#64748b",
		"tabs.trigger.color.hover": "#e2e8f0",
		"tabs.trigger.color.active": "#e0f7fa",
		"tabs.trigger.background.hover": "rgba(0, 200, 200, 0.04)",
		"tabs.trigger.background.active": "rgba(0, 200, 200, 0.1)",
		"tabs.trigger.border-radius": "8px",
		"tabs.trigger.shadow.active": "0 0 8px rgba(0, 200, 200, 0.15)",
		"tabs.indicator.background": "transparent",
		"tabs.indicator.height": "0px",
	},
	"flat-underline": {
		"tabs.list.background": "transparent",
		"tabs.list.border.color": "rgba(255, 255, 255, 0.06)",
		"tabs.list.border-radius": "0px",
		"tabs.trigger.color.default": "#475569",
		"tabs.trigger.color.hover": "#94a3b8",
		"tabs.trigger.color.active": "#e2e8f0",
		"tabs.trigger.background.hover": "transparent",
		"tabs.trigger.background.active": "transparent",
		"tabs.trigger.border-radius": "0px",
		"tabs.indicator.background": "#e2e8f0",
		"tabs.indicator.shadow": "none",
		"tabs.indicator.height": "2px",
	},
} as const;
