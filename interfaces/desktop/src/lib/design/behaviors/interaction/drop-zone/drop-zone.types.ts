import type { HTMLAttributes } from "svelte/elements";

export type DropZoneState = "idle" | "active" | "over" | "rejected";

/** Predicate to test whether a dragged item is acceptable. */
export type DropZoneAcceptFn = (e: DragEvent) => boolean;

export interface UseDropZoneProps {
	/** Whether the drop zone is disabled. */
	disabled?: boolean;
	/**
	 * MIME types or custom data types this zone accepts.
	 * Example: ["text/plain", "application/json"]
	 * When omitted, accepts any data type.
	 */
	accept?: string[];
	/**
	 * Custom accept predicate for finer-grained control.
	 * Called on dragenter/dragover. Return false to reject.
	 */
	acceptFn?: DropZoneAcceptFn;
	/**
	 * dataTransfer.dropEffect to signal intent.
	 * "copy" | "move" | "link" | "none". Defaults to "copy".
	 */
	dropEffect?: DataTransfer["dropEffect"];
	/** Accessible label describing what can be dropped here. */
	"aria-label"?: string;
	/** Called when a valid drag enters the zone. */
	onDragEnter?: (e: DragEvent) => void;
	/** Called when the drag leaves the zone. */
	onDragLeave?: (e: DragEvent) => void;
	/** Called when a drop is accepted. */
	onDrop?: (e: DragEvent) => void;
}

export type DropZoneRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "drop-zone";
	"data-slot": "root";
	"data-state": DropZoneState;
};

export type DropZoneIndicatorAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "drop-zone";
	"data-slot": "indicator";
	"aria-hidden": "true";
};

export interface UseDropZoneReturn {
	readonly state: DropZoneState;
	readonly isOver: boolean;
	readonly root: DropZoneRootAttrs;
	readonly indicator: DropZoneIndicatorAttrs;
}
