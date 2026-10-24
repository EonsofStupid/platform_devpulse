/**
 * useColorWheel — ColdLight circular hue picker primitive hook.
 *
 * Svelte 5 runes-native. Returns reactive ARIA attributes, keyboard
 * handlers, data attributes, and pointer capture for a circular track
 * that selects a hue angle (0°–360°).
 *
 * Pointer coordinates are converted to an angle via atan2 relative to
 * the track's centre. The thumb is positioned on the ring using CSS
 * variables (`--cw-x`, `--cw-y`) that the component can reference in
 * its `style:transform`.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { createIds } from "../../_internal/utils/uid.js";
import { colorWheelAnatomy } from "./color-wheel.anatomy.js";
import type { UseColorWheelProps, UseColorWheelReturn } from "./color-wheel.types.js";

export function useColorWheel(props: UseColorWheelProps = {}): UseColorWheelReturn {
	const ids = createIds("color-wheel", ["root", "track", "thumb"] as const);
	const step = props.step ?? 1;

	// ── Reactive state ──────────────────────────────────────────
	let hue = $state(normalise(props.hue ?? 0));
	let isDragging = $state(false);
	const disabled = $derived(props.disabled ?? false);

	function normalise(h: number): number {
		// Clamp to [0, 360), handles negatives and values ≥ 360.
		const mod = h % 360;
		return mod < 0 ? mod + 360 : mod;
	}

	function doSetHue(next: number): void {
		const clamped = normalise(next);
		if (clamped === hue) return;
		hue = clamped;
		props.onHueChange?.(hue);
	}

	function commit(): void {
		props.onHueCommit?.(hue);
	}

	// ── Keyboard ────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return;
		let handled = true;

		switch (e.key) {
			case kbd.ARROW_RIGHT:
			case kbd.ARROW_UP:
				doSetHue(hue + step);
				break;
			case kbd.ARROW_LEFT:
			case kbd.ARROW_DOWN:
				doSetHue(hue - step);
				break;
			case kbd.PAGE_UP:
				doSetHue(hue + step * 10);
				break;
			case kbd.PAGE_DOWN:
				doSetHue(hue - step * 10);
				break;
			case kbd.HOME:
				doSetHue(0);
				break;
			case kbd.END:
				doSetHue(360);
				break;
			default:
				handled = false;
		}

		if (handled) {
			e.preventDefault();
			commit();
		}
	}

	// ── Pointer drag (attached to the track) ───────────────────
	function handleTrackPointerDown(e: PointerEvent): void {
		if (disabled) return;
		const track = e.currentTarget as HTMLElement;
		track.setPointerCapture(e.pointerId);
		isDragging = true;

		function updateFromPointer(clientX: number, clientY: number): void {
			const rect = track.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = clientX - cx;
			const dy = clientY - cy;
			// atan2 returns radians counter-clockwise from +x axis in [-π, π].
			// Convert to degrees, rotate so 0° is at the top (12 o'clock).
			const rad = Math.atan2(dy, dx);
			const deg = (rad * 180) / Math.PI + 90;
			doSetHue(deg);
		}

		updateFromPointer(e.clientX, e.clientY);

		function onMove(ev: PointerEvent): void {
			if (!isDragging) return;
			updateFromPointer(ev.clientX, ev.clientY);
		}

		function onUp(ev: PointerEvent): void {
			if (!isDragging) return;
			isDragging = false;
			try {
				track.releasePointerCapture(ev.pointerId);
			} catch {
				/* already released */
			}
			document.removeEventListener("pointermove", onMove);
			document.removeEventListener("pointerup", onUp);
			document.removeEventListener("pointercancel", onUp);
			commit();
			document.getElementById(ids.thumb)?.focus();
		}

		document.addEventListener("pointermove", onMove);
		document.addEventListener("pointerup", onUp);
		document.addEventListener("pointercancel", onUp);
	}

	// ── Slot attributes ─────────────────────────────────────────
	const root = $derived({
		...colorWheelAnatomy.attrs.root,
		id: ids.root,
		"data-disabled": dataAttr(disabled),
	});

	const track = $derived({
		...colorWheelAnatomy.attrs.track,
		id: ids.track,
		"data-disabled": dataAttr(disabled),
		onpointerdown: handleTrackPointerDown,
		style: "touch-action:none",
	});

	// Thumb position expressed as CSS custom properties so the
	// component can compose them into a transform without any
	// additional JS math. Angle is normalised so that 0° is at 12
	// o'clock, increasing clockwise.
	const thumb = $derived.by(() => {
		const rad = ((hue - 90) * Math.PI) / 180;
		const x = Math.cos(rad);
		const y = Math.sin(rad);
		return {
			...colorWheelAnatomy.attrs.thumb,
			id: ids.thumb,
			role: "slider" as const,
			tabindex: disabled ? -1 : 0,
			"aria-label": props["aria-label"] ?? "Hue",
			"aria-valuenow": Math.round(hue),
			"aria-valuemin": 0,
			"aria-valuemax": 360,
			"aria-valuetext": `${Math.round(hue)} degrees`,
			"aria-disabled": disabledAttr(disabled),
			"data-dragging": isDragging ? ("" as const) : undefined,
			"data-disabled": dataAttr(disabled),
			style: `--cw-x:${x};--cw-y:${y}`,
			onkeydown: handleKeydown,
		};
	});

	// ── Public API ──────────────────────────────────────────────
	return {
		get hue() {
			return hue;
		},
		get isDragging() {
			return isDragging;
		},
		get root() {
			return root;
		},
		get track() {
			return track;
		},
		get thumb() {
			return thumb;
		},
		setHue: doSetHue,
	};
}
