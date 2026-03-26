<!--
  @component TagGroupPrimitive
  @kind tag-group
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { TagGroupPrimitiveProps } from "./tag-group.props.js";

let { children, class: className, ...rest }: TagGroupPrimitiveProps = $props();
</script>

<div
	data-kind="tag-group"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
