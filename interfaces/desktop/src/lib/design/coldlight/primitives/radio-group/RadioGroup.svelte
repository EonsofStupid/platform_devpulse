<!--
  @component RadioGroupPrimitive
  @kind radio-group
  @slot root
-->
<script lang="ts">
	import type { RadioGroupPrimitiveProps } from "./radio-group.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: RadioGroupPrimitiveProps = $props();
</script>

<div
	data-kind="radio-group"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
