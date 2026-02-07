<!--
	@component Slider
	@description Structural shell for slider primitive.
	Contract: kind="slider", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setSliderContext } from "./context.js";
import type { SliderProps } from "./types.js";

let { value = $bindable([50]), children, class: className, ...rest }: SliderProps = $props();

setSliderContext({
	get value() {
		return value;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Slider");
</script>

<div
	{...rest}
	data-kind="slider"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
