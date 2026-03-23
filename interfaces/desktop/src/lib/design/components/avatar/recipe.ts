/**
 * @file Avatar Recipes — as const named presets
 * @kind avatar
 *
 * Each recipe overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const avatarRecipes = {
	"neuro-ring": {
		"avatar.root.background": "{glass.deep}",
		"avatar.root.border.color": "{border.strong}",
		"avatar.root.border.width": "3px",
		"avatar.root.shadow": "0 0 8px rgba(0, 200, 200, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
	},
	"flat-circle": {
		"avatar.root.background": "{surface.inset}",
		"avatar.root.border.color": "{border.divider}",
		"avatar.root.border.width": "1px",
		"avatar.root.shadow": "{shadow.z0}",
	},
} as const;
