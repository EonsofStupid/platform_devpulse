<!--
	@component TabsTrigger
	@kind tabs
	@slot trigger
	@layer components

	Individual tab trigger button with role="tab".
	Parameterized by value — spreads adapter getTrigger() slot attrs
	(role, aria-selected, aria-controls, tabindex, onclick, onkeydown).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { getTabsContext } from "./context.js";
import type { TabsTriggerProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: TabsTriggerProps = $props();
const tabs = getTabsContext();
const recipe = getRecipe("tabs.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const triggerClass = recipe?.classes?.({} as any)?.trigger ?? "";
const slotAttrs = $derived(tabs.getTrigger(value, disabled));
</script>

<button
	{...slotAttrs}
	class={cn(triggerClass, className)}
	data-kind="tabs"
	data-slot="trigger"
	{...rest}
>
	{@render children?.()}
</button>
