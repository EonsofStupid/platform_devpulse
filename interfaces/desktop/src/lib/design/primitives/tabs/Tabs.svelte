<!--
  @component TabsPrimitive
  @kind tabs
  @slot root
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { TabsPrimitiveProps } from "./tabs.props.js";

let { children, class: className, ...rest }: TabsPrimitiveProps = $props();
</script>

<div
	data-kind="tabs"
	data-slot="root"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
