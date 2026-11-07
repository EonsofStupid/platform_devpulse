/**
 * @file Sheet — Seed Style Presets
 * @kind sheet
 * @package @devpulse/coldlight
 */

export const sheetPresets = {
	"neuro-panel": {
		"sheet.overlay.background": "rgba(0, 0, 0, 0.5)",
		"sheet.content.background": "{glass.deep}",
		"sheet.content.border.color": "{border.strong}",
		"sheet.content.shadow": "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
		"sheet.header.border.color": "{border.subtle}",
		"sheet.footer.border.color": "{border.subtle}",
		"sheet.close.color": "#64748b",
		"sheet.close.color.hover": "#e2e8f0",
	},
	"glass-panel": {
		"sheet.overlay.background": "rgba(0, 0, 0, 0.4)",
		"sheet.content.background": "{glass.smoke}",
		"sheet.content.border.color": "{border.subtle}",
		"sheet.content.shadow": "0 4px 16px rgba(0, 0, 0, 0.3)",
		"sheet.header.border.color": "{border.divider}",
		"sheet.footer.border.color": "{border.divider}",
		"sheet.close.color": "#64748b",
		"sheet.close.color.hover": "#e2e8f0",
	},
} as const;
