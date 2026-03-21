/**
 * @file useSliderDrag — Svelte 5 action for 1D pointer/keyboard tracking
 * @kind color-slider
 * @layer components
 *
 * Single-axis version of useColorAreaDrag.
 * Returns a normalized percent (0-1) via reactive $state.
 * Track action for pointer, thumb action for keyboard.
 */

export interface SliderDragState {
	readonly percent: number;
	readonly isDragging: boolean;
}

export interface UseSliderDragProps {
	disabled: () => boolean;
	rtl: () => boolean;
	vertical: () => boolean;
	step: () => number;
	onChange: (percent: number) => void;
	onChangeEnd: (percent: number) => void;
}

export function useSliderDrag(props: UseSliderDragProps): {
	state: SliderDragState;
	trackAction: (node: HTMLElement) => { destroy: () => void };
	thumbAction: (node: HTMLElement) => { destroy: () => void };
} {
	let percent = $state(0.5);
	let isDragging = $state(false);

	function clamp(v: number): number {
		return Math.max(0, Math.min(1, v));
	}

	/** Set percent externally (e.g., from controlled value sync). */
	function setPercent(v: number) {
		percent = clamp(v);
	}

	// ── Keyboard (attached to thumb) ────────────────────────────
	function onKeyDown(e: KeyboardEvent) {
		if (props.disabled()) return;
		const delta = props.step();
		let handled = true;

		const increase = props.vertical() ? "ArrowUp" : "ArrowRight";
		const decrease = props.vertical() ? "ArrowDown" : "ArrowLeft";

		switch (e.key) {
			case increase: percent = clamp(percent + delta); break;
			case decrease: percent = clamp(percent - delta); break;
			case "PageUp": percent = clamp(percent + delta * 10); break;
			case "PageDown": percent = clamp(percent - delta * 10); break;
			case "Home": percent = 0; break;
			case "End": percent = 1; break;
			default: handled = false;
		}

		if (handled) {
			e.preventDefault();
			props.onChange(percent);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
		if (keys.includes(e.key)) {
			props.onChangeEnd(percent);
		}
	}

	// ── Pointer (attached to track) ─────────────────────────────
	function trackAction(node: HTMLElement) {
		function updateFromPointer(e: PointerEvent) {
			const rect = node.getBoundingClientRect();
			let raw: number;
			if (props.vertical()) {
				raw = clamp(1 - (e.clientY - rect.top) / rect.height);
			} else {
				raw = clamp((e.clientX - rect.left) / rect.width);
				if (props.rtl()) raw = 1 - raw;
			}
			percent = raw;
			props.onChange(percent);
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
			props.onChangeEnd(percent);
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
			get percent() { return percent; },
			get isDragging() { return isDragging; },
		},
		trackAction,
		thumbAction,
	};
}
