/**
 * DropZone anatomy — target area that accepts dragged items.
 *
 * A drop zone is a region that visually and programmatically signals
 * it can accept dragged content. It transitions through idle → active
 * (something is being dragged) → over (dragged item is above this zone).
 *
 * WAI-ARIA: role="region" with aria-label describing what can be dropped.
 * tabindex="0" makes it keyboard-focusable for accessible paste operations.
 */

export const dropZoneAnatomy = {
	slots: ["root", "indicator"] as const,
	attrs: {
		root: {
			"data-kind": "drop-zone",
			"data-slot": "root",
		},
		indicator: {
			"data-kind": "drop-zone",
			"data-slot": "indicator",
			"aria-hidden": "true" as const,
		},
	},
} as const;
