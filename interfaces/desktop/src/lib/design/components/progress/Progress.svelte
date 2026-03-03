<!--
	@component Progress
	@kind progress
	@layer components

	ARIA + state only. ZERO visual.
	Compound: track (root) + indicator bar.
	indicatorClass injected by ui/ layer.
-->
<script lang="ts">
	import type { ProgressComponentProps } from "./types.js";

	let {
		// Kind-specific props
		value = null,
		max = 100,
		indicatorClass,
		class: className,
		// Rest spread
		...rest
	}: ProgressComponentProps = $props();

	const isIndeterminate = $derived(value === null || value === undefined);
	const clampedValue = $derived(
		isIndeterminate ? 0 : Math.min(Math.max(value as number, 0), max),
	);
	const percentage = $derived(
		isIndeterminate ? 0 : max > 0 ? (clampedValue / max) * 100 : 0,
	);

	const dataState = $derived(
		isIndeterminate
			? "indeterminate"
			: clampedValue >= max
				? "complete"
				: "loading",
	);
</script>

<div
	{...rest}
	data-kind="progress"
	data-slot="root"
	data-state={dataState}
	class={className}
	role="progressbar"
	aria-valuenow={isIndeterminate ? undefined : clampedValue}
	aria-valuemin={0}
	aria-valuemax={max}
>
	<div
		data-kind="progress"
		data-slot="indicator"
		class={indicatorClass}
		style:width={isIndeterminate ? "100%" : `${percentage}%`}
		aria-hidden="true"
	></div>
</div>
