<!--
  @file src/lib/layouts/app/Frame.svelte
  @module @devpulse/layouts/app/Frame

  App shell frame — ColdLight 6-zone CSS Grid layout.
  Zones: topbar, sidebar (left), content, context (right), statusbar, overlay.
  All layout structural. Visual via token var() refs.

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
import type { Snippet } from "svelte";
import { cn } from "$lib/design/utils/cn.js";
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

/** Structural layout classes per shell slot — no recipe import */
const SLOTS = {
	frame: "grid h-screen w-screen overflow-hidden grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto] font-sans",
	topbar: cn(
		"col-span-full flex items-center justify-between",
		"h-12 px-4",
		"border-b border-[var(--border-soft)]",
	),
	sidebar: cn(
		"row-start-2 col-start-1 flex flex-col items-center",
		"w-12 py-2 gap-2",
		"border-r border-[var(--border-subtle)]",
		"overflow-y-auto scrollbar-thin",
	),
	sidebarExpanded: cn(
		"row-start-2 col-start-1 flex flex-col",
		"w-56 py-2",
		"border-r border-[var(--border-subtle)]",
		"overflow-y-auto scrollbar-thin",
	),
	content: "row-start-2 col-start-2 overflow-y-auto scrollbar-thin p-6",
	context: cn(
		"row-start-2 col-start-3 w-0 overflow-hidden",
		"border-l border-[var(--border-subtle)]",
	),
	contextExpanded: cn(
		"row-start-2 col-start-3 w-72 overflow-y-auto scrollbar-thin",
		"border-l border-[var(--border-subtle)]",
	),
	statusbar: cn(
		"col-span-full flex items-center justify-between",
		"h-7 px-4",
		"border-t border-[var(--border-soft)]",
		"text-xs text-[var(--text-muted)]",
	),
	overlay: "fixed inset-0 z-50 bg-transparent pointer-events-none",
	overlayActive: "fixed inset-0 z-50 bg-[var(--overlay-bg)] pointer-events-auto",
} as const;
</script>

<div
	class={SLOTS.frame}
	data-kind="shell"
	data-slot="frame"
	data-layout="app"
	data-sidebar={globalState.sidebar_mode}
	data-context={globalState.context_mode}
	data-route={globalState.current_domain}
>
	<header data-kind="shell" data-slot="topbar" class={SLOTS.topbar}>
		<TopBar />
	</header>

	<aside data-kind="shell" data-slot="sidebar" class={isSidebarExpanded ? SLOTS.sidebarExpanded : SLOTS.sidebar} data-expanded={isSidebarExpanded ? "true" : undefined}>
		<Sidebar />
	</aside>

	<main data-kind="shell" data-slot="content" class={SLOTS.content}>
		{@render children()}
	</main>

	<aside data-kind="shell" data-slot="context" class={isContextExpanded ? SLOTS.contextExpanded : SLOTS.context} data-expanded={isContextExpanded ? "true" : undefined}>
	</aside>

	<footer data-kind="shell" data-slot="statusbar" class={SLOTS.statusbar}>
		<StatusBar />
	</footer>

	<div
		data-kind="shell"
		data-slot="overlay"
		class={globalState.overlay_active ? SLOTS.overlayActive : SLOTS.overlay}
		role="button"
		tabindex="-1"
		onclick={() => globalState.hideOverlay()}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') globalState.hideOverlay(); }}
	>
	</div>
</div>
