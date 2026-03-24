/**
 * @file Button — Seed Style Presets
 * @kind button
 * @package @devpulse/coldlight
 *
 * Named collections of resolved token values.
 * SD5 compiles these into CSS custom properties at build.
 * VPB can create additional presets via live authoring.
 */

export const buttonPresets = {
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
