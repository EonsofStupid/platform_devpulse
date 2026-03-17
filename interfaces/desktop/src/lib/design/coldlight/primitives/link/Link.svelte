<!--
  @component LinkPrimitive
  @kind link
  @slot root
-->
<script lang="ts">
	import type { LinkPrimitiveProps } from "./link.props.js";
	import { cn } from "../_shared/cn.js";

	let { children, class: className, ...rest }: LinkPrimitiveProps = $props();
</script>

<button
	data-kind="link"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</button>
