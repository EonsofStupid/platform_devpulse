/**
 * @file Code — Seed Style Presets
 * @kind code
 * @package @devpulse/coldlight
 */

export const codePresets = {
	"neuro-block": {
		"code.root.background": "{glass.void}",
		"code.root.border.color": "{border.strong}",
		"code.root.border-radius": "{radius.lg}",
		"code.root.shadow": "inset 0 1px 3px rgba(0, 0, 0, 0.4)",
		"code.root.font-family": "{font.mono}",
		"code.root.color": "#e2e8f0",
		"code.header.background": "{glass.deep}",
		"code.header.border.color": "{border.subtle}",
	},
	"flat-block": {
		"code.root.background": "{surface.inset}",
		"code.root.border.color": "{border.divider}",
		"code.root.border-radius": "{radius.md}",
		"code.root.shadow": "none",
		"code.root.font-family": "{font.mono}",
		"code.root.color": "#e2e8f0",
		"code.header.background": "{surface.raised}",
		"code.header.border.color": "{border.divider}",
	},
	"inline-neuro": {
		"code.inline.background": "rgba(0, 200, 200, 0.08)",
		"code.inline.border.color": "rgba(0, 200, 200, 0.2)",
		"code.inline.border-radius": "{radius.sm}",
		"code.inline.color": "{color.teal.300}",
		"code.inline.font-family": "{font.mono}",
	},
} as const;
