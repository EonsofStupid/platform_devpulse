<!--
  @component FieldPrimitive
  @kind field
  @slot root
-->
<script lang="ts">
	import type { FieldPrimitiveProps } from "./field.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: FieldPrimitiveProps = $props();
</script>

<div
	data-kind="field"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
