/**
 * @file Prose — Seed Style Presets
 * @kind prose
 * @package @devpulse/coldlight
 */

export const prosePresets = {
	"neuro-content": {
		"prose.root.color": "#e2e8f0",
		"prose.root.font-family": "{font.sans}",
		"prose.root.line-height": "1.7",
		"prose.heading.color": "#f1f5f9",
		"prose.link.color": "{color.teal.400}",
		"prose.code.background": "rgba(0, 200, 200, 0.08)",
		"prose.code.color": "{color.teal.300}",
		"prose.hr.color": "{border.subtle}",
	},
	"flat-content": {
		"prose.root.color": "#cbd5e1",
		"prose.root.font-family": "{font.sans}",
		"prose.root.line-height": "1.6",
		"prose.heading.color": "#e2e8f0",
		"prose.link.color": "#94a3b8",
		"prose.code.background": "{surface.inset}",
		"prose.code.color": "#e2e8f0",
		"prose.hr.color": "{border.divider}",
	},
} as const;
