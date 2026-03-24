/**
 * @file Heading Tokens — as const DTCG
 * @kind heading
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const headingTokens = {
	"heading.root.color": {
		$value: "oklch(1.0032 0.0305 28.88)",
		$type: "color",
		$description: "Default heading text color",
	},
	"heading.root.font-family": {
		$value: "{font.display}",
		$type: "fontFamily",
		$description: "Display font family for headings",
	},
	"heading.root.font-weight.h1": {
		$value: 700,
		$type: "number",
		$description: "Font weight for h1 — bold",
	},
	"heading.root.font-weight.h2": {
		$value: 700,
		$type: "number",
		$description: "Font weight for h2 — bold",
	},
	"heading.root.font-weight.h3": {
		$value: 600,
		$type: "number",
		$description: "Font weight for h3 — semibold",
	},
	"heading.root.font-weight.h4": {
		$value: 600,
		$type: "number",
		$description: "Font weight for h4 — semibold",
	},
	"heading.root.font-weight.h5": {
		$value: 500,
		$type: "number",
		$description: "Font weight for h5 — medium",
	},
	"heading.root.font-weight.h6": {
		$value: 500,
		$type: "number",
		$description: "Font weight for h6 — medium",
	},
	"heading.root.letter-spacing": {
		$value: "-0.02em",
		$type: "dimension",
		$description: "Default letter spacing — tight tracking for headings",
	},
	"heading.root.line-height": {
		$value: "1.2",
		$type: "number",
		$description: "Default line height — tight for headings",
	},
	"heading.root.opacity": {
		$value: 1,
		$type: "number",
		$description: "Default opacity",
	},
} as const;

/** Size-specific token overrides */
export const headingSizeTokens = {
	xs: {
		"heading.root.font-size": { $value: "0.75rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "0em", $type: "dimension" as const },
	},
	sm: {
		"heading.root.font-size": { $value: "0.875rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "-0.01em", $type: "dimension" as const },
	},
	md: {
		"heading.root.font-size": { $value: "1rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "-0.01em", $type: "dimension" as const },
	},
	lg: {
		"heading.root.font-size": { $value: "1.125rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "-0.02em", $type: "dimension" as const },
	},
	xl: {
		"heading.root.font-size": { $value: "1.25rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "-0.02em", $type: "dimension" as const },
	},
	"2xl": {
		"heading.root.font-size": { $value: "1.5rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "-0.03em", $type: "dimension" as const },
	},
	"3xl": {
		"heading.root.font-size": { $value: "1.875rem", $type: "dimension" as const },
		"heading.root.letter-spacing": { $value: "-0.03em", $type: "dimension" as const },
	},
} as const;
