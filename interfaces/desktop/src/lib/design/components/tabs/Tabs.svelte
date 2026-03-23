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
import { ColdLightTabs } from "$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { setTabsContext } from "./context.js";
import type { TabsProps } from "./types.js";

let {
	value = "",
	onValueChange,
	orientation = "horizontal",
	activateOnFocus = true,
	loop = true,
	children,
	class: className,
	size,
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
