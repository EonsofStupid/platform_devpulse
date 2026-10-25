/**
 * @file Kbd — Seed Style Presets
 * @kind kbd
 * @package @devpulse/coldlight
 */

export const kbdPresets = {
	"neuro-key": {
		"kbd.root.background": "{glass.deep}",
		"kbd.root.border.color": "{border.strong}",
		"kbd.root.border-radius": "{radius.sm}",
		"kbd.root.shadow": "0 1px 2px rgba(0, 0, 0, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
		"kbd.root.color": "#e2e8f0",
		"kbd.root.font-family": "{font.mono}",
	},
	"flat-key": {
		"kbd.root.background": "{surface.inset}",
		"kbd.root.border.color": "{border.divider}",
		"kbd.root.border-radius": "{radius.xs}",
		"kbd.root.shadow": "none",
		"kbd.root.color": "#94a3b8",
		"kbd.root.font-family": "{font.mono}",
	},
} as const;
