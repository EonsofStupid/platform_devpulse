/**
 * @file ContextualHelp — Seed Style Presets
 * @kind contextual-help
 * @package @devpulse/coldlight
 */

export const contextualHelpPresets = {
	"neuro-popover": {
		"contextual-help.trigger.color": "#94a3b8",
		"contextual-help.trigger.color.hover": "{color.teal.400}",
		"contextual-help.popover.background": "{glass.deep}",
		"contextual-help.popover.border.color": "{border.strong}",
		"contextual-help.popover.border-radius": "{radius.lg}",
		"contextual-help.popover.shadow": "0 4px 16px rgba(0, 0, 0, 0.4)",
	},
	"flat-popover": {
		"contextual-help.trigger.color": "#64748b",
		"contextual-help.trigger.color.hover": "#e2e8f0",
		"contextual-help.popover.background": "{surface.base}",
		"contextual-help.popover.border.color": "{border.divider}",
		"contextual-help.popover.border-radius": "{radius.md}",
		"contextual-help.popover.shadow": "0 2px 8px rgba(0, 0, 0, 0.2)",
	},
} as const;
