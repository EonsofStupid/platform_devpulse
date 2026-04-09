/**
 * useProgress — ColdLight progress primitive hook.
 *
 * Progressbar with determinate and indeterminate modes.
 * Optionally announces value changes via aria-live region.
 * Parts: root (role=progressbar), track, fill, label.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useProgress } from '$lib/design/coldlight';
 *   const progress = useProgress({ value: 60, max: 100 });
 * </script>
 * <div {...progress.root}>
 *   <label {...progress.label}>Loading</label>
 *   <div {...progress.track}>
 *     <div {...progress.fill} style:width="{progress.percent}%"></div>
 *   </div>
 * </div>
 * ```
 */

import { createIds } from "../_internal/utils/uid.js";
import { announce } from "../_shared/live-region/index.js";
import { progressAnatomy } from "./progress.anatomy.js";
import type { UseProgressProps, UseProgressReturn } from "./progress.types.js";

export function useProgress(props: UseProgressProps = {}): UseProgressReturn {
	const ids = createIds("progress", ["root", "track", "fill", "label"] as const);
	const min = props.min ?? 0;
	const max = props.max ?? 100;
	const shouldAnnounce = props.announceChanges ?? false;

	// ── State ────────────────────────────────────────────────────
	let value = $state<number | null>(props.value ?? 0);
	const isIndeterminate = $derived(value === null);
	const percent = $derived(
		value === null ? null : max === min ? 0 : ((value - min) / (max - min)) * 100,
	);
	const isComplete = $derived(value !== null && value >= max);

	function getDataState(): "indeterminate" | "loading" | "complete" {
		if (isIndeterminate) return "indeterminate";
		return isComplete ? "complete" : "loading";
	}

	function getValueText(): string | undefined {
		if (value === null || percent === null) return undefined;
		if (props.getValueText) return props.getValueText(value, percent);
		return `${Math.round(percent)}%`;
	}

	function doSetValue(v: number | null): void {
		const prev = value;
		value = v;
		if (shouldAnnounce && v !== null && v !== prev) {
			const text = getValueText();
			if (text) announce(text, "polite");
		}
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...progressAnatomy.attrs.root,
		id: ids.root,
		role: "progressbar" as const,
		"aria-valuenow": value ?? undefined,
		"aria-valuemin": min,
		"aria-valuemax": max,
		"aria-valuetext": getValueText(),
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-label"] ? undefined : (props["aria-labelledby"] ?? ids.label),
		"data-state": getDataState(),
		"data-value": value ?? undefined,
		"data-max": max,
	});

	const track = $derived({
		...progressAnatomy.attrs.track,
		id: ids.track,
		"data-state": getDataState(),
	});

	const fill = $derived({
		...progressAnatomy.attrs.fill,
		id: ids.fill,
		"data-state": getDataState(),
		style: percent !== null ? `width:${percent}%` : undefined,
	});

	const label = $derived({
		...progressAnatomy.attrs.label,
		id: ids.label,
	});

	// ── Public API ───────────────────────────────────────────────
	return {
		get value() {
			return value;
		},
		get percent() {
			return percent;
		},
		get isIndeterminate() {
			return isIndeterminate;
		},
		get isComplete() {
			return isComplete;
		},
		get root() {
			return root;
		},
		get track() {
			return track;
		},
		get fill() {
			return fill;
		},
		get label() {
			return label;
		},
		setValue: doSetValue,
	};
}
