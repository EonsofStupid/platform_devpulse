<!--
  @component AccordionPrimitive
  @kind accordion
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { AccordionPrimitiveProps } from "./accordion.props.js";

let { children, class: className, ...rest }: AccordionPrimitiveProps = $props();
</script>

<div
	data-kind="accordion"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
