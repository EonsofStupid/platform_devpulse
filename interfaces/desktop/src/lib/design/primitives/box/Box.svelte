<!--
  @component BoxPrimitive
  @kind box
  @slot root

  Generic container. No ARIA, no behavior.
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { BoxPrimitiveProps } from "./box.props.js";

let { children, class: className, ...rest }: BoxPrimitiveProps = $props();
</script>

<div
	data-kind="box"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
