<!--
  @component MeterPrimitive
  @kind meter
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { MeterPrimitiveProps } from "./types.js";

let { children, class: className, ...rest }: MeterPrimitiveProps = $props();
</script>

<div
	data-kind="meter"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
