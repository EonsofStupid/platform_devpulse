<!--
  @file src/lib/layouts/app/Frame.svelte
  @module @devpulse/layouts/app/Frame

  App shell frame — ColdLight 6-zone CSS Grid layout.
  Zones: topbar, sidebar (left), content, context (right), statusbar, overlay.
  Consumes shell.app.default recipe. All styling token-backed.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { globalState } from "$lib/sys/runes/global.svelte";
import Sidebar from "./Sidebar.svelte";
import StatusBar from "./StatusBar.svelte";
import TopBar from "./TopBar.svelte";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const isSidebarExpanded = $derived(globalState.sidebar_mode === "expanded");
const isContextExpanded = $derived(globalState.context_mode === "expanded");

const shell = getRecipe("shell.app.default");
const slots = $derived(
	shell?.classes?.({
		...shell.defaults,
	}) ?? {},
);
</script>

<div
	class={cn(slots.frame, "font-sans")}
	data-kind="shell"
	data-slot="frame"
	data-layout="app"
	data-sidebar={globalState.sidebar_mode}
	data-context={globalState.context_mode}
	data-route={globalState.current_domain}
>
	<header data-kind="shell" data-slot="topbar" class={slots.topbar}>
		<TopBar />
	</header>

	<aside data-kind="shell" data-slot="sidebar" class={isSidebarExpanded ? slots.sidebarExpanded : slots.sidebar} data-expanded={isSidebarExpanded ? "true" : undefined}>
		<Sidebar />
	</aside>

	<main data-kind="shell" data-slot="content" class={slots.content}>
		{@render children()}
	</main>

	<aside data-kind="shell" data-slot="context" class={isContextExpanded ? slots.contextExpanded : slots.context} data-expanded={isContextExpanded ? "true" : undefined}>
	</aside>

	<footer data-kind="shell" data-slot="statusbar" class={slots.statusbar}>
		<StatusBar />
	</footer>

	<div
		data-kind="shell"
		data-slot="overlay"
		class={globalState.overlay_active ? slots.overlayActive : slots.overlay}
		role="button"
		tabindex="-1"
		onclick={() => globalState.hideOverlay()}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') globalState.hideOverlay(); }}
	>
	</div>
</div>
