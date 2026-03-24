/**
 * @file Dialog — Seed Style Presets
 * @kind dialog
 * @package @devpulse/coldlight
 */

export const dialogPresets = {
	"neuro-elevated": {
		"dialog.overlay.background": "rgba(0, 0, 0, 0.6)",
		"dialog.overlay.backdrop-blur": "4px",
		"dialog.content.background": "{glass.deep}",
		"dialog.content.border.color": "{border.strong}",
		"dialog.content.border-radius": "{radius.lg}",
		"dialog.content.shadow": "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
		"dialog.title.color": "#e2e8f0",
		"dialog.description.color": "#94a3b8",
		"dialog.close.color": "#64748b",
		"dialog.close.color.hover": "#e2e8f0",
	},
	"glass-modal": {
		"dialog.overlay.background": "rgba(0, 0, 0, 0.5)",
		"dialog.overlay.backdrop-blur": "8px",
		"dialog.content.background": "{glass.smoke}",
		"dialog.content.border.color": "{border.subtle}",
		"dialog.content.border-radius": "{radius.lg}",
		"dialog.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.3)",
		"dialog.title.color": "#e2e8f0",
		"dialog.description.color": "#94a3b8",
		"dialog.close.color": "#64748b",
		"dialog.close.color.hover": "#e2e8f0",
	},
} as const;
