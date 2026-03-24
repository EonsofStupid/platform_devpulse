<!--
	@component Sidebar
	@kind sidebar
	@layer components
	Hook (ARIA) + StyleMacro (visual).
-->
<script lang="ts">
import { useSidebar } from "$lib/design/primitives/sidebar/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SidebarComponentProps } from "./types.js";
let { size = "md", expanded = true, onExpandedChange, label, header, footer, children, class: className, ...rest }: SidebarComponentProps = $props();
const sidebar = $derived(useSidebar({ label, expanded }));
const styleId = "sidebar-default";
</script>
<StyleMacro kind="sidebar" style={styleId}>
	<aside {...sidebar.root} data-kind="sidebar" data-slot="root" data-state={expanded ? "expanded" : "collapsed"} class={cn("flex flex-col h-full", className)} {...rest}>
		{#if header}<div data-kind="sidebar" data-slot="header">{@render header()}</div>{/if}
		<div data-kind="sidebar" data-slot="content" class="flex-1 overflow-y-auto">{@render children?.()}</div>
		{#if footer}<div data-kind="sidebar" data-slot="footer">{@render footer()}</div>{/if}
	</aside>
</StyleMacro>
