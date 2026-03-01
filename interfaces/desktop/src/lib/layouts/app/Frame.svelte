<!--
  @file src/lib/layouts/app/Frame.svelte
  @module @devpulse/layouts/app/Frame
  @layer lib

  @description
  App shell frame with ColdLight 6-zone CSS Grid layout.
  Zones: topbar, sidebar (left), content, context (right), statusbar, overlay.
  Wired to globalState for sidebar/context mode and route domain.

  @since 1.0.0
-->
<script lang="ts">
import type { Snippet } from "svelte";
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
	shell?.classes({
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		size: "md",
		radius: "lg",
	}) ?? {},
);
</script>

<div
	class={slots.frame}
	data-layout="app"
	data-sidebar={globalState.sidebar_mode}
	data-context={globalState.context_mode}
	data-route={globalState.current_domain}
	style="font-family: var(--font-sans);"
>
	<header data-slot="topbar" class={slots.topbar}>
		<TopBar />
	</header>

	<aside data-slot="sidebar" class={isSidebarExpanded ? slots.sidebarExpanded : slots.sidebar} data-expanded={isSidebarExpanded ? "true" : undefined}>
		<Sidebar />
	</aside>

	<main data-slot="content" class={slots.content}>
		{@render children()}
	</main>

	<aside data-slot="context" class={isContextExpanded ? slots.contextExpanded : slots.context} data-expanded={isContextExpanded ? "true" : undefined}>
	</aside>

	<footer data-slot="statusbar" class={slots.statusbar}>
		<StatusBar />
	</footer>

	<div data-slot="overlay" class={globalState.overlay_active ? slots.overlayActive : slots.overlay} role="button" tabindex="-1" onclick={() => globalState.hideOverlay()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') globalState.hideOverlay(); }}>
	</div>
</div>
