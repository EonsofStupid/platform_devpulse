/**
 * @file TextField Recipes — as const named presets
 * @kind text-field
 *
 * Each recipe overrides default token values for a visual family.
 * SD5 processes as mode-specific token groups.
 */

export const textFieldRecipes = {
	"neuro-inset": {
		"text-field.input.background.default": "{glass.void}",
		"text-field.input.background.focus": "{glass.deep}",
		"text-field.input.border.color.default": "{border.strong}",
		"text-field.input.border-radius": "{radius.lg}",
		"text-field.input.shadow.default": "inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.2)",
		"text-field.input.shadow.focus": "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(45, 212, 191, 0.2)",
	},
	"glass-input": {
		"text-field.input.background.default": "{glass.smoke}",
		"text-field.input.background.focus": "{glass.deep}",
		"text-field.input.border.color.default": "{border.subtle}",
		"text-field.input.border-radius": "{radius.md}",
		"text-field.input.shadow.default": "0 1px 2px rgba(0, 0, 0, 0.15)",
		"text-field.input.shadow.focus": "0 0 0 3px rgba(45, 212, 191, 0.15)",
	},
	"flat-underline": {
		"text-field.input.background.default": "transparent",
		"text-field.input.background.focus": "transparent",
		"text-field.input.border.color.default": "{border.divider}",
		"text-field.input.border-radius": "0px",
		"text-field.input.border.width": "0 0 1px 0",
		"text-field.input.shadow.default": "none",
		"text-field.input.shadow.focus": "0 1px 0 0 #2dd4bf",
	},
} as const;
