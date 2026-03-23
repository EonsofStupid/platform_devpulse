/**
 * @file StatusDot Tokens — as const DTCG
 * @kind status-dot
 *
 * Color per status from signal/accent tokens. Glow radius. Size.
 * SD5 source. Dimensions in px → rem.
 */

export const statusDotTokens = {
	"status-dot.root.size": {
		$value: "8px",
		$type: "dimension",
		$description: "Dot diameter",
	},
	"status-dot.root.border-radius": {
		$value: "9999px",
		$type: "dimension",
		$description: "Full circle",
	},
	"status-dot.root.glow-radius": {
		$value: "6px",
		$type: "dimension",
		$description: "Glow blur radius for box-shadow",
	},
	"status-dot.root.color.online": {
		$value: "{color.teal.400}",
		$type: "color",
		$description: "Online/ready/success status",
	},
	"status-dot.root.color.offline": {
		$value: "{color.red.500}",
		$type: "color",
		$description: "Offline/failed/error status",
	},
	"status-dot.root.color.loading": {
		$value: "{color.purple.400}",
		$type: "color",
		$description: "Loading/connecting status",
	},
	"status-dot.root.color.pending": {
		$value: "{color.neutral.500}",
		$type: "color",
		$description: "Pending/unknown status",
	},
	"status-dot.root.color.hybrid": {
		$value: "{color.purple.400}",
		$type: "color",
		$description: "Hybrid/partial status",
	},
	"status-dot.root.color.ready": {
		$value: "{color.teal.400}",
		$type: "color",
		$description: "Ready status (alias for online)",
	},
	"status-dot.root.color.failed": {
		$value: "{color.red.500}",
		$type: "color",
		$description: "Failed status (alias for offline)",
	},
} as const;

export const statusDotSizeTokens = {
	sm: {
		"status-dot.root.size": { $value: "6px", $type: "dimension" as const },
		"status-dot.root.glow-radius": { $value: "4px", $type: "dimension" as const },
	},
	md: {
		"status-dot.root.size": { $value: "8px", $type: "dimension" as const },
		"status-dot.root.glow-radius": { $value: "6px", $type: "dimension" as const },
	},
	lg: {
		"status-dot.root.size": { $value: "10px", $type: "dimension" as const },
		"status-dot.root.glow-radius": { $value: "8px", $type: "dimension" as const },
	},
} as const;
