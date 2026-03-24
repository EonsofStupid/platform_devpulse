/**
 * @file AvatarGroup — Seed Style Presets
 * @kind avatar-group
 * @package @devpulse/coldlight
 */

export const avatarGroupPresets = {
	"neuro-stack": {
		"avatar-group.root.border.color": "{border.strong}",
		"avatar-group.overflow.background": "{glass.deep}",
		"avatar-group.overflow.color": "#e2e8f0",
		"avatar-group.overflow.border.color": "{border.strong}",
	},
	"flat-stack": {
		"avatar-group.root.border.color": "{border.divider}",
		"avatar-group.overflow.background": "{surface.inset}",
		"avatar-group.overflow.color": "#94a3b8",
		"avatar-group.overflow.border.color": "{border.divider}",
	},
} as const;
