<!--
	@component Tabs (Root)
	@kind tabs
	@layer components

	Tabbed interface. Hook (ARIA) + StyleMacro (visual).
	Compound: List, Trigger, Content.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
-->
<script lang="ts">
import { useTabs } from "$lib/design/primitives/tabs/use-tabs.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
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
	...rest
}: TabsProps = $props();

const hook = useTabs({
	get value() { return value; },
	onValueChange: (v) => onValueChange?.(v),
	orientation,
	activateOnFocus,
	loop,
});

const styleId = "tabs-default";

setTabsContext({
	get hook() { return hook; },
});
</script>

<StyleMacro kind="tabs" style={styleId}>
	<div
		{...hook.root}
		data-kind="tabs"
		data-slot="root"
		data-orientation={orientation}
		class={cn(className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
