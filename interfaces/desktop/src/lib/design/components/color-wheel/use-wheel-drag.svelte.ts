/**
 * @file useWheelDrag — Svelte 5 action for circular pointer tracking
 * @kind color-wheel
 * @layer components
 *
 * Converts cartesian pointer coordinates to angle (0-360) via atan2.
 * Track action for pointer, thumb action for keyboard.
 */

export interface WheelDragState {
	readonly angle: number;
	readonly isDragging: boolean;
}

export interface UseWheelDragProps {
	disabled: () => boolean;
	step: () => number;
	onChange: (angle: number) => void;
	onChangeEnd: (angle: number) => void;
}

export function useWheelDrag(props: UseWheelDragProps): {
	state: WheelDragState;
	trackAction: (node: HTMLElement) => { destroy: () => void };
	thumbAction: (node: HTMLElement) => { destroy: () => void };
	setAngle: (a: number) => void;
} {
	let angle = $state(0);
	let isDragging = $state(false);

	function normalizeAngle(a: number): number {
		return ((a % 360) + 360) % 360;
	}

	function setAngle(a: number) {
		angle = normalizeAngle(a);
	}

	function angleFromPointer(node: HTMLElement, clientX: number, clientY: number): number {
		const rect = node.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const rad = Math.atan2(cy - clientY, clientX - cx);
		return normalizeAngle(rad * (180 / Math.PI));
	}

	// Keyboard
	function onKeyDown(e: KeyboardEvent) {
		if (props.disabled()) return;
		const delta = props.step();
		let handled = true;

		switch (e.key) {
			case "ArrowRight":
			case "ArrowUp":
				angle = normalizeAngle(angle + delta);
				break;
			case "ArrowLeft":
			case "ArrowDown":
				angle = normalizeAngle(angle - delta);
				break;
			case "PageUp":
				angle = normalizeAngle(angle + delta * 10);
				break;
			case "PageDown":
				angle = normalizeAngle(angle - delta * 10);
				break;
			case "Home":
				angle = 0;
				break;
			case "End":
				angle = 359;
				break;
			default:
				handled = false;
		}

		if (handled) {
			e.preventDefault();
			props.onChange(angle);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		const keys = [
			"ArrowRight",
			"ArrowLeft",
			"ArrowUp",
			"ArrowDown",
			"PageUp",
			"PageDown",
			"Home",
			"End",
		];
		if (keys.includes(e.key)) {
			props.onChangeEnd(angle);
		}
	}

	// Pointer (on track/ring)
	function trackAction(node: HTMLElement) {
		function onPointerDown(e: PointerEvent) {
			if (props.disabled()) return;
			isDragging = true;
			node.setPointerCapture(e.pointerId);
			angle = angleFromPointer(node, e.clientX, e.clientY);
			props.onChange(angle);
		}

		function onPointerMove(e: PointerEvent) {
			if (!isDragging) return;
			angle = angleFromPointer(node, e.clientX, e.clientY);
			props.onChange(angle);
		}

		function endDrag(e: PointerEvent) {
			if (!isDragging) return;
			isDragging = false;
			try {
				node.releasePointerCapture(e.pointerId);
			} catch {
				/* */
			}
			props.onChangeEnd(angle);
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
			get angle() {
				return angle;
			},
			get isDragging() {
				return isDragging;
			},
		},
		trackAction,
		thumbAction,
		setAngle,
	};
}
