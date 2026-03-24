/**
 * @file Stat — Seed Style Presets
 * @kind stat
 * @package @devpulse/coldlight
 */

export const statPresets = {
	"neuro-glow": {
		"stat.root.value.color": "{color.teal.400}",
		"stat.root.value.glow-color": "{glow.teal}",
		"stat.root.value.glow-radius": "12px",
		"stat.root.value.font-family": "{font.display}",
	},
	"flat-clean": {
		"stat.root.value.color": "{text.primary}",
		"stat.root.value.glow-radius": "0px",
		"stat.root.value.font-family": "{font.sans}",
	},
	"purple-glow": {
		"stat.root.value.color": "{color.purple.400}",
		"stat.root.value.glow-color": "{glow.purple}",
		"stat.root.value.glow-radius": "12px",
		"stat.root.value.font-family": "{font.display}",
	},
} as const;
