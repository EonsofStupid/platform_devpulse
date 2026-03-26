<!--
  @component NumberFieldPrimitive
  @kind number-field
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { NumberFieldPrimitiveProps } from "./number-field.props.js";

let { children, class: className, ...rest }: NumberFieldPrimitiveProps = $props();
</script>

<div
	data-kind="number-field"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
