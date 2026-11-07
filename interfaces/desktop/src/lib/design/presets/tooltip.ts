/**
 * @file Tooltip — Seed Style Presets
 * @kind tooltip
 * @package @devpulse/coldlight
 */

export const tooltipPresets = {
	"neuro-float": {
		"tooltip.content.background": "linear-gradient(135deg, rgba(10, 14, 23, 0.95) 0%, rgba(15, 23, 36, 0.98) 100%)",
		"tooltip.content.backdrop-blur": "12px",
		"tooltip.content.border.color": "rgba(0, 200, 200, 0.2)",
		"tooltip.content.border-radius": "10px",
		"tooltip.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 200, 200, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
		"tooltip.content.color": "#e0f7fa",
		"tooltip.content.font-size": "0.8125rem",
		"tooltip.arrow.color": "rgba(10, 14, 23, 0.95)",
	},
	"glass-float": {
		"tooltip.content.background": "rgba(255, 255, 255, 0.05)",
		"tooltip.content.backdrop-blur": "16px",
		"tooltip.content.border.color": "rgba(255, 255, 255, 0.1)",
		"tooltip.content.border-radius": "8px",
		"tooltip.content.shadow": "0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
		"tooltip.content.color": "#e2e8f0",
		"tooltip.content.font-size": "0.8125rem",
		"tooltip.arrow.color": "rgba(255, 255, 255, 0.05)",
	},
	"flat-float": {
		"tooltip.content.background": "#1e293b",
		"tooltip.content.backdrop-blur": "0px",
		"tooltip.content.border.color": "rgba(255, 255, 255, 0.06)",
		"tooltip.content.border-radius": "6px",
		"tooltip.content.shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
		"tooltip.content.color": "#e2e8f0",
		"tooltip.content.font-size": "0.8125rem",
		"tooltip.arrow.color": "#1e293b",
	},
} as const;
