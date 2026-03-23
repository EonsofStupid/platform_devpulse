/**
 * @file Progress Tokens — as const DTCG
 * @kind progress
 *
 * SD5 source. All dimensions in px → SD5 transforms to rem.
 * References existing primitive/semantic tokens via {path} syntax.
 */

export const progressTokens = {
	"progress.track.background": {
		$value: "{surface.inset}",
		$type: "color",
		$description: "Track background — inset surface",
	},
	"progress.track.border-radius": {
		$value: "9999px",
		$type: "dimension",
		$description: "Track corner radius — fully rounded",
	},
	"progress.track.height.sm": {
		$value: "4px",
		$type: "dimension",
		$description: "Track height — small",
	},
	"progress.track.height.md": {
		$value: "8px",
		$type: "dimension",
		$description: "Track height — medium",
	},
	"progress.track.height.lg": {
		$value: "12px",
		$type: "dimension",
		$description: "Track height — large",
	},
	"progress.fill.background": {
		$value: "#2dd4bf",
		$type: "color",
		$description: "Fill bar background — teal accent",
	},
	"progress.fill.border-radius": {
		$value: "9999px",
		$type: "dimension",
		$description: "Fill bar corner radius — fully rounded",
	},
	"progress.fill.transition.duration": {
		$value: "300ms",
		$type: "duration",
		$description: "Fill width transition speed",
	},
} as const;
