<!--
  @component ColorSliderPrimitive
  @kind color-slider
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { ColorSliderPrimitiveProps } from "./types.js";

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
