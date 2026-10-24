import type { HTMLAttributes } from "svelte/elements";

export type DragAndDropState = "idle" | "dragging";

/** Arbitrary key-value data attached to the drag payload. */
export type DragData = Record<string, string>;

export interface UseDragAndDropProps {
	/** Whether dragging is disabled. */
	disabled?: boolean;
	/**
	 * Data to attach to the drag event's dataTransfer.
	 * Keys are MIME types, values are the data string.
	 * Example: { "text/plain": "item-id-123" }
	 */
	dragData?: DragData;
	/**
	 * Accessible description of what will happen when this item is dragged.
	 * Announced to screen readers. Example: "Drag to reorder".
	 */
	dragDescription?: string;
	/** Called when drag starts. */
	onDragStart?: (e: DragEvent) => void;
	/** Called when drag ends (regardless of success). */
	onDragEnd?: (e: DragEvent) => void;
}

export type DragRootAttrs = HTMLAttributes<HTMLElement> & {
	"data-kind": "drag-and-drop";
	"data-slot": "root";
	"data-state": DragAndDropState;
	draggable?: "true" | "false";
};

export type DragHandleAttrs = HTMLAttributes<HTMLElement> & {
	"data-kind": "drag-and-drop";
	"data-slot": "drag-handle";
};

export interface UseDragAndDropReturn {
	/** Current drag state. */
	readonly isDragging: boolean;
	/** Spread onto the draggable root element. */
	readonly dragProps: DragRootAttrs;
	/** Spread onto an optional drag handle element. */
	readonly dragHandleProps: DragHandleAttrs;
}
