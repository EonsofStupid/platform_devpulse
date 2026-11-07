<!--
  @component SelectPrimitive
  @kind select
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { SelectPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: SelectPrimitiveProps = $props();
</script>

<div
	data-kind="select"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
