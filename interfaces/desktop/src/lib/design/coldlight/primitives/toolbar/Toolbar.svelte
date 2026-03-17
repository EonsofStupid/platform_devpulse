<!--
  @component ToolbarPrimitive
  @kind toolbar
  @slot root
-->
<script lang="ts">
	import type { ToolbarPrimitiveProps } from "./toolbar.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: ToolbarPrimitiveProps = $props();
</script>

<div
	data-kind="toolbar"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
