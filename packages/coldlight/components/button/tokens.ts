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
		$value: "1rem",
		$type: "dimension",
		$description: "Horizontal padding",
	},
	"button.root.padding-block": {
		$value: "0.625rem",
		$type: "dimension",
		$description: "Vertical padding",
	},
	"button.root.height": {
		$value: "2.5rem",
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
		$value: "0.0625rem",
		$type: "dimension",
		$description: "Border width",
	},
	"button.root.color.default": {
		$value: "oklch(1.0032 0.0305 28.88)",
		$type: "color",
		$description: "Text color — white on primary",
	},
	"button.root.shadow": {
		$value: "{shadow.z1}",
		$type: "shadow",
		$description: "Drop shadow — subtle elevation",
	},
	"button.root.font-size": {
		$value: "0.875rem",
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
		$value: "0.5rem",
		$type: "dimension",
		$description: "Gap between icon and label",
	},
} as const;

/** Size-specific token overrides */
export const buttonSizeTokens = {
	sm: {
		"button.root.height": { $value: "2rem", $type: "dimension" as const },
		"button.root.padding-inline": { $value: "0.75rem", $type: "dimension" as const },
		"button.root.padding-block": { $value: "0.375rem", $type: "dimension" as const },
		"button.root.font-size": { $value: "0.875rem", $type: "dimension" as const },
		"button.root.gap": { $value: "0.375rem", $type: "dimension" as const },
	},
	md: {
		"button.root.height": { $value: "2.5rem", $type: "dimension" as const },
		"button.root.padding-inline": { $value: "1rem", $type: "dimension" as const },
		"button.root.padding-block": { $value: "0.625rem", $type: "dimension" as const },
		"button.root.font-size": { $value: "0.875rem", $type: "dimension" as const },
		"button.root.gap": { $value: "0.5rem", $type: "dimension" as const },
	},
	lg: {
		"button.root.height": { $value: "3rem", $type: "dimension" as const },
		"button.root.padding-inline": { $value: "1.5rem", $type: "dimension" as const },
		"button.root.padding-block": { $value: "0.75rem", $type: "dimension" as const },
		"button.root.font-size": { $value: "1rem", $type: "dimension" as const },
		"button.root.gap": { $value: "0.625rem", $type: "dimension" as const },
	},
} as const;
