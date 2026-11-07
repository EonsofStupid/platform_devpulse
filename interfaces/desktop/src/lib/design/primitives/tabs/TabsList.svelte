<!--
  @component TabsList
  @kind tabs
  @slot list
  @description Container for tab triggers with tablist role and roving tabindex.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getTabsPrimitiveContext } from "./context.js";
import type { TabsListProps } from "./types.js";

let { children, class: className, ...rest }: TabsListProps = $props();
const ctx = getTabsPrimitiveContext();
</script>

<div
	{...ctx.hook.list}
	{...rest}
	class={cn(className)}
>
	{@render children?.()}
</div>
