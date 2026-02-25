<!--
	@component Progress
	@kind progress
	@layer components

	ColdLight Progress — renders HTML directly (no primitive .svelte exists).
	- ARIA attributes (role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax)
	- State derivation (data-state: indeterminate | loading | complete)
	- SD5 token-driven recipe (size)
	- Compound: track (root) + indicator bar

	ColdLight OWNS all ARIA. No primitive wrapper — direct HTML rendering.
-->
<script lang="ts">
	import type { ProgressComponentProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { progressTrackRecipe, progressIndicatorRecipe } from "./recipe.js";

	let {
		value = null,
		max = 100,
		size = "md",
		class: className,
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

	const trackClasses = $derived(cn(progressTrackRecipe({ size }), className));
	const indicatorClasses = $derived(cn(progressIndicatorRecipe()));
</script>

<div
	{...rest}
	data-kind="progress"
	data-slot="root"
	data-state={dataState}
	class={trackClasses}
	role="progressbar"
	aria-valuenow={isIndeterminate ? undefined : clampedValue}
	aria-valuemin={0}
	aria-valuemax={max}
>
	<div
		data-kind="progress"
		data-slot="indicator"
		class={indicatorClasses}
		style:width={isIndeterminate ? "100%" : `${percentage}%`}
		aria-hidden="true"
	></div>
</div>
