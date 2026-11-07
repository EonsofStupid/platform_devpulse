/**
 * @file DescriptionList — Seed Style Presets
 * @kind description-list
 * @package @devpulse/coldlight
 */

export const descriptionListPresets = {
	"neuro-stacked": {
		"description-list.term.color": "#94a3b8",
		"description-list.term.font-weight": "500",
		"description-list.detail.color": "#e2e8f0",
		"description-list.divider.color": "{border.subtle}",
	},
	"flat-inline": {
		"description-list.term.color": "#64748b",
		"description-list.term.font-weight": "600",
		"description-list.detail.color": "#e2e8f0",
		"description-list.divider.color": "{border.divider}",
	},
} as const;
