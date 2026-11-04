<!--
  @file src/lib/layouts/app/Frame.svelte
  @module @devpulse/layouts/app/Frame

  App shell frame — ColdLight 6-zone CSS Grid layout.
  Zones: topbar, sidebar (left), content, context (right), statusbar, overlay.
  The sidebar's submenu shares the content cell, drawn over the page at the
  rail's edge (the rail clips, so it cannot hold a flyout).
  All layout structural. Visual via token var() refs, in ./styles.
  The page column is the owner's Viewport: centred, up to its token's width.

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
import "./styles/index.css";
import { BackgroundScene } from "@devpulse/coldlight/components/background-scene";
import { cn } from "@devpulse/coldlight/utils";
import type { Snippet } from "svelte";
import { SwapOverlay } from "#lib/domains/app/models/index.js";
import ActivityHud from "#lib/sys/activity-hud/ActivityHud.svelte";
import { hubHere } from "#lib/sys/routing/index.js";
import { globalState } from "#lib/sys/runes/global.svelte.js";
import { iconGlow } from "./icon-glow.js";
import Sidebar from "./Sidebar.svelte";
import SidebarSubmenu from "./SidebarSubmenu.svelte";
import StatusBar from "./StatusBar.svelte";
import TopBar from "./TopBar.svelte";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const isSidebarExpanded = $derived(globalState.sidebar_mode === "expanded");
let rail = $state<HTMLElement | null>(null);
const isContextExpanded = $derived(globalState.context_mode === "expanded");

// The floating chat panel loads the chat domain the first time it opens.
let chatOverlay = $state<Promise<typeof import("./ChatOverlay.svelte")> | null>(null);
$effect(() => {
	if (globalState.chat_overlay_open) chatOverlay ??= import("./ChatOverlay.svelte");
});

/** Ctrl+Shift+C opens and closes the floating chat panel. */
function onKeydown(e: KeyboardEvent): void {
	if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
		e.preventDefault();
		globalState.toggleChatOverlay();
	}
}

/** Structural layout classes per shell slot — no recipe import */
/** Layout dimensions — reference: DASHBOARD-REFERENCE-01.png, refernece-dashboard3/4.png
 *  TopBar:   66px  (h-[4.125rem])  — brand + pulse feed + clyffy badge
 *  Sidebar:  60px collapsed / 240px expanded — icon nav + labels
 *  StatusBar: 52px (h-[3.25rem])  — service pills, vitals, version
 *  Context:  400px (w-[25rem])    — chat portal / devtools panel
 */
const SLOTS = {
	frame:
		"grid h-screen w-screen overflow-hidden grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto] font-sans",
	topbar: cn(
		"col-span-full flex items-center justify-between",
		"h-[var(--layout-topbar-height)] px-4",
	),
	sidebar: cn(
		"row-start-2 col-start-1 flex flex-col items-center relative",
		"w-[var(--layout-sidebar-collapsed)] py-3 gap-2",
		"overflow-x-hidden overflow-y-auto",
		"transition-[width,padding] duration-[var(--duration-md)] ease-[cubic-bezier(0.4,0,0.2,1)]",
		"motion-reduce:transition-none",
	),
	sidebarExpanded: cn(
		"row-start-2 col-start-1 flex flex-col relative",
		"w-[var(--layout-sidebar-expanded)] py-3 px-2",
		"overflow-x-hidden overflow-y-auto",
		"transition-[width,padding] duration-[var(--duration-md)] ease-[cubic-bezier(0.4,0,0.2,1)]",
		"motion-reduce:transition-none",
	),
	content: "row-start-2 col-start-2 min-w-0 overflow-y-auto p-4 lg:p-6",
	viewport: "mx-auto w-full max-w-[var(--layouts-content-max-width)]",
	submenu: "row-start-2 col-start-2 justify-self-start self-stretch z-[var(--z-index-dropdown)]",
	context: cn(
		"row-start-2 col-start-3 w-0 overflow-hidden",
		"border-l border-[var(--border-subtle)]",
	),
	contextExpanded: cn(
		"row-start-2 col-start-3 w-[var(--layout-context-width)] overflow-y-auto scrollbar-thin",
		"border-l border-[var(--border-subtle)]",
	),
	statusbar: cn(
		"col-span-full flex items-center justify-between",
		"h-[var(--layout-statusbar-height)] px-4 py-1",
		"text-xs text-[var(--text-muted)]",
		"overflow-x-auto scrollbar-thin",
	),
	overlay: "fixed inset-0 z-50 bg-transparent pointer-events-none",
	overlayActive: "fixed inset-0 z-50 bg-[var(--overlay-bg)] pointer-events-auto",
} as const;
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class={SLOTS.frame}
	data-kind="shell"
	data-slot="frame"
	data-layout="app"
	data-sidebar={globalState.sidebar_mode}
	data-context={globalState.context_mode}
	data-route={hubHere()?.segment}
>
	<!-- Shell-wide cosmic backdrop — subtle ambient layer behind everything.
	     The sidebar mounts its own stronger instance below for accent depth.
	     Optional starfield .webp can be dropped at static/imgs/backgrounds/cosmic-stars.webp
	     and wired via the imageSrc prop when authored. -->
	<BackgroundScene variation="cosmic-galaxy" palette="cosmic" speed="slow" intensity="subtle" motion="on" />

	<header data-kind="shell" data-slot="topbar" class={SLOTS.topbar} use:iconGlow>
		<TopBar />
	</header>

	<aside bind:this={rail} data-kind="shell" data-slot="sidebar" class={isSidebarExpanded ? SLOTS.sidebarExpanded : SLOTS.sidebar} data-expanded={isSidebarExpanded ? "true" : undefined} use:iconGlow>
		<!-- Sidebar-scoped cosmic backdrop at stronger intensity.
		     Parent <aside> has position: relative + overflow-x-hidden so the
		     animation stays clipped inside the rail/panel. -->
		<BackgroundScene variation="cosmic-galaxy" palette="cosmic" speed="slow" intensity="strong" motion="on" />
		<Sidebar />
	</aside>

	<main data-kind="shell" data-slot="content" class={SLOTS.content}>
		<div class={SLOTS.viewport}>
			{@render children()}
		</div>
	</main>

	<SidebarSubmenu {rail} class={SLOTS.submenu} />

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

	<!-- The floating chat panel, inside this window -->
	{#if chatOverlay}
		{#await chatOverlay then { default: ChatOverlay }}
			<ChatOverlay bind:open={globalState.chat_overlay_open} />
		{/await}
	{/if}

	<!-- Model swap overlay — full-screen block during load/unload only -->
	<SwapOverlay />

	<ActivityHud />
</div>
