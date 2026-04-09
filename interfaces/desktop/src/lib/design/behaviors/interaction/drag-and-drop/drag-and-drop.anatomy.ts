/**
 * DragAndDrop anatomy — draggable source element.
 *
 * The drag source is any element that can be dragged to a drop zone.
 * Uses the HTML5 Drag and Drop API with keyboard accessibility.
 *
 * WAI-ARIA: draggable items should convey their draggable state.
 * When a drag is in progress, aria-grabbed="true" (deprecated in ARIA 1.1
 * but still used for compatibility). Modern pattern: data-dragging attribute
 * consumed by CSS + aria-description or aria-label for instructions.
 */

export const dragAndDropAnatomy = {
	slots: ["root", "drag-handle", "drag-preview"] as const,
	attrs: {
		root: {
			"data-kind": "drag-and-drop",
			"data-slot": "root",
		},
		"drag-handle": {
			"data-kind": "drag-and-drop",
			"data-slot": "drag-handle",
		},
		"drag-preview": {
			"data-kind": "drag-and-drop",
			"data-slot": "drag-preview",
		},
	},
} as const;
