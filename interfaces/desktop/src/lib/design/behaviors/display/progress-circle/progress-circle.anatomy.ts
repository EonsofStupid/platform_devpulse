/**
 * ProgressCircle anatomy — circular SVG progress/spinner indicator.
 *
 * Renders as an SVG with a track circle and a fill arc (progress indicator).
 * In indeterminate mode the fill arc animates with a spin/dash-offset loop.
 *
 * WAI-ARIA: role="progressbar" on the root SVG element.
 * aria-valuenow/aria-valuemin/aria-valuemax for determinate mode.
 * aria-label or aria-labelledby for an accessible name.
 */

export const progressCircleAnatomy = {
	slots: ["root", "track", "fill"] as const,
	attrs: {
		root: {
			"data-kind": "progress-circle",
			"data-slot": "root",
		},
		track: {
			"data-kind": "progress-circle",
			"data-slot": "track",
		},
		fill: {
			"data-kind": "progress-circle",
			"data-slot": "fill",
		},
	},
} as const;
