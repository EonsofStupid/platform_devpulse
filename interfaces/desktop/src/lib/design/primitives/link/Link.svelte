<!--
  @component LinkPrimitive
  @kind link
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { LinkPrimitiveProps } from "./link.props.js";

let { children, class: className, ...rest }: LinkPrimitiveProps = $props();
</script>

<a
	data-kind="link"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</a>
