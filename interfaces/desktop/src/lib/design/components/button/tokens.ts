/**
 * @file Button Tokens — as const DTCG
 * @kind button
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const buttonTokens = {
	"button.root.background.default": {
		$value: "{glass.deep}",
		$type: "color",
		$description: "Default background — deep glass surface",
	},
	"button.root.background.hover": {
		$value: "{glass.smoke}",
		$type: "color",
		$description: "Hover background — smoke glass",
	},
	"button.root.padding-inline": {
		$value: "16px",
		$type: "dimension",
		$description: "Horizontal padding",
	},
	"button.root.padding-block": {
		$value: "10px",
		$type: "dimension",
		$description: "Vertical padding",
	},
	"button.root.height": {
		$value: "40px",
		$type: "dimension",
		$description: "Default height (md)",
	},
	"button.root.border-radius": {
		$value: "{radius.lg}",
		$type: "dimension",
		$description: "Corner radius",
	},
	"button.root.border.color": {
		$value: "{border.strong}",
		$type: "color",
		$description: "Border color",
	},
	"button.root.border.width": {
		$value: "1px",
		$type: "dimension",
		$description: "Border width",
	},
	"button.root.color.default": {
		$value: "#ffffff",
		$type: "color",
		$description: "Text color — white on primary",
	},
	"button.root.shadow": {
		$value: "{shadow.z1}",
		$type: "shadow",
		$description: "Drop shadow — subtle elevation",
	},
	"button.root.font-size": {
		$value: "14px",
		$type: "dimension",
		$description: "Font size",
	},
	"button.root.font-weight": {
		$value: 500,
		$type: "number",
		$description: "Font weight — medium",
	},
	"button.root.font-family": {
		$value: "{font.sans}",
		$type: "fontFamily",
		$description: "Font family — system sans",
	},
	"button.root.transition.duration": {
		$value: "150ms",
		$type: "duration",
		$description: "Transition speed",
	},
	"button.root.gap": {
		$value: "8px",
		$type: "dimension",
		$description: "Gap between icon and label",
	},
} as const;

/** Size-specific token overrides */
export const buttonSizeTokens = {
	sm: {
		"button.root.height": { $value: "32px", $type: "dimension" as const },
		"button.root.padding-inline": { $value: "12px", $type: "dimension" as const },
		"button.root.padding-block": { $value: "6px", $type: "dimension" as const },
		"button.root.font-size": { $value: "14px", $type: "dimension" as const },
		"button.root.gap": { $value: "6px", $type: "dimension" as const },
	},
	md: {
		"button.root.height": { $value: "40px", $type: "dimension" as const },
		"button.root.padding-inline": { $value: "16px", $type: "dimension" as const },
		"button.root.padding-block": { $value: "10px", $type: "dimension" as const },
		"button.root.font-size": { $value: "14px", $type: "dimension" as const },
		"button.root.gap": { $value: "8px", $type: "dimension" as const },
	},
	lg: {
		"button.root.height": { $value: "48px", $type: "dimension" as const },
		"button.root.padding-inline": { $value: "24px", $type: "dimension" as const },
		"button.root.padding-block": { $value: "12px", $type: "dimension" as const },
		"button.root.font-size": { $value: "16px", $type: "dimension" as const },
		"button.root.gap": { $value: "10px", $type: "dimension" as const },
	},
} as const;
