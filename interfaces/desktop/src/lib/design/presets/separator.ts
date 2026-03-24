/**
 * @file Separator — Seed Style Presets
 * @kind separator
 * @package @devpulse/coldlight
 */

export const separatorPresets = {
	"neuro-line": {
		"separator.root.background": "{border.strong}",
		"separator.root.shadow": "0 1px 0 rgba(255, 255, 255, 0.04)",
	},
	"flat-line": {
		"separator.root.background": "{border.divider}",
		"separator.root.shadow": "none",
	},
} as const;
