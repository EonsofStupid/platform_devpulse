<!--
  @component TreePrimitive
  @kind tree
  @slot root
-->
<script lang="ts">
	import type { TreePrimitiveProps } from "./tree.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: TreePrimitiveProps = $props();
</script>

<div
	data-kind="tree"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
