<!--
  @component SliderPrimitive
  @kind slider
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { SliderPrimitiveProps } from "./slider.props.js";

let { children, class: className, ...rest }: SliderPrimitiveProps = $props();
</script>

<div
	data-kind="slider"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
