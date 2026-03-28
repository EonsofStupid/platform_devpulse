<!--
  @component TabsContent
  @kind tabs
  @slot content
  @description Panel associated with a tab trigger. ARIA role="tabpanel".
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getTabsPrimitiveContext } from "./context.js";
import type { TabsContentProps } from "./types.js";

let { value, children, class: className, ...rest }: TabsContentProps = $props();
const ctx = getTabsPrimitiveContext();

const contentAttrs = $derived(ctx.hook.getContent(value));
const isVisible = $derived(contentAttrs["data-state"] === "visible");
</script>

{#if isVisible}
	<div
		{...contentAttrs}
		{...rest}
		class={cn(className)}
	>
		{@render children?.()}
	</div>
{/if}
