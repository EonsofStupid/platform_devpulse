<!--
  @component ColorFieldPrimitive
  @kind color-field
  @slot root
-->
<script lang="ts">
	import type { ColorFieldPrimitiveProps } from "./color-field.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: ColorFieldPrimitiveProps = $props();
</script>

<div
	data-kind="color-field"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
