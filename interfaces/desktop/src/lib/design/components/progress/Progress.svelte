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
	@styleIds progress-default
	@requiredAxes backgroundColor, borderRadius, color
	@slots root:all, track:none, fill:none
-->
<script lang="ts">
import { useProgress } from "$lib/design/primitives/progress/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ProgressProps, ProgressSize } from "./progress.types.js";

const SIZE: Record<ProgressSize, string> = {
	sm: "h-1",
	md: "h-2",
	lg: "h-3",
};

let {
	value = 0,
	min = 0,
	max = 100,
	size = "md",
	children,
	class: className,
	...rest
}: ProgressProps = $props();

const progress = $derived(useProgress({
	value,
	min,
	max,
	"aria-label": rest["aria-label"],
	"aria-labelledby": rest["aria-labelledby"],
}));
const styleId = "progress-default";
</script>

<StyleMacro kind="progress" style={styleId}>
	<div
		{...progress.root}
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
</StyleMacro>
