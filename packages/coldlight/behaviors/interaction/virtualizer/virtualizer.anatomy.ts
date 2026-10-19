/**
 * Virtualizer anatomy — virtual scrolling container.
 *
 * A virtualizer renders only the visible items in a long list,
 * dramatically reducing DOM node count and improving performance.
 *
 * Anatomy:
 * - root: The outer scrollable container (overflow-y: auto, fixed height)
 * - inner: Full-height spacer that creates the scrollbar (height = totalSize)
 * - items: The rendered item window, positioned absolutely within inner
 *
 * WAI-ARIA: The root carries role="region" with aria-label.
 * The items container carries aria-rowcount for grid/list contexts.
 */

export const virtualizerAnatomy = {
	slots: ["root", "inner", "items"] as const,
	attrs: {
		root: {
			"data-kind": "virtualizer",
			"data-slot": "root",
		},
		inner: {
			"data-kind": "virtualizer",
			"data-slot": "inner",
		},
		items: {
			"data-kind": "virtualizer",
			"data-slot": "items",
		},
	},
} as const;
