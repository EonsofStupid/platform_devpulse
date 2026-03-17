<!--
  @component TextFieldPrimitive
  @kind text-field
  @slot root
-->
<script lang="ts">
	import type { TextFieldPrimitiveProps } from "./text-field.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: TextFieldPrimitiveProps = $props();
</script>

<div
	data-kind="text-field"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
