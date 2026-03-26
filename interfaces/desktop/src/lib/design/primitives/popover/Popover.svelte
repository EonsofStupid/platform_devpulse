<!--
  @component PopoverPrimitive
  @kind popover
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { PopoverPrimitiveProps } from "./popover.props.js";

let { children, class: className, ...rest }: PopoverPrimitiveProps = $props();
</script>

<div
	data-kind="popover"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
