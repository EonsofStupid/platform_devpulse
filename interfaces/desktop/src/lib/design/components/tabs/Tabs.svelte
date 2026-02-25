<!--
	@component Tabs
	@kind tabs
	@layer components

	ColdLight Tabs root — creates ColdLightTabs adapter and provides via context.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Tabs Pattern
-->
<script lang="ts">
	import type { TabsProps } from "./types.js";
	import { ColdLightTabs } from "$lib/design/api/adapters/coldlight/_internal/tabs/tabs.svelte.js";
	import { setTabsContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let {
		value = "",
		onValueChange,
		orientation = "horizontal",
		activateOnFocus = true,
		loop = true,
		children,
		class: className,
		...rest
	}: TabsProps = $props();

	const tabs = new ColdLightTabs({
		value: () => value,
		onValueChange: (v) => onValueChange?.(v),
		orientation: () => orientation,
		activateOnFocus: () => activateOnFocus,
		loop: () => loop,
	});

	setTabsContext(tabs);

	const recipe = getRecipe("tabs.glass.void");
	const rootClass = recipe?.classes({} as any)?.root ?? "";
</script>

<div
	{...tabs.root}
	class={cn(rootClass, className)}
	data-kind="tabs"
	data-slot="root"
	{...rest}
>
	{@render children?.()}
</div>
