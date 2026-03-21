/**
 * @file useColorAreaDrag — Svelte 5 action for 2D pointer tracking
 * @kind color-area
 * @layer components
 *
 * Svelte action that handles pointer capture, drag tracking, and
 * keyboard channel adjustment for the ColorArea component.
 *
 * Returns normalized x/y percentages (0-1) via reactive $state.
 */

export interface ColorAreaDragState {
	readonly xPercent: number;
	readonly yPercent: number;
	readonly isDragging: boolean;
}

export interface UseColorAreaDragProps {
	/** Get disabled state reactively. */
	disabled: () => boolean;
	/** RTL direction flips x axis. */
	rtl: () => boolean;
	/** Step size for keyboard (fraction of 1). */
	step: () => number;
	/** Called on every position change during drag. */
	onChange: (x: number, y: number) => void;
	/** Called when drag ends. */
	onChangeEnd: (x: number, y: number) => void;
}

export function useColorAreaDrag(props: UseColorAreaDragProps): {
	state: ColorAreaDragState;
	/** Pointer tracking action — attach to root container. */
	action: (node: HTMLElement) => { destroy: () => void };
	/** Keyboard action — attach to the focusable thumb element. */
	thumbAction: (node: HTMLElement) => { destroy: () => void };
} {
	let xPercent = $state(0.5);
	let yPercent = $state(0.5);
	let isDragging = $state(false);

	function clamp(v: number): number {
		return Math.max(0, Math.min(1, v));
	}

	// Keyboard handlers — shared between action scopes, live at parent level
	function onKeyDown(e: KeyboardEvent) {
		if (props.disabled()) return;
		const delta = props.step();
		let handled = true;

		switch (e.key) {
			case "ArrowRight": xPercent = clamp(xPercent + delta); break;
			case "ArrowLeft": xPercent = clamp(xPercent - delta); break;
			case "ArrowUp": yPercent = clamp(yPercent + delta); break;
			case "ArrowDown": yPercent = clamp(yPercent - delta); break;
			case "PageUp": yPercent = clamp(yPercent + delta * 10); break;
			case "PageDown": yPercent = clamp(yPercent - delta * 10); break;
			case "Home": xPercent = 0; yPercent = 0; break;
			case "End": xPercent = 1; yPercent = 1; break;
			default: handled = false;
		}

		if (handled) {
			e.preventDefault();
			props.onChange(xPercent, yPercent);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
			props.onChangeEnd(xPercent, yPercent);
		}
	}

	/** Pointer tracking action — attach to root container. */
	function action(node: HTMLElement) {
		function updateFromPointer(e: PointerEvent) {
			const rect = node.getBoundingClientRect();
			const rawX = clamp((e.clientX - rect.left) / rect.width);
			const rawY = clamp(1 - (e.clientY - rect.top) / rect.height);
			xPercent = props.rtl() ? 1 - rawX : rawX;
			yPercent = rawY;
			props.onChange(xPercent, yPercent);
		}

		function onPointerDown(e: PointerEvent) {
			if (props.disabled()) return;
			isDragging = true;
			node.setPointerCapture(e.pointerId);
			updateFromPointer(e);
		}

		function onPointerMove(e: PointerEvent) {
			if (!isDragging) return;
			updateFromPointer(e);
		}

		function endDrag(e: PointerEvent) {
			if (!isDragging) return;
			isDragging = false;
			try { node.releasePointerCapture(e.pointerId); } catch { /* already released */ }
			props.onChangeEnd(xPercent, yPercent);
		}

		node.style.touchAction = "none";

		node.addEventListener("pointerdown", onPointerDown);
		node.addEventListener("pointermove", onPointerMove);
		node.addEventListener("pointerup", endDrag);
		node.addEventListener("pointercancel", endDrag);

		return {
			destroy() {
				node.removeEventListener("pointerdown", onPointerDown);
				node.removeEventListener("pointermove", onPointerMove);
				node.removeEventListener("pointerup", endDrag);
				node.removeEventListener("pointercancel", endDrag);
			},
		};
	}

	/** Svelte action for the thumb — handles keyboard only. */
	function thumbAction(node: HTMLElement) {
		node.addEventListener("keydown", onKeyDown);
		node.addEventListener("keyup", onKeyUp);

		return {
			destroy() {
				node.removeEventListener("keydown", onKeyDown);
				node.removeEventListener("keyup", onKeyUp);
			},
		};
	}

	return {
		state: {
			get xPercent() { return xPercent; },
			get yPercent() { return yPercent; },
			get isDragging() { return isDragging; },
		},
		action,
		thumbAction,
	};
}
