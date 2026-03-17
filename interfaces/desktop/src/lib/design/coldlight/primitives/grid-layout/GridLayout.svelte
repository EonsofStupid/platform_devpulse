<!--
  @component GridLayoutPrimitive
  @kind grid-layout
  @slot root
-->
<script lang="ts">
	import type { GridLayoutPrimitiveProps } from "./grid-layout.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: GridLayoutPrimitiveProps = $props();
</script>

<div
	data-kind="grid-layout"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
