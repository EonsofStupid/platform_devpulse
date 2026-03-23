/**
 * @file Card Tokens — as const DTCG
 * @kind card
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const cardTokens = {
	"card.root.background": {
		$value: "{glass.deep}",
		$type: "color",
		$description: "Default background — deep glass",
	},
	"card.root.border.color": {
		$value: "{border.subtle}",
		$type: "color",
		$description: "Border color",
	},
	"card.root.border.width": {
		$value: "1px",
		$type: "dimension",
		$description: "Border width",
	},
	"card.root.border-radius": {
		$value: "{radius.lg}",
		$type: "dimension",
		$description: "Corner radius",
	},
	"card.root.shadow": {
		$value: "{shadow.z1}",
		$type: "shadow",
		$description: "Drop shadow — subtle elevation",
	},
	"card.root.padding": {
		$value: "16px",
		$type: "dimension",
		$description: "Inner padding",
	},
	"card.root.color": {
		$value: "#e2e8f0",
		$type: "color",
		$description: "Default text color within card",
	},
	"card.root.opacity.disabled": {
		$value: 0.6,
		$type: "number",
		$description: "Opacity when disabled",
	},
	"card.root.transition.duration": {
		$value: "150ms",
		$type: "duration",
		$description: "Transition speed for hover states",
	},
} as const;
