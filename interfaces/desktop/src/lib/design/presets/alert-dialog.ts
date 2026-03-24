/**
 * @file AlertDialog — Seed Style Presets
 * @kind alert-dialog
 * @package @devpulse/coldlight
 */

export const alertDialogPresets = {
	"neuro-elevated": {
		"alert-dialog.overlay.background": "rgba(0, 0, 0, 0.6)",
		"alert-dialog.overlay.backdrop-blur": "4px",
		"alert-dialog.content.background": "{glass.deep}",
		"alert-dialog.content.border.color": "{border.strong}",
		"alert-dialog.content.border-radius": "{radius.lg}",
		"alert-dialog.content.shadow": "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
		"alert-dialog.title.color": "#e2e8f0",
		"alert-dialog.description.color": "#94a3b8",
	},
	"glass-modal": {
		"alert-dialog.overlay.background": "rgba(0, 0, 0, 0.5)",
		"alert-dialog.overlay.backdrop-blur": "8px",
		"alert-dialog.content.background": "{glass.smoke}",
		"alert-dialog.content.border.color": "{border.subtle}",
		"alert-dialog.content.border-radius": "{radius.lg}",
		"alert-dialog.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.3)",
		"alert-dialog.title.color": "#e2e8f0",
		"alert-dialog.description.color": "#94a3b8",
	},
} as const;
