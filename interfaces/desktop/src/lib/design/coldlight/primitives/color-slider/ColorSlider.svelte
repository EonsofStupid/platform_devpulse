<!--
  @component ColorSliderPrimitive
  @kind color-slider
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { ColorSliderPrimitiveProps } from "./color-slider.props.js";

let { children, class: className, ...rest }: ColorSliderPrimitiveProps = $props();
</script>

<div
	data-kind="color-slider"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
