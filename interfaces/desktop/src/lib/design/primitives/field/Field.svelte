<!--
  @component FieldPrimitive
  @kind field
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { FieldPrimitiveProps } from "./field.props.js";

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
