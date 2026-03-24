/**
 * @file Avatar Tokens — as const DTCG
 * @kind avatar
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const avatarTokens = {
	"avatar.root.background": {
		$value: "{glass.deep}",
		$type: "color",
		$description: "Fallback background — deep glass",
	},
	"avatar.root.border.color": {
		$value: "{border.subtle}",
		$type: "color",
		$description: "Border color around avatar",
	},
	"avatar.root.border.width": {
		$value: "0.125rem",
		$type: "dimension",
		$description: "Border width",
	},
	"avatar.root.border-radius": {
		$value: "624.9375rem",
		$type: "dimension",
		$description: "Full circle radius",
	},
	"avatar.root.color": {
		$value: "oklch(0.9319 0.0177 20.01)",
		$type: "color",
		$description: "Fallback text color",
	},
	"avatar.root.font-size": {
		$value: "0.875rem",
		$type: "dimension",
		$description: "Fallback text font size",
	},
	"avatar.root.font-weight": {
		$value: 500,
		$type: "number",
		$description: "Fallback text font weight — medium",
	},
	"avatar.root.font-family": {
		$value: "{font.sans}",
		$type: "fontFamily",
		$description: "Font family for fallback text",
	},
} as const;
