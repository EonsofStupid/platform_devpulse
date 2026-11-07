/**
 * @file Stat — Seed Style Presets
 * @kind stat
 * @package @devpulse/coldlight
 *
 * Ref: DASHBOARD-REFERENCE-01.png (glowing data values, metric cards)
 */

export const statPresets = {
	"neuro-glow-teal": {
		"stat.value.color": "#00c8c8",
		"stat.value.font-family": "{font.display}",
		"stat.value.font-weight": "700",
		"stat.value.text-shadow": "0 0 12px rgba(0, 200, 200, 0.5), 0 0 24px rgba(0, 200, 200, 0.2), 0 0 48px rgba(0, 200, 200, 0.08)",
		"stat.label.color": "#94a3b8",
		"stat.label.font-weight": "500",
		"stat.trend.color.up": "#22c55e",
		"stat.trend.color.down": "#ef4444",
	},
	"neuro-glow-purple": {
		"stat.value.color": "#a78bfa",
		"stat.value.font-family": "{font.display}",
		"stat.value.font-weight": "700",
		"stat.value.text-shadow": "0 0 12px rgba(167, 139, 250, 0.5), 0 0 24px rgba(167, 139, 250, 0.2), 0 0 48px rgba(167, 139, 250, 0.08)",
		"stat.label.color": "#94a3b8",
		"stat.label.font-weight": "500",
		"stat.trend.color.up": "#22c55e",
		"stat.trend.color.down": "#ef4444",
	},
	"neuro-glow-amber": {
		"stat.value.color": "#f59e0b",
		"stat.value.font-family": "{font.display}",
		"stat.value.font-weight": "700",
		"stat.value.text-shadow": "0 0 12px rgba(245, 158, 11, 0.5), 0 0 24px rgba(245, 158, 11, 0.2)",
		"stat.label.color": "#94a3b8",
		"stat.label.font-weight": "500",
		"stat.trend.color.up": "#22c55e",
		"stat.trend.color.down": "#ef4444",
	},
	"flat-clean": {
		"stat.value.color": "#e2e8f0",
		"stat.value.font-family": "{font.sans}",
		"stat.value.font-weight": "700",
		"stat.value.text-shadow": "none",
		"stat.label.color": "#64748b",
		"stat.label.font-weight": "500",
		"stat.trend.color.up": "#22c55e",
		"stat.trend.color.down": "#ef4444",
	},
} as const;
