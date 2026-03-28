<!--
  @component BadgePrimitive
  @kind badge
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { BadgePrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: BadgePrimitiveProps = $props();
</script>

<span
	data-kind="badge"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</span>
