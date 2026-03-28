/**
 * useSlider — ColdLight slider primitive hook.
 *
 * Single-thumb range slider with full keyboard support.
 * Parts: root, track, thumb (role=slider), label, output.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * @example
 * ```svelte
 * <script>
 *   import { useSlider } from '$lib/design/coldlight';
 *   const slider = useSlider({ min: 0, max: 100, value: 50 });
 * </script>
 * <div {...slider.root}>
 *   <label {...slider.label}>Volume</label>
 *   <div {...slider.track}>
 *     <div {...slider.thumb}></div>
 *   </div>
 *   <output {...slider.output}>{slider.value}</output>
 * </div>
 * ```
 */

import { dataAttr, disabledAttr } from "../_internal/utils/data-attr.js";
import { kbd } from "../_internal/utils/kbd.js";
import { createIds } from "../_internal/utils/uid.js";
import { sliderAnatomy } from "./slider.anatomy.js";
import type { UseSliderProps, UseSliderReturn } from "./slider.types.js";

export function useSlider(props: UseSliderProps = {}): UseSliderReturn {
	const ids = createIds("slider", ["root", "track", "thumb", "label", "output"] as const);
	const min = props.min ?? 0;
	const max = props.max ?? 100;
	const step = props.step ?? 1;
	const orientation = props.orientation ?? "horizontal";

	// ── State ────────────────────────────────────────────────────
	let value = $state(props.value ?? min);
	const disabled = $derived(props.disabled ?? false);
	const percent = $derived(max === min ? 0 : ((value - min) / (max - min)) * 100);

	function clamp(v: number): number {
		const stepped = Math.round((v - min) / step) * step + min;
		return Math.min(max, Math.max(min, stepped));
	}

	function doSetValue(v: number): void {
		const clamped = clamp(v);
		if (clamped === value) return;
		value = clamped;
		props.onValueChange?.(value);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return;

		const _isHorizontal = orientation === "horizontal";
		const incrementKeys: string[] = [kbd.ARROW_RIGHT, kbd.ARROW_UP];
		const decrementKeys: string[] = [kbd.ARROW_LEFT, kbd.ARROW_DOWN];
		const allKeys: string[] = [
			...incrementKeys,
			...decrementKeys,
			kbd.HOME,
			kbd.END,
			kbd.PAGE_UP,
			kbd.PAGE_DOWN,
		];

		if (!allKeys.includes(e.key)) return;
		e.preventDefault();

		if (incrementKeys.includes(e.key)) {
			doSetValue(value + step);
		} else if (decrementKeys.includes(e.key)) {
			doSetValue(value - step);
		} else if (e.key === kbd.PAGE_UP) {
			doSetValue(value + step * 10);
		} else if (e.key === kbd.PAGE_DOWN) {
			doSetValue(value - step * 10);
		} else if (e.key === kbd.HOME) {
			doSetValue(min);
		} else if (e.key === kbd.END) {
			doSetValue(max);
		}
	}

	// ── Pointer drag ─────────────────────────────────────────────
	function handlePointerDown(e: PointerEvent): void {
		if (disabled) return;
		const track = document.getElementById(ids.track);
		if (!track) return;

		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

		function updateFromPointer(clientX: number, clientY: number): void {
			const rect = track?.getBoundingClientRect();
			if (!rect) return;
			const isHorizontal = orientation === "horizontal";
			const pos = isHorizontal ? clientX - rect.left : rect.bottom - clientY;
			const size = isHorizontal ? rect.width : rect.height;
			const ratio = Math.min(1, Math.max(0, pos / size));
			doSetValue(min + ratio * (max - min));
		}

		updateFromPointer(e.clientX, e.clientY);

		function onMove(ev: PointerEvent): void {
			updateFromPointer(ev.clientX, ev.clientY);
		}

		function onUp(): void {
			document.removeEventListener("pointermove", onMove);
			document.removeEventListener("pointerup", onUp);
		}

		document.addEventListener("pointermove", onMove);
		document.addEventListener("pointerup", onUp);
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...sliderAnatomy.attrs.root,
		id: ids.root,
		"data-orientation": orientation,
		"data-disabled": dataAttr(disabled),
	});

	const track = $derived({
		...sliderAnatomy.attrs.track,
		id: ids.track,
		"data-orientation": orientation,
		"data-disabled": dataAttr(disabled),
	});

	const thumb = $derived({
		...sliderAnatomy.attrs.thumb,
		id: ids.thumb,
		role: "slider" as const,
		tabindex: disabled ? -1 : 0,
		"aria-valuenow": value,
		"aria-valuemin": min,
		"aria-valuemax": max,
		"aria-valuetext": props.getValueText?.(value),
		"aria-orientation": orientation,
		"aria-disabled": disabledAttr(disabled),
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-label"] ? undefined : (props["aria-labelledby"] ?? ids.label),
		"data-disabled": dataAttr(disabled),
		style: orientation === "horizontal" ? `left:${percent}%` : `bottom:${percent}%`,
		onkeydown: handleKeydown,
		onpointerdown: handlePointerDown,
	});

	const label = $derived({
		...sliderAnatomy.attrs.label,
		id: ids.label,
		"data-disabled": dataAttr(disabled),
	});

	const output = $derived({
		...sliderAnatomy.attrs.output,
		id: ids.output,
		for: ids.thumb,
		"aria-live": "off" as const,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get value() {
			return value;
		},
		get percent() {
			return percent;
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
		get label() {
			return label;
		},
		get output() {
			return output;
		},
		setValue: doSetValue,
	};
}
