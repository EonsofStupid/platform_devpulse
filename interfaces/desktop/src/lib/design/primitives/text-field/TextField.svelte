<!--
  @component TextFieldPrimitive
  @kind text-field
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { TextFieldPrimitiveProps } from "./text-field.props.js";

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
