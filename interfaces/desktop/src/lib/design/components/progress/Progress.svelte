<!--
	@component Progress
	@kind progress
	@layer component
	@category content
	@description Determinate or indeterminate progress bar indicating task completion
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/meter/
	@container false
	@compound true
	@blockCategory feedback
	@defaultStyle progress-default
	@styleIds progress-default, progress-stark, progress-glass, progress-flat, progress-matte
	@requiredAxes backgroundColor, borderRadius, color
	@slots root:all, track:none, fill:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useProgress } from "$lib/design/behaviors/progress/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { ProgressProps, ProgressSize } from "./progress.types.js";

const SIZE: Record<ProgressSize, string> = {
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
};

let {
	preset = "default",
	value = 0,
	min = 0,
	max = 100,
	size = "md",
	children,
	class: className,
	...rest
}: ProgressProps = $props();
const m = $derived(resolveMacro({ kind: "progress", preset }));

const progress = $derived(
	useProgress({
		value,
		min,
		max,
		"aria-label": rest["aria-label"],
		"aria-labelledby": rest["aria-labelledby"],
	}),
);
</script>

<div
		{...progress.root}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		class={cn("w-full overflow-hidden rounded-full", SIZE[size] ?? SIZE.md, className)}
	>
		<div
			{...progress.track}
			class="relative h-full w-full"
			data-kind="progress"
			data-slot="track"
		>
			<div
				{...progress.fill}
				class="h-full transition-[width] duration-300 ease-out"
				data-kind="progress"
				data-slot="fill"
			></div>
		</div>
		{@render children?.()}
	</div>
