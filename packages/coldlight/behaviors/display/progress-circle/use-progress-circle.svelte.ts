/**
 * useProgressCircle — ColdLight circular progress primitive hook.
 *
 * Supports determinate (value 0–max) and indeterminate (value=null) modes.
 * Computes SVG stroke-dashoffset for the fill arc so the component
 * only needs to bind the returned values — no math in markup.
 *
 * Circle geometry: radius=9, cx/cy=12. Circumference = 2π × 9 ≈ 56.55.
 * This matches a 24×24 viewBox with 3px stroke.
 *
 * WAI-ARIA: role="progressbar" on root SVG.
 * aria-valuenow/min/max on determinate, omitted on indeterminate.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useProgressCircle } from '#coldlight/coldlight';
 *   const pc = useProgressCircle({ value: 60, size: 'md', 'aria-label': 'Upload progress' });
 * </script>
 * <svg {...pc.root} viewBox="0 0 24 24">
 *   <circle {...pc.track} cx="12" cy="12" r="9" />
 *   <circle {...pc.fill} cx="12" cy="12" r="9"
 *     stroke-dasharray={pc.circumference}
 *     stroke-dashoffset={pc.dashOffset} />
 * </svg>
 * ```
 */

import { createIds } from "../../_internal/utils/uid.js";
import { progressCircleAnatomy } from "./progress-circle.anatomy.js";
import type {
	ProgressCircleState,
	UseProgressCircleProps,
	UseProgressCircleReturn,
} from "./progress-circle.types.js";

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 56.549

export function useProgressCircle(props: UseProgressCircleProps = {}): UseProgressCircleReturn {
	const ids = createIds("progress-circle", ["root"] as const);
	const size = props.size ?? "md";
	const min = props.min ?? 0;
	const max = props.max ?? 100;

	// ── State ────────────────────────────────────────────────────
	let value = $state<number | null>(props.value ?? null);

	const isIndeterminate = $derived(value === null);
	const percent = $derived(
		value === null ? null : max === min ? 0 : ((value - min) / (max - min)) * 100,
	);
	const isComplete = $derived(value !== null && value >= max);
	const dashOffset = $derived(
		percent === null ? 0 : CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE,
	);

	function getState(): ProgressCircleState {
		if (isIndeterminate) return "indeterminate";
		return isComplete ? "complete" : "loading";
	}

	function getValueText(): string | undefined {
		if (value === null || percent === null) return undefined;
		if (props.getValueText) return props.getValueText(value, percent);
		return `${Math.round(percent)}%`;
	}

	// ── Slot attributes ──────────────────────────────────────────
	const root = $derived({
		...progressCircleAnatomy.attrs.root,
		id: ids.root,
		role: "progressbar" as const,
		"aria-valuenow": value ?? undefined,
		"aria-valuemin": isIndeterminate ? undefined : min,
		"aria-valuemax": isIndeterminate ? undefined : max,
		"aria-valuetext": getValueText(),
		"aria-label": props["aria-label"],
		"aria-labelledby": props["aria-label"] ? undefined : props["aria-labelledby"],
		"data-size": size,
		"data-state": getState(),
		viewBox: "0 0 24 24" as const,
		fill: "none" as const,
	});

	const track = $derived({
		...progressCircleAnatomy.attrs.track,
		"data-slot": "track" as const,
	});

	const fill = $derived({
		...progressCircleAnatomy.attrs.fill,
		"data-slot": "fill" as const,
		"data-state": getState(),
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
		get dashOffset() {
			return dashOffset;
		},
		circumference: CIRCUMFERENCE,
		get root() {
			return root;
		},
		get track() {
			return track;
		},
		get fill() {
			return fill;
		},
		setValue(v: number | null) {
			value = v;
		},
	};
}
