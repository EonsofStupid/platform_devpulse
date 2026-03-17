<!--
  @component AccordionPrimitive
  @kind accordion
  @slot root
-->
<script lang="ts">
	import type { AccordionPrimitiveProps } from "./accordion.props.js";
	import { cn } from "../_shared/cn.js";

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
