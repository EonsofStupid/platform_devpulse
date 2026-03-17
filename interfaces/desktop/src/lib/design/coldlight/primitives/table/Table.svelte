<!--
  @component TablePrimitive
  @kind table
  @slot root
-->
<script lang="ts">
	import type { TablePrimitiveProps } from "./table.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: TablePrimitiveProps = $props();
</script>

<table
	data-kind="table"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</table>
