/**
 * useDragAndDrop — ColdLight drag source primitive hook.
 *
 * Manages HTML5 drag state for a draggable element. Populates
 * dataTransfer with the provided dragData map on drag start.
 * Tracks dragging state via $state for reactive styling.
 *
 * Keyboard accessibility: drag sources should also support
 * useMove() or a dedicated cut/paste keyboard interaction pattern
 * (WAI-ARIA APG does not standardise DnD keyboard, so describe
 * available keyboard interaction via aria-description).
 *
 * @example
 * ```svelte
 * <script>
 *   import { useDragAndDrop } from '#coldlight/coldlight';
 *   const dnd = useDragAndDrop({
 *     dragData: { 'text/plain': 'item-42' },
 *     dragDescription: 'Drag to reorder this item',
 *   });
 * </script>
 * <div {...dnd.dragProps}>
 *   Draggable item
 * </div>
 * ```
 */

import { dragAndDropAnatomy } from "./drag-and-drop.anatomy.js";
import type { UseDragAndDropProps, UseDragAndDropReturn } from "./drag-and-drop.types.js";

export function useDragAndDrop(props: UseDragAndDropProps = {}): UseDragAndDropReturn {
	let isDragging = $state(false);

	function handleDragStart(e: DragEvent): void {
		if (props.disabled) {
			e.preventDefault();
			return;
		}
		isDragging = true;
		if (e.dataTransfer && props.dragData) {
			for (const [type, value] of Object.entries(props.dragData)) {
				e.dataTransfer.setData(type, value);
			}
		}
		props.onDragStart?.(e);
	}

	function handleDragEnd(e: DragEvent): void {
		isDragging = false;
		props.onDragEnd?.(e);
	}

	const dragProps = $derived({
		...dragAndDropAnatomy.attrs.root,
		draggable: (props.disabled ? "false" : "true") as "true" | "false",
		"aria-description": props.dragDescription,
		"data-state": isDragging ? ("dragging" as const) : ("idle" as const),
		ondragstart: handleDragStart,
		ondragend: handleDragEnd,
	});

	const dragHandleProps = $derived({
		...dragAndDropAnatomy.attrs["drag-handle"],
	});

	return {
		get isDragging() {
			return isDragging;
		},
		get dragProps() {
			return dragProps;
		},
		get dragHandleProps() {
			return dragHandleProps;
		},
	};
}
