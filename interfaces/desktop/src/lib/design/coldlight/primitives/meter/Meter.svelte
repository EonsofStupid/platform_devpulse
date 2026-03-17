<!--
  @component MeterPrimitive
  @kind meter
  @slot root
-->
<script lang="ts">
	import type { MeterPrimitiveProps } from "./meter.props.js";
	import { cn } from "../_shared/cn.js";

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
