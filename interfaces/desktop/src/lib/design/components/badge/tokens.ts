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
		$value: "1px",
		$type: "dimension",
		$description: "Border width",
	},
	"badge.root.border-radius": {
		$value: "9999px",
		$type: "dimension",
		$description: "Full pill radius",
	},
	"badge.root.color": {
		$value: "#e2e8f0",
		$type: "color",
		$description: "Text color",
	},
	"badge.root.padding-inline": {
		$value: "8px",
		$type: "dimension",
		$description: "Horizontal padding",
	},
	"badge.root.padding-block": {
		$value: "2px",
		$type: "dimension",
		$description: "Vertical padding",
	},
	"badge.root.font-size": {
		$value: "12px",
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
		$value: "4px",
		$type: "dimension",
		$description: "Gap between icon and label",
	},
} as const;

/** Size-specific token overrides */
export const badgeSizeTokens = {
	sm: {
		"badge.root.padding-inline": { $value: "6px", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "2px", $type: "dimension" as const },
		"badge.root.font-size": { $value: "12px", $type: "dimension" as const },
	},
	md: {
		"badge.root.padding-inline": { $value: "8px", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "2px", $type: "dimension" as const },
		"badge.root.font-size": { $value: "12px", $type: "dimension" as const },
	},
	lg: {
		"badge.root.padding-inline": { $value: "10px", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "4px", $type: "dimension" as const },
		"badge.root.font-size": { $value: "14px", $type: "dimension" as const },
	},
	xl: {
		"badge.root.padding-inline": { $value: "12px", $type: "dimension" as const },
		"badge.root.padding-block": { $value: "4px", $type: "dimension" as const },
		"badge.root.font-size": { $value: "14px", $type: "dimension" as const },
	},
} as const;
