<!--
	@component Progress
	@kind progress

	THE PRODUCT. Hook (ARIA progressbar) + StyleMacro (visual).
	Size → structural classes. Value/min/max → ARIA + fill width.
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
