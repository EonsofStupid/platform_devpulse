<!--
	@component SliderThumb
	@description Structural shell for slider thumb (draggable handle).
	Contract: kind="slider", slot="thumb", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SliderThumbProps } from "./types.js";

	let { children, class: className, ...rest }: SliderThumbProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SliderThumb");
</script>

<span
	{...rest}
	data-kind="slider"
	data-slot="thumb"
	class={cn(className)}
>
	{@render children?.()}
</span>
