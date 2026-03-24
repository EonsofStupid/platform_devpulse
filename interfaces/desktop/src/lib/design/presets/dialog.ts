/**
 * @file Dialog — Seed Style Presets
 * @kind dialog
 * @package @devpulse/coldlight
 *
 * Ref: CHAT-REFERENCE-01.png (main chat panel is a dialog-like container)
 */

export const dialogPresets = {
	"neuro-elevated": {
		"dialog.overlay.background": "rgba(0, 0, 0, 0.65)",
		"dialog.overlay.backdrop-blur": "6px",
		"dialog.content.background": "linear-gradient(180deg, rgba(10, 14, 23, 0.92) 0%, rgba(8, 12, 20, 0.96) 100%)",
		"dialog.content.backdrop-blur": "16px",
		"dialog.content.border.color": "rgba(0, 200, 200, 0.18)",
		"dialog.content.border-radius": "20px",
		"dialog.content.shadow": "0 12px 48px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 200, 200, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.2)",
		"dialog.title.color": "#e0f7fa",
		"dialog.title.font-weight": "600",
		"dialog.description.color": "#94a3b8",
		"dialog.close.color": "rgba(0, 200, 200, 0.4)",
		"dialog.close.color.hover": "#00c8c8",
	},
	"glass-modal": {
		"dialog.overlay.background": "rgba(0, 0, 0, 0.5)",
		"dialog.overlay.backdrop-blur": "12px",
		"dialog.content.background": "rgba(255, 255, 255, 0.04)",
		"dialog.content.backdrop-blur": "20px",
		"dialog.content.border.color": "rgba(255, 255, 255, 0.1)",
		"dialog.content.border-radius": "20px",
		"dialog.content.shadow": "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
		"dialog.title.color": "#e2e8f0",
		"dialog.title.font-weight": "600",
		"dialog.description.color": "#94a3b8",
		"dialog.close.color": "#64748b",
		"dialog.close.color.hover": "#e2e8f0",
	},
	"flat-modal": {
		"dialog.overlay.background": "rgba(0, 0, 0, 0.4)",
		"dialog.overlay.backdrop-blur": "0px",
		"dialog.content.background": "#0f1724",
		"dialog.content.backdrop-blur": "0px",
		"dialog.content.border.color": "rgba(255, 255, 255, 0.06)",
		"dialog.content.border-radius": "12px",
		"dialog.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.4)",
		"dialog.title.color": "#e2e8f0",
		"dialog.title.font-weight": "600",
		"dialog.description.color": "#64748b",
		"dialog.close.color": "#475569",
		"dialog.close.color.hover": "#e2e8f0",
	},
} as const;
