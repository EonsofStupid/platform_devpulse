/**
 * useColorArea — ColdLight 2D color selector primitive hook.
 *
 * Svelte 5 runes-native. Returns reactive ARIA attributes, keyboard
 * handlers, data attributes, and pointer capture for a rectangular
 * color area that controls two color channels simultaneously.
 *
 * The thumb carries `role="slider"` with `aria-valuetext` describing
 * both coordinates, matching the WAI-APG slider pattern adapted for
 * two-dimensional input.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { createIds } from "../../_internal/utils/uid.js";
import { colorAreaAnatomy } from "./color-area.anatomy.js";
import type { UseColorAreaProps, UseColorAreaReturn } from "./color-area.types.js";

export function useColorArea(props: UseColorAreaProps = {}): UseColorAreaReturn {
	const ids = createIds("color-area", ["root", "gradient", "thumb", "label"] as const);
	const xChannel = props.xChannel ?? "saturation";
	const yChannel = props.yChannel ?? "lightness";
	const step = props.step ?? 0.01;

	// ── Reactive state ──────────────────────────────────────────
	let xValue = $state(clamp01(props.xValue ?? 0.5));
	let yValue = $state(clamp01(props.yValue ?? 0.5));
	let isDragging = $state(false);
	const disabled = $derived(props.disabled ?? false);
	const rtl = $derived(props.rtl ?? false);

	function clamp01(v: number): number {
		return Math.max(0, Math.min(1, v));
	}

	function doSetValue(nextX: number, nextY: number): void {
		const cx = clamp01(nextX);
		const cy = clamp01(nextY);
		if (cx === xValue && cy === yValue) return;
		xValue = cx;
		yValue = cy;
		props.onValueChange?.(xValue, yValue);
	}

	function commit(): void {
		props.onValueCommit?.(xValue, yValue);
	}

	// ── Keyboard ────────────────────────────────────────────────
	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return;
		const bigStep = step * 10;
		const xMul = rtl ? -1 : 1;
		let handled = true;

		switch (e.key) {
			case kbd.ARROW_RIGHT:
				doSetValue(xValue + step * xMul, yValue);
				break;
			case kbd.ARROW_LEFT:
				doSetValue(xValue - step * xMul, yValue);
				break;
			case kbd.ARROW_UP:
				doSetValue(xValue, yValue + step);
				break;
			case kbd.ARROW_DOWN:
				doSetValue(xValue, yValue - step);
				break;
			case kbd.PAGE_UP:
				doSetValue(xValue, yValue + bigStep);
				break;
			case kbd.PAGE_DOWN:
				doSetValue(xValue, yValue - bigStep);
				break;
			case kbd.HOME:
				doSetValue(0, 0);
				break;
			case kbd.END:
				doSetValue(1, 1);
				break;
			default:
				handled = false;
		}

		if (handled) {
			e.preventDefault();
			commit();
		}
	}

	// ── Pointer drag (attached to the gradient surface) ────────
	function handleGradientPointerDown(e: PointerEvent): void {
		if (disabled) return;
		const surface = e.currentTarget as HTMLElement;
		surface.setPointerCapture(e.pointerId);
		isDragging = true;

		function updateFromPointer(clientX: number, clientY: number): void {
			const rect = surface.getBoundingClientRect();
			const rawX = clamp01((clientX - rect.left) / rect.width);
			const rawY = clamp01(1 - (clientY - rect.top) / rect.height);
			doSetValue(rtl ? 1 - rawX : rawX, rawY);
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
				surface.releasePointerCapture(ev.pointerId);
			} catch {
				/* already released */
			}
			document.removeEventListener("pointermove", onMove);
			document.removeEventListener("pointerup", onUp);
			document.removeEventListener("pointercancel", onUp);
			commit();
			// focus the thumb so subsequent keyboard input is picked up
			document.getElementById(ids.thumb)?.focus();
		}

		document.addEventListener("pointermove", onMove);
		document.addEventListener("pointerup", onUp);
		document.addEventListener("pointercancel", onUp);
	}

	// ── Slot attributes ─────────────────────────────────────────
	const channelLabel = `${capitalize(xChannel)} and ${capitalize(yChannel)}`;
	const valueText = $derived(
		`${capitalize(xChannel)} ${formatChannel(xValue)}, ${capitalize(yChannel)} ${formatChannel(yValue)}`,
	);

	const root = $derived({
		...colorAreaAnatomy.attrs.root,
		id: ids.root,
		"data-disabled": dataAttr(disabled),
	});

	const gradient = $derived({
		...colorAreaAnatomy.attrs.gradient,
		id: ids.gradient,
		"data-disabled": dataAttr(disabled),
		onpointerdown: handleGradientPointerDown,
		style: "touch-action:none",
	});

	const thumb = $derived({
		...colorAreaAnatomy.attrs.thumb,
		id: ids.thumb,
		role: "slider" as const,
		tabindex: disabled ? -1 : 0,
		"aria-label": props["aria-label"] ?? channelLabel,
		"aria-valuenow": Math.round(xValue * 100),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuetext": valueText,
		"aria-disabled": disabledAttr(disabled),
		"data-dragging": isDragging ? ("" as const) : undefined,
		"data-disabled": dataAttr(disabled),
		style: `left:${(rtl ? 1 - xValue : xValue) * 100}%;bottom:${yValue * 100}%`,
		onkeydown: handleKeydown,
	});

	const label = $derived({
		...colorAreaAnatomy.attrs.label,
		id: ids.label,
		"data-disabled": dataAttr(disabled),
	});

	// ── Public API ──────────────────────────────────────────────
	return {
		get xValue() {
			return xValue;
		},
		get yValue() {
			return yValue;
		},
		get isDragging() {
			return isDragging;
		},
		get root() {
			return root;
		},
		get gradient() {
			return gradient;
		},
		get thumb() {
			return thumb;
		},
		get label() {
			return label;
		},
		setValue: doSetValue,
	};
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatChannel(v: number): string {
	return `${Math.round(v * 100)}%`;
}
