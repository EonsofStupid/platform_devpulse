/**
 * useMove — prop and return types.
 *
 * Tracks pointer/touch/keyboard movement. Reports deltaX/deltaY.
 * Used by sliders, color pickers, and drag-based controls.
 */

export interface MoveEvent {
	/** Horizontal delta in pixels (pointer) or step units (keyboard). */
	deltaX: number;
	/** Vertical delta in pixels (pointer) or step units (keyboard). */
	deltaY: number;
	/** Whether the move was triggered by pointer or keyboard. */
	pointerType: "mouse" | "touch" | "pen" | "keyboard";
}

export interface UseMoveProps {
	/** Callback fired when a move interaction starts. */
	onMoveStart?: () => void;
	/** Callback fired on each move tick with delta values. */
	onMove?: (e: MoveEvent) => void;
	/** Callback fired when the move interaction ends. */
	onMoveEnd?: () => void;
}

export interface MovePropsAttrs {
	onpointerdown: (e: PointerEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
	tabindex: 0;
}

export interface UseMoveReturn {
	/** Spread onto the target element. */
	readonly moveProps: MovePropsAttrs;
}
