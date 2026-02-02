<!--
	@component SliderRange
	@description Structural shell for slider range (filled portion).
	Contract: kind="slider", slot="range", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SliderRangeProps } from "./types.js";

	let { children, class: className, ...rest }: SliderRangeProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SliderRange");
</script>

<div
	{...rest}
	data-kind="slider"
	data-slot="range"
	class={cn(className)}
>
	{@render children?.()}
</div>
