<!--
	@component Tabs
	@kind tabs
	@layer component
	@category composite
	@description Tabbed interface for switching between mutually exclusive content panels
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
	@container true
	@containerSlots content
	@compound true
	@blockCategory layout
	@defaultStyle tabs-default
	@styleIds tabs-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, list:none, trigger:none, content:none, indicator:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useTabs } from "$lib/design/behaviors/tabs/use-tabs.svelte.js";
import { StyleMacro } from "$lib/design/styles/index.js";
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
	intent = "default",
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


setTabsContext({
	get hook() { return hook; },
});
</script>

<StyleMacro kind="tabs" intent={intent}>
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
