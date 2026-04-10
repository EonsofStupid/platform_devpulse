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
import { tabsAnatomy } from "$lib/design/behaviors/navigation/tabs/index.js";
import { useTabs } from "$lib/design/behaviors/navigation/tabs/use-tabs.svelte.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
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
	preset = "default",
	class: className,
	...rest
}: TabsProps = $props();

const hook = useTabs({
	get value() {
		return value;
	},
	onValueChange: (v) => onValueChange?.(v),
	get orientation() {
		return orientation;
	},
	get activateOnFocus() {
		return activateOnFocus;
	},
	get loop() {
		return loop;
	},
});

setTabsContext({
	get hook() {
		return hook;
	},
});

const m = $derived(renderForge({ kind: "tabs", preset }));
</script>

<div
		{...tabsAnatomy.attrs.root}
		{...hook.root}
		{...rest}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-orientation={orientation}
		class={cn(className)}
	>
		{@render children?.()}
	</div>
