<!--
  @component TooltipPrimitive
  @kind tooltip
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { TooltipPrimitiveProps } from "./tooltip.props.js";

let { children, class: className, ...rest }: TooltipPrimitiveProps = $props();
</script>

<div
	data-kind="tooltip"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
