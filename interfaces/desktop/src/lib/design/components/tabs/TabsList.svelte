<!--
	@component TabsList
	@kind tabs
	@slot list
	@layer components

	Tab trigger list container with role="tablist".
	Spreads adapter list slot attrs (role, aria-orientation).
-->
<script lang="ts">
	import type { TabsListProps } from "./types.js";
	import { getTabsContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let { children, class: className, ...rest }: TabsListProps = $props();
	const tabs = getTabsContext();
	const recipe = getRecipe("tabs.glass.void");
	const listClass = recipe?.classes({} as any)?.list ?? "";
</script>

<div
	{...tabs.list}
	class={cn(listClass, className)}
	data-kind="tabs"
	data-slot="list"
	{...rest}
>
	{@render children?.()}
</div>
