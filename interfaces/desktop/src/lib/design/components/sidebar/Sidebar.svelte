<!--
	@component Sidebar
	@kind sidebar
	@layer component
	@category structural
	@description Persistent or collapsible side navigation panel for application-level wayfinding
	@container true
	@containerSlots content
	@compound true
	@blockCategory layout
	@defaultStyle sidebar-default
	@styleIds sidebar-default
	@requiredAxes backgroundColor, border, shadow
	@slots root:all, header:none, content:none, footer:none, toggle:none
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
import { useSidebar } from "$lib/design/behaviors/sidebar/index.js";
import { resolveMacro, cssVarString } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { SidebarComponentProps } from "./types.js";
let { size = "md", expanded = true, onExpandedChange, label, header, footer, preset = "default", children, class: className, ...rest }: SidebarComponentProps = $props();
const sidebar = $derived(useSidebar({ label, expanded }));
const m = $derived(resolveMacro({ kind: "sidebar", preset }));
</script>
<aside {...sidebar.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-slot="root" data-state={expanded ? "expanded" : "collapsed"} class={cn("flex flex-col h-full", className)} {...rest}>
		{#if header}<div data-kind="sidebar" data-slot="header">{@render header()}</div>{/if}
		<div data-kind="sidebar" data-slot="content" class="flex-1 overflow-y-auto">{@render children?.()}</div>
		{#if footer}<div data-kind="sidebar" data-slot="footer">{@render footer()}</div>{/if}
	</aside>
