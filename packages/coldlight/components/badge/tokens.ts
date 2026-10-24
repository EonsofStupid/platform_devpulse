/**
 * @file Badge Tokens — as const DTCG
 * @kind badge
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const badgeTokens = {
	"badge.root.background": {
		$value: "{glass.deep}",
		$type: "color",
		$description: "Default background — deep glass",
	},
	"badge.root.border.color": {
		$value: "{border.subtle}",
		$type: "color",
		$description: "Border color",
	},
	"badge.root.border.width": {
		$value: "0.0625rem",
		$type: "dimension",
		$description: "Border width",
	},
	"badge.root.border-radius": {
		$value: "624.9375rem",
		$type: "dimension",
		$description: "Full pill radius",
	},
	"badge.root.color": {
		$value: "oklch(0.9319 0.0177 20.01)",
		$type: "color",
		$description: "Text color",
	},
	"badge.root.padding-inline": {
		$value: "0.5rem",
		$type: "dimension",
		$description: "Horizontal padding",
	},
	"badge.root.padding-block": {
		$value: "0.125rem",
		$type: "dimension",
		$description: "Vertical padding",
	},
	"badge.root.font-size": {
		$value: "0.75rem",
		$type: "dimension",
		$description: "Font size — xs",
	},
	"badge.root.font-weight": {
		$value: 500,
		$type: "number",
		$description: "Font weight — medium",
	},
	"badge.root.font-family": {
		$value: "{font.sans}",
		$type: "fontFamily",
		$description: "Font family",
	},
	"badge.root.gap": {
		$value: "0.25rem",
		$type: "dimension",
		$description: "Gap between icon and label",
	},
} as const;

/** Size-specific token overrides */
export const badgeSizeTokens = {
	sm: {
		"badge.root.padding-inline": { $value: "0.375rem", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "0.125rem", $type: "dimension" as const },
		"badge.root.font-size": { $value: "0.75rem", $type: "dimension" as const },
	},
	md: {
		"badge.root.padding-inline": { $value: "0.5rem", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "0.125rem", $type: "dimension" as const },
		"badge.root.font-size": { $value: "0.75rem", $type: "dimension" as const },
	},
	lg: {
		"badge.root.padding-inline": { $value: "0.625rem", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "0.25rem", $type: "dimension" as const },
		"badge.root.font-size": { $value: "0.875rem", $type: "dimension" as const },
	},
	xl: {
		"badge.root.padding-inline": { $value: "0.75rem", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "0.25rem", $type: "dimension" as const },
		"badge.root.font-size": { $value: "0.875rem", $type: "dimension" as const },
	},
} as const;
