/**
 * @file Button Compositions — as const named presets
 * @kind button
 *
 * Each composition overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const buttonCompositions = {
	"neuro-elevated": {
		"button.root.background.default": "{glass.deep}",
		"button.root.background.hover": "{glass.smoke}",
		"button.root.shadow": "{shadow.z2}",
		"button.root.border.color": "{border.strong}",
		"button.root.border-radius": "{radius.lg}",
	},
	"glass-deep": {
		"button.root.background.default": "{glass.teal}",
		"button.root.background.hover": "{glass.deep}",
		"button.root.shadow": "{shadow.z1}",
		"button.root.border.color": "{border.subtle}",
		"button.root.border-radius": "{radius.md}",
	},
	"flat-minimal": {
		"button.root.background.default": "{surface.base}",
		"button.root.background.hover": "{surface.raised}",
		"button.root.shadow": "{shadow.z0}",
		"button.root.border.color": "{border.divider}",
		"button.root.border-radius": "{radius.sm}",
	},
	"matte-solid": {
		"button.root.background.default": "{matte.dark}",
		"button.root.background.hover": "{matte.medium}",
		"button.root.shadow": "{shadow.z0}",
		"button.root.border.color": "{border.subtle}",
		"button.root.border-radius": "{radius.md}",
	},
} as const;
