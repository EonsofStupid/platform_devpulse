<!--
	@component TabsContent
	@kind tabs
	@slot content
	@layer components

	Tab panel with role="tabpanel".
	Parameterized by value — spreads adapter getContent() slot attrs
	(role, aria-labelledby, tabindex, hidden, data-state).
-->
<script lang="ts">
	import type { TabsContentProps } from "./types.js";
	import { getTabsContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let { value, children, class: className, ...rest }: TabsContentProps = $props();
	const tabs = getTabsContext();
	const recipe = getRecipe("tabs.glass.void");
	const contentClass = recipe?.classes?.({} as any)?.content ?? "";
	const slotAttrs = $derived(tabs.getContent(value));
</script>

<div
	{...slotAttrs}
	class={cn(contentClass, className)}
	data-kind="tabs"
	data-slot="content"
	{...rest}
>
	{@render children?.()}
</div>
