<!--
  @component TagGroupPrimitive
  @kind tag-group
  @slot root
-->
<script lang="ts">
	import type { TagGroupPrimitiveProps } from "./tag-group.props.js";
	import { cn } from "../_shared/cn.js";

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
