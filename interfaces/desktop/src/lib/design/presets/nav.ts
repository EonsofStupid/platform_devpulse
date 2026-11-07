/**
 * @file Nav — Seed Style Presets
 * @kind nav
 * @package @devpulse/coldlight
 *
 * Ref: CHAT-REFERENCE-01.png (sidebar nav items with glow active indicators)
 */

export const navPresets = {
	"neuro-sidebar": {
		"nav.item.color": "#475569",
		"nav.item.color.hover": "#94a3b8",
		"nav.item.color.active": "#e0f7fa",
		"nav.item.font-weight.active": "600",
		"nav.item.background.hover": "rgba(0, 200, 200, 0.04)",
		"nav.item.background.active": "rgba(0, 200, 200, 0.08)",
		"nav.item.border-radius": "8px",
		"nav.item.indicator.color": "#00c8c8",
		"nav.item.indicator.width": "3px",
		"nav.item.indicator.shadow": "0 0 8px rgba(0, 200, 200, 0.5), 0 0 16px rgba(0, 200, 200, 0.15)",
		"nav.item.icon.color": "#475569",
		"nav.item.icon.color.active": "#00c8c8",
		"nav.item.icon.glow.active": "0 0 6px rgba(0, 200, 200, 0.4)",
	},
	"neuro-topbar": {
		"nav.item.color": "#64748b",
		"nav.item.color.hover": "#e2e8f0",
		"nav.item.color.active": "#e0f7fa",
		"nav.item.font-weight.active": "500",
		"nav.item.background.hover": "rgba(0, 200, 200, 0.04)",
		"nav.item.background.active": "transparent",
		"nav.item.border-radius": "6px",
		"nav.item.indicator.color": "#00c8c8",
		"nav.item.indicator.width": "2px",
		"nav.item.indicator.shadow": "0 0 6px rgba(0, 200, 200, 0.4)",
		"nav.item.icon.color": "#475569",
		"nav.item.icon.color.active": "#00c8c8",
		"nav.item.icon.glow.active": "none",
	},
	"flat-tabs": {
		"nav.item.color": "#475569",
		"nav.item.color.hover": "#94a3b8",
		"nav.item.color.active": "#e2e8f0",
		"nav.item.font-weight.active": "500",
		"nav.item.background.hover": "rgba(255, 255, 255, 0.02)",
		"nav.item.background.active": "transparent",
		"nav.item.border-radius": "4px",
		"nav.item.indicator.color": "#e2e8f0",
		"nav.item.indicator.width": "2px",
		"nav.item.indicator.shadow": "none",
		"nav.item.icon.color": "#334155",
		"nav.item.icon.color.active": "#e2e8f0",
		"nav.item.icon.glow.active": "none",
	},
} as const;
