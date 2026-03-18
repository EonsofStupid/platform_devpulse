/**
 * useMeter — ColdLight meter primitive hook.
 *
 * Scalar measurement display within a known range.
 * Computes status (safe/caution/danger) from low/high/optimum thresholds.
 * Parts: root (role=meter), track, fill, label.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useMeter } from '$lib/design/coldlight';
 *   const meter = useMeter({ value: 75, low: 25, high: 75, optimum: 50 });
 * </script>
 * <div {...meter.root}>
 *   <label {...meter.label}>CPU Usage</label>
 *   <div {...meter.track}>
 *     <div {...meter.fill} style:width="{meter.percent}%"></div>
 *   </div>
 * </div>
 * ```
 */

import { createIds } from "../../_internal/utils/uid.js";
import { meterAnatomy } from "./meter.anatomy.js";
import type { MeterStatus, UseMeterProps, UseMeterReturn } from "./meter.types.js";

export function useMeter(props: UseMeterProps = {}): UseMeterReturn {
	const ids = createIds("meter", ["root", "track", "fill", "label"] as const);
	const min = props.min ?? 0;
	const max = props.max ?? 100;

	// ── State ────────────────────────────────────────────────────
	let value = $state(props.value ?? min);
	const percent = $derived(max === min ? 0 : ((value - min) / (max - min)) * 100);

	function computeStatus(): MeterStatus {
		const low = props.low ?? min;
		const high = props.high ?? max;
		const optimum = props.optimum ?? (low + high) / 2;

		// Optimum is in the low region: low values are good
		if (optimum <= low) {
			if (value <= low) return "safe";
			if (value >= high) return "danger";
			return "caution";
		}

		// Optimum is in the high region: high values are good
		if (optimum >= high) {
			if (value >= high) return "safe";
			if (value <= low) return "danger";
			return "caution";
		}

		// Optimum is in the middle: middle values are good
		if (value >= low && value <= high) return "safe";
		return "danger";
	}

	const status = $derived(computeStatus());

	function getValueText(): string | undefined {
		if (props.getValueText) return props.getValueText(value, percent);
		return `${Math.round(percent)}%`;
	}

	function doSetValue(v: number): void {
		value = Math.min(max, Math.max(min, v));
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...meterAnatomy.attrs.root,
		id: ids.root,
		role: "meter" as const,
		"aria-valuenow": value,
		"aria-valuemin": min,
		"aria-valuemax": max,
		"aria-valuetext": getValueText(),
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-label"] ? undefined : (props["aria-labelledby"] ?? ids.label),
		"data-state": status,
		"data-value": value,
		"data-max": max,
	});

	const track = $derived({
		...meterAnatomy.attrs.track,
		id: ids.track,
		"data-state": status,
	});

	const fill = $derived({
		...meterAnatomy.attrs.fill,
		id: ids.fill,
		"data-state": status,
		style: `width:${percent}%`,
	});

	const label = $derived({
		...meterAnatomy.attrs.label,
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
		get status() {
			return status;
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
