/**
 * @file TextField Tokens — as const DTCG
 * @kind text-field
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const textFieldTokens = {
	"text-field.input.background.default": {
		$value: "{glass.void}",
		$type: "color",
		$description: "Default background — void glass",
	},
	"text-field.input.background.focus": {
		$value: "{glass.deep}",
		$type: "color",
		$description: "Focus background — deep glass",
	},
	"text-field.input.border.color.default": {
		$value: "{border.subtle}",
		$type: "color",
		$description: "Default border color",
	},
	"text-field.input.border.color.focus": {
		$value: "oklch(0.7887 0.0798 173.06)",
		$type: "color",
		$description: "Focus border color — teal accent",
	},
	"text-field.input.border.color.invalid": {
		$value: "oklch(0.7113 0.1693 15.9)",
		$type: "color",
		$description: "Invalid border color — red",
	},
	"text-field.input.border.width": {
		$value: "0.0625rem",
		$type: "dimension",
		$description: "Border width",
	},
	"text-field.input.border-radius": {
		$value: "{radius.md}",
		$type: "dimension",
		$description: "Corner radius",
	},
	"text-field.input.padding-inline": {
		$value: "1rem",
		$type: "dimension",
		$description: "Horizontal padding",
	},
	"text-field.input.padding-block": {
		$value: "0.625rem",
		$type: "dimension",
		$description: "Vertical padding",
	},
	"text-field.input.color": {
		$value: "oklch(0.9319 0.0177 20.01)",
		$type: "color",
		$description: "Input text color",
	},
	"text-field.input.placeholder-color": {
		$value: "oklch(0.5566 0.021 234.93)",
		$type: "color",
		$description: "Placeholder text color",
	},
	"text-field.input.font-size": {
		$value: "0.875rem",
		$type: "dimension",
		$description: "Font size",
	},
	"text-field.input.font-family": {
		$value: "{font.sans}",
		$type: "fontFamily",
		$description: "Font family",
	},
	"text-field.input.shadow.focus": {
		$value: "0 0 0 0.1875rem rgba(45, 212, 191, 0.15)",
		$type: "shadow",
		$description: "Focus ring shadow",
	},
	"text-field.input.height": {
		$value: "2.5rem",
		$type: "dimension",
		$description: "Default height (md)",
	},
	"text-field.label.color": {
		$value: "oklch(0.9319 0.0177 20.01)",
		$type: "color",
		$description: "Label text color",
	},
	"text-field.label.font-size": {
		$value: "0.875rem",
		$type: "dimension",
		$description: "Label font size",
	},
	"text-field.label.font-weight": {
		$value: 500,
		$type: "number",
		$description: "Label font weight — medium",
	},
	"text-field.label.margin-bottom": {
		$value: "0.25rem",
		$type: "dimension",
		$description: "Space between label and input",
	},
	"text-field.description.color": {
		$value: "oklch(0.7134 0.0118 250.59)",
		$type: "color",
		$description: "Description text color",
	},
	"text-field.description.font-size": {
		$value: "0.75rem",
		$type: "dimension",
		$description: "Description font size",
	},
	"text-field.error.color": {
		$value: "oklch(0.7113 0.1693 15.9)",
		$type: "color",
		$description: "Error message color",
	},
	"text-field.error.font-size": {
		$value: "0.75rem",
		$type: "dimension",
		$description: "Error font size",
	},
} as const;

/** Size-specific token overrides */
export const textFieldSizeTokens = {
	sm: {
		"text-field.input.height": { $value: "2rem", $type: "dimension" as const },
		"text-field.input.padding-inline": { $value: "0.75rem", $type: "dimension" as const },
		"text-field.input.font-size": { $value: "0.875rem", $type: "dimension" as const },
	},
	md: {
		"text-field.input.height": { $value: "2.5rem", $type: "dimension" as const },
		"text-field.input.padding-inline": { $value: "1rem", $type: "dimension" as const },
		"text-field.input.font-size": { $value: "0.875rem", $type: "dimension" as const },
	},
	lg: {
		"text-field.input.height": { $value: "3rem", $type: "dimension" as const },
		"text-field.input.padding-inline": { $value: "1rem", $type: "dimension" as const },
		"text-field.input.font-size": { $value: "1rem", $type: "dimension" as const },
	},
} as const;
