<!--
  @component StackPrimitive
  @kind stack
  @slot root
-->
<script lang="ts">
	import type { StackPrimitiveProps } from "./stack.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: StackPrimitiveProps = $props();
</script>

<div
	data-kind="stack"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
