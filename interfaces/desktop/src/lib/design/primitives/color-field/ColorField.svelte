<!--
  @component ColorFieldPrimitive
  @kind color-field
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { ColorFieldPrimitiveProps } from "./types.js";

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
