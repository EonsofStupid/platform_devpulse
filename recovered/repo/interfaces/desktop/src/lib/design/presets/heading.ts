/**
 * @file Heading — Seed Style Presets
 * @kind heading
 * @package @devpulse/coldlight
 *
 * Ref: DASHBOARD-REFERENCE-01.png (panel titles with teal glow)
 */

export const headingPresets = {
	"neuro-glow": {
		"heading.root.color": "#e0f7fa",
		"heading.root.font-family": "{font.display}",
		"heading.root.font-weight": "700",
		"heading.root.letter-spacing": "-0.03em",
		"heading.root.text-shadow": "0 0 12px rgba(0, 200, 200, 0.4), 0 0 24px rgba(0, 200, 200, 0.15), 0 0 48px rgba(0, 200, 200, 0.06)",
	},
	"neuro-glow-purple": {
		"heading.root.color": "#e8dff5",
		"heading.root.font-family": "{font.display}",
		"heading.root.font-weight": "700",
		"heading.root.letter-spacing": "-0.03em",
		"heading.root.text-shadow": "0 0 12px rgba(167, 139, 250, 0.4), 0 0 24px rgba(167, 139, 250, 0.15), 0 0 48px rgba(167, 139, 250, 0.06)",
	},
	"neuro-subtle": {
		"heading.root.color": "#e2e8f0",
		"heading.root.font-family": "{font.display}",
		"heading.root.font-weight": "600",
		"heading.root.letter-spacing": "-0.02em",
		"heading.root.text-shadow": "0 0 8px rgba(0, 200, 200, 0.15)",
	},
	"flat-clean": {
		"heading.root.color": "#e2e8f0",
		"heading.root.font-family": "{font.sans}",
		"heading.root.font-weight": "600",
		"heading.root.letter-spacing": "-0.01em",
		"heading.root.text-shadow": "none",
	},
	"display-bold": {
		"heading.root.color": "#ffffff",
		"heading.root.font-family": "{font.display}",
		"heading.root.font-weight": "800",
		"heading.root.letter-spacing": "-0.04em",
		"heading.root.text-shadow": "0 1px 2px rgba(0, 0, 0, 0.3)",
	},
} as const;
