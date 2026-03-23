/**
 * @file Badge Recipes — as const named presets
 * @kind badge
 *
 * Each recipe overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const badgeRecipes = {
	"neuro-pill": {
		"badge.root.background": "{glass.deep}",
		"badge.root.border.color": "{border.strong}",
		"badge.root.shadow": "0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
		"badge.root.border-radius": "9999px",
	},
	"glass-tag": {
		"badge.root.background": "{glass.smoke}",
		"badge.root.border.color": "{border.subtle}",
		"badge.root.shadow": "0 1px 2px rgba(0, 0, 0, 0.2)",
		"badge.root.border-radius": "{radius.md}",
	},
	"flat-chip": {
		"badge.root.background": "{surface.inset}",
		"badge.root.border.color": "{border.divider}",
		"badge.root.shadow": "{shadow.z0}",
		"badge.root.border-radius": "{radius.sm}",
	},
} as const;
