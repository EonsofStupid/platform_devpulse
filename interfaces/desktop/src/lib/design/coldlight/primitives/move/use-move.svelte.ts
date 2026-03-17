/**
 * useMove — ColdLight interaction primitive.
 *
 * Tracks pointer/touch movement and reports deltaX/deltaY.
 * Also handles keyboard arrows for accessible movement (with step size).
 * Used by sliders, color pickers, and drag-based controls.
 *
 * Pointer tracking:
 * - Attaches pointermove/pointerup to document on pointerdown
 * - Reports pixel deltas between frames
 * - Cleans up on pointerup or pointercancel
 *
 * Keyboard tracking:
 * - Arrow keys fire onMove with step-based deltas
 * - Default step: 1
 *
 * @example
 * ```svelte
 * <script>
 *   import { useMove } from '$lib/design/coldlight';
 *   let x = $state(50);
 *   const { moveProps } = useMove({
 *     onMove: (e) => { x += e.deltaX; },
 *   });
 * </script>
 * <div {...moveProps} tabindex="0" style="left: {x}px" />
 * ```
 */

import { kbd } from "../../_internal/utils/kbd.js";
import type { MoveEvent, UseMoveProps, UseMoveReturn } from "./move.types.js";

const KEYBOARD_STEP = 1;

export function useMove(props: UseMoveProps = {}): UseMoveReturn {
	let lastX = 0;
	let lastY = 0;
	let activePointerType: "mouse" | "touch" | "pen" | null = null;

	function handlePointerMove(e: PointerEvent): void {
		const deltaX = e.clientX - lastX;
		const deltaY = e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;

		props.onMove?.({
			deltaX,
			deltaY,
			pointerType: activePointerType ?? "mouse",
		});
	}

	function handlePointerUp(): void {
		activePointerType = null;
		document.removeEventListener("pointermove", handlePointerMove);
		document.removeEventListener("pointerup", handlePointerUp);
		document.removeEventListener("pointercancel", handlePointerUp);
		props.onMoveEnd?.();
	}

	function handlePointerDown(e: PointerEvent): void {
		// Prevent text selection during drag
		e.preventDefault();

		lastX = e.clientX;
		lastY = e.clientY;
		activePointerType = e.pointerType as "mouse" | "touch" | "pen";

		props.onMoveStart?.();

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
		document.addEventListener("pointercancel", handlePointerUp);
	}

	function handleKeyDown(e: KeyboardEvent): void {
		let deltaX = 0;
		let deltaY = 0;

		switch (e.key) {
			case kbd.ARROW_LEFT:
				deltaX = -KEYBOARD_STEP;
				break;
			case kbd.ARROW_RIGHT:
				deltaX = KEYBOARD_STEP;
				break;
			case kbd.ARROW_UP:
				deltaY = -KEYBOARD_STEP;
				break;
			case kbd.ARROW_DOWN:
				deltaY = KEYBOARD_STEP;
				break;
			default:
				return;
		}

		e.preventDefault();

		const evt: MoveEvent = { deltaX, deltaY, pointerType: "keyboard" };
		props.onMove?.(evt);
	}

	const moveProps = $derived({
		onpointerdown: handlePointerDown,
		onkeydown: handleKeyDown,
		tabindex: 0,
	});

	return {
		get moveProps() {
			return moveProps;
		},
	};
}
