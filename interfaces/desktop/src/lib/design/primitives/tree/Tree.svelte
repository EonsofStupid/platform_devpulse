<!--
  @component TreePrimitive
  @kind tree
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { TreePrimitiveProps } from "./tree.props.js";

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
