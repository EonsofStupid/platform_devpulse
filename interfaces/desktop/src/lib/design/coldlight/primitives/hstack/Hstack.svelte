<!--
  @component HstackPrimitive
  @kind hstack
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { HstackPrimitiveProps } from "./hstack.props.js";

let { children, class: className, ...rest }: HstackPrimitiveProps = $props();
</script>

<div
	data-kind="hstack"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
