/**
 * @file Text Tokens — as const DTCG
 * @kind text
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const textTokens = {
	"text.root.color.primary": {
		$value: "oklch(0.9319 0.0177 20.01)",
		$type: "color",
		$description: "Primary text color — high contrast",
	},
	"text.root.color.secondary": {
		$value: "oklch(0.7134 0.0118 250.59)",
		$type: "color",
		$description: "Secondary text color — muted",
	},
	"text.root.color.muted": {
		$value: "oklch(0.5566 0.021 234.93)",
		$type: "color",
		$description: "Muted text color — low emphasis",
	},
	"text.root.color.accent": {
		$value: "oklch(0.7887 0.0798 173.06)",
		$type: "color",
		$description: "Accent text color — teal highlight",
	},
	"text.root.font-family": {
		$value: "{font.sans}",
		$type: "fontFamily",
		$description: "Default font family — system sans",
	},
	"text.root.line-height": {
		$value: "1.5",
		$type: "number",
		$description: "Default line height — comfortable reading",
	},
	"text.root.letter-spacing": {
		$value: "0em",
		$type: "dimension",
		$description: "Default letter spacing — normal",
	},
} as const;

/** Size-specific token overrides */
export const textSizeTokens = {
	xs: {
		"text.root.font-size": { $value: "0.75rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.5", $type: "number" as const },
	},
	sm: {
		"text.root.font-size": { $value: "0.875rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.5", $type: "number" as const },
	},
	base: {
		"text.root.font-size": { $value: "1rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.5", $type: "number" as const },
	},
	lg: {
		"text.root.font-size": { $value: "1.125rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.4", $type: "number" as const },
	},
	xl: {
		"text.root.font-size": { $value: "1.25rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.4", $type: "number" as const },
	},
	"2xl": {
		"text.root.font-size": { $value: "1.5rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.3", $type: "number" as const },
	},
	"3xl": {
		"text.root.font-size": { $value: "1.875rem", $type: "dimension" as const },
		"text.root.line-height": { $value: "1.2", $type: "number" as const },
	},
} as const;
