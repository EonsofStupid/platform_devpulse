/**
 * useColorSlider — ColdLight color slider primitive hook.
 *
 * Slider specialized for adjusting a single color channel (hue, saturation, lightness, alpha, rgb).
 * Parts: root, track, thumb (role=slider), label.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/slider/
 *
 * @example
 * ```svelte
 * <script>
 *   import { useColorSlider } from '$lib/design/coldlight';
 *   const hue = useColorSlider({ channel: 'hue', value: 180 });
 * </script>
 * <div {...hue.root}>
 *   <label {...hue.label}>Hue</label>
 *   <div {...hue.track}>
 *     <div {...hue.thumb}></div>
 *   </div>
 * </div>
 * ```
 */

import { dataAttr, disabledAttr } from "../_internal/utils/data-attr.js";
import { kbd } from "../_internal/utils/kbd.js";
import { createIds } from "../_internal/utils/uid.js";
import { colorSliderAnatomy } from "./color-slider.anatomy.js";
import type {
	ColorChannel,
	UseColorSliderProps,
	UseColorSliderReturn,
} from "./color-slider.types.js";

const CHANNEL_DEFAULTS: Record<ColorChannel, { min: number; max: number }> = {
	hue: { min: 0, max: 360 },
	saturation: { min: 0, max: 100 },
	lightness: { min: 0, max: 100 },
	alpha: { min: 0, max: 1 },
	red: { min: 0, max: 255 },
	green: { min: 0, max: 255 },
	blue: { min: 0, max: 255 },
};

export function useColorSlider(props: UseColorSliderProps = {}): UseColorSliderReturn {
	const ids = createIds("color-slider", ["root", "track", "thumb", "label"] as const);
	const channel = props.channel ?? "hue";
	const defaults = CHANNEL_DEFAULTS[channel];
	const min = props.min ?? defaults.min;
	const max = props.max ?? defaults.max;
	const step = props.step ?? (channel === "alpha" ? 0.01 : 1);
	const orientation = props.orientation ?? "horizontal";

	// ── State ────────────────────────────────────────────────────
	let value = $state(props.value ?? min);
	const disabled = $derived(props.disabled ?? false);
	const percent = $derived(max === min ? 0 : ((value - min) / (max - min)) * 100);

	function clamp(v: number): number {
		const stepped = Math.round((v - min) / step) * step + min;
		return Math.min(max, Math.max(min, parseFloat(stepped.toFixed(10))));
	}

	function doSetValue(v: number): void {
		const clamped = clamp(v);
		if (clamped === value) return;
		value = clamped;
		props.onValueChange?.(value);
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (disabled) return;

		const incrementKeys: string[] = [kbd.ARROW_RIGHT, kbd.ARROW_UP];
		const decrementKeys: string[] = [kbd.ARROW_LEFT, kbd.ARROW_DOWN];
		const allKeys: string[] = [...incrementKeys, ...decrementKeys, kbd.HOME, kbd.END];

		if (!allKeys.includes(e.key)) return;
		e.preventDefault();

		if (incrementKeys.includes(e.key)) {
			doSetValue(value + step);
		} else if (decrementKeys.includes(e.key)) {
			doSetValue(value - step);
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
			const rect = track!.getBoundingClientRect();
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
	const channelLabel = channel.charAt(0).toUpperCase() + channel.slice(1);

	const root = $derived({
		...colorSliderAnatomy.attrs.root,
		id: ids.root,
		"data-channel": channel,
		"data-orientation": orientation,
		"data-disabled": dataAttr(disabled),
	});

	const track = $derived({
		...colorSliderAnatomy.attrs.track,
		id: ids.track,
		"data-channel": channel,
		"data-orientation": orientation,
		"data-disabled": dataAttr(disabled),
	});

	const thumb = $derived({
		...colorSliderAnatomy.attrs.thumb,
		id: ids.thumb,
		role: "slider" as const,
		tabindex: disabled ? -1 : 0,
		"aria-valuenow": value,
		"aria-valuemin": min,
		"aria-valuemax": max,
		"aria-orientation": orientation,
		"aria-label": props["aria-label"] ?? channelLabel,
		"aria-disabled": disabledAttr(disabled),
		"data-channel": channel,
		"data-disabled": dataAttr(disabled),
		style: orientation === "horizontal" ? `left:${percent}%` : `bottom:${percent}%`,
		onkeydown: handleKeydown,
		onpointerdown: handlePointerDown,
	});

	const label = $derived({
		...colorSliderAnatomy.attrs.label,
		id: ids.label,
		"data-disabled": dataAttr(disabled),
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
		setValue: doSetValue,
	};
}
