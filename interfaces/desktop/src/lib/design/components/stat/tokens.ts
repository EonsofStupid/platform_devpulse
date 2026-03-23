/**
 * @file Stat Tokens — as const DTCG
 * @kind stat
 */

export const statTokens = {
	"stat.root.value.font-family": {
		$value: "{font.display}",
		$type: "fontFamily",
		$description: "Display font for stat value",
	},
	"stat.root.value.font-size": {
		$value: "24px",
		$type: "dimension",
		$description: "Value font size (md)",
	},
	"stat.root.value.font-weight": {
		$value: 700,
		$type: "number",
		$description: "Value font weight — bold",
	},
	"stat.root.value.color": {
		$value: "{color.teal.400}",
		$type: "color",
		$description: "Value text color",
	},
	"stat.root.value.glow-radius": {
		$value: "12px",
		$type: "dimension",
		$description: "Text glow blur radius",
	},
	"stat.root.value.glow-color": {
		$value: "{glow.teal}",
		$type: "color",
		$description: "Text glow color",
	},
	"stat.root.label.font-size": {
		$value: "12px",
		$type: "dimension",
		$description: "Label font size",
	},
	"stat.root.label.color": {
		$value: "{color.neutral.500}",
		$type: "color",
		$description: "Label text color",
	},
	"stat.root.gap": {
		$value: "4px",
		$type: "dimension",
		$description: "Gap between label and value",
	},
} as const;

export const statSizeTokens = {
	sm: {
		"stat.root.value.font-size": { $value: "18px", $type: "dimension" as const },
		"stat.root.value.glow-radius": { $value: "8px", $type: "dimension" as const },
		"stat.root.label.font-size": { $value: "11px", $type: "dimension" as const },
	},
	md: {
		"stat.root.value.font-size": { $value: "24px", $type: "dimension" as const },
		"stat.root.value.glow-radius": { $value: "12px", $type: "dimension" as const },
		"stat.root.label.font-size": { $value: "12px", $type: "dimension" as const },
	},
	lg: {
		"stat.root.value.font-size": { $value: "32px", $type: "dimension" as const },
		"stat.root.value.glow-radius": { $value: "16px", $type: "dimension" as const },
		"stat.root.label.font-size": { $value: "14px", $type: "dimension" as const },
	},
} as const;
