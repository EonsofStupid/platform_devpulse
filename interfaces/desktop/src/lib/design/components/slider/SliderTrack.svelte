<!--
	@component Slider.Track
	@kind slider
	@slot track
	@layer components

	Track rail. ARIA from hook via context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";

let { children, class: className, ...rest }: { children?: import("svelte").Snippet; class?: string; [key: string]: unknown } = $props();
const ctx = getSliderContext();
</script>

<div
	{...ctx.hook.track}
	data-kind="slider"
	data-slot="track"
	class={cn("relative h-2 w-full grow overflow-hidden rounded-full", className)}
	{...rest}
>
	{@render children?.()}
</div>
