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
		$value: "2px",
		$type: "dimension",
		$description: "Border width",
	},
	"avatar.root.border-radius": {
		$value: "9999px",
		$type: "dimension",
		$description: "Full circle radius",
	},
	"avatar.root.color": {
		$value: "#e2e8f0",
		$type: "color",
		$description: "Fallback text color",
	},
	"avatar.root.font-size": {
		$value: "14px",
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
