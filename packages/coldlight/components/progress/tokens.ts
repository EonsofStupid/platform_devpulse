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
		$value: "624.9375rem",
		$type: "dimension",
		$description: "Track corner radius — fully rounded",
	},
	"progress.track.height.sm": {
		$value: "0.25rem",
		$type: "dimension",
		$description: "Track height — small",
	},
	"progress.track.height.md": {
		$value: "0.5rem",
		$type: "dimension",
		$description: "Track height — medium",
	},
	"progress.track.height.lg": {
		$value: "0.75rem",
		$type: "dimension",
		$description: "Track height — large",
	},
	"progress.fill.background": {
		$value: "oklch(0.7887 0.0798 173.06)",
		$type: "color",
		$description: "Fill bar background — teal accent",
	},
	"progress.fill.border-radius": {
		$value: "624.9375rem",
		$type: "dimension",
		$description: "Fill bar corner radius — fully rounded",
	},
	"progress.fill.transition.duration": {
		$value: "300ms",
		$type: "duration",
		$description: "Fill width transition speed",
	},
} as const;
