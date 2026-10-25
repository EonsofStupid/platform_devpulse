/**
 * @file Avatar — Seed Style Presets
 * @kind avatar
 * @package @devpulse/coldlight
 */

export const avatarPresets = {
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
