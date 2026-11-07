/**
 * @file SkipLink — Seed Style Presets
 * @kind skip-link
 * @package @devpulse/coldlight
 */

export const skipLinkPresets = {
	"neuro-focus": {
		"skip-link.root.background.focus": "{glass.deep}",
		"skip-link.root.border.color.focus": "{color.teal.400}",
		"skip-link.root.color.focus": "#e2e8f0",
		"skip-link.root.shadow.focus": "0 2px 8px rgba(0, 0, 0, 0.4)",
	},
	"flat-focus": {
		"skip-link.root.background.focus": "{surface.base}",
		"skip-link.root.border.color.focus": "#e2e8f0",
		"skip-link.root.color.focus": "#e2e8f0",
		"skip-link.root.shadow.focus": "0 1px 4px rgba(0, 0, 0, 0.2)",
	},
} as const;
