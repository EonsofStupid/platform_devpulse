<!--
  @component GridListPrimitive
  @kind grid-list
  @slot root
-->
<script lang="ts">
import { cn } from "../_shared/cn.js";
import type { GridListPrimitiveProps } from "./grid-list.props.js";

let { children, class: className, ...rest }: GridListPrimitiveProps = $props();
</script>

<div
	data-kind="grid-list"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
