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
		$value: "#2dd4bf",
		$type: "color",
		$description: "Focus border color — teal accent",
	},
	"text-field.input.border.color.invalid": {
		$value: "#f87171",
		$type: "color",
		$description: "Invalid border color — red",
	},
	"text-field.input.border.width": {
		$value: "1px",
		$type: "dimension",
		$description: "Border width",
	},
	"text-field.input.border-radius": {
		$value: "{radius.md}",
		$type: "dimension",
		$description: "Corner radius",
	},
	"text-field.input.padding-inline": {
		$value: "16px",
		$type: "dimension",
		$description: "Horizontal padding",
	},
	"text-field.input.padding-block": {
		$value: "10px",
		$type: "dimension",
		$description: "Vertical padding",
	},
	"text-field.input.color": {
		$value: "#e2e8f0",
		$type: "color",
		$description: "Input text color",
	},
	"text-field.input.placeholder-color": {
		$value: "#64748b",
		$type: "color",
		$description: "Placeholder text color",
	},
	"text-field.input.font-size": {
		$value: "14px",
		$type: "dimension",
		$description: "Font size",
	},
	"text-field.input.font-family": {
		$value: "{font.sans}",
		$type: "fontFamily",
		$description: "Font family",
	},
	"text-field.input.shadow.focus": {
		$value: "0 0 0 3px rgba(45, 212, 191, 0.15)",
		$type: "shadow",
		$description: "Focus ring shadow",
	},
	"text-field.input.height": {
		$value: "40px",
		$type: "dimension",
		$description: "Default height (md)",
	},
	"text-field.label.color": {
		$value: "#e2e8f0",
		$type: "color",
		$description: "Label text color",
	},
	"text-field.label.font-size": {
		$value: "14px",
		$type: "dimension",
		$description: "Label font size",
	},
	"text-field.label.font-weight": {
		$value: 500,
		$type: "number",
		$description: "Label font weight — medium",
	},
	"text-field.label.margin-bottom": {
		$value: "4px",
		$type: "dimension",
		$description: "Space between label and input",
	},
	"text-field.description.color": {
		$value: "#94a3b8",
		$type: "color",
		$description: "Description text color",
	},
	"text-field.description.font-size": {
		$value: "12px",
		$type: "dimension",
		$description: "Description font size",
	},
	"text-field.error.color": {
		$value: "#f87171",
		$type: "color",
		$description: "Error message color",
	},
	"text-field.error.font-size": {
		$value: "12px",
		$type: "dimension",
		$description: "Error font size",
	},
} as const;

/** Size-specific token overrides */
export const textFieldSizeTokens = {
	sm: {
		"text-field.input.height": { $value: "32px", $type: "dimension" as const },
		"text-field.input.padding-inline": { $value: "12px", $type: "dimension" as const },
		"text-field.input.font-size": { $value: "14px", $type: "dimension" as const },
	},
	md: {
		"text-field.input.height": { $value: "40px", $type: "dimension" as const },
		"text-field.input.padding-inline": { $value: "16px", $type: "dimension" as const },
		"text-field.input.font-size": { $value: "14px", $type: "dimension" as const },
	},
	lg: {
		"text-field.input.height": { $value: "48px", $type: "dimension" as const },
		"text-field.input.padding-inline": { $value: "16px", $type: "dimension" as const },
		"text-field.input.font-size": { $value: "16px", $type: "dimension" as const },
	},
} as const;
