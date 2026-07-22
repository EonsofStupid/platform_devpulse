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
import { BackgroundScene } from "$lib/design/components/background-scene/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { SetupWizardOverlay } from "$lib/domains/app/models/feature/setup-wizard/index.js";
import { SwapOverlay } from "$lib/domains/app/models/index.js";
import ActivityHud from "$lib/sys/activity-hud/ActivityHud.svelte";
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
/** Layout dimensions — reference: DASHBOARD-REFERENCE-01.png, refernece-dashboard3/4.png
 *  TopBar:   66px  (h-[4.125rem])  — brand + pulse feed + clyffy badge
 *  Sidebar:  60px collapsed / 240px expanded — icon nav + labels
 *  StatusBar: 52px (h-[3.25rem])  — service pills, vitals, version
 *  Context:  400px (w-[25rem])    — chat portal / devtools panel
 */
const SLOTS = {
	// Named-areas shell: the zone map is declared ONCE here; every slot
	// binds by name. Zones are cqi container seams (S1.C adoption
	// contract) — the frame ROOT stays container-free so the fixed
	// overlays below keep the viewport as their containing block.
	frame: cn(
		"grid h-screen w-screen overflow-hidden font-sans",
		"grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto]",
		"[grid-template-areas:'topbar_topbar_topbar'_'sidebar_content_context'_'statusbar_statusbar_statusbar']",
	),
	topbar: cn(
		"[grid-area:topbar] flex items-center justify-between",
		"h-topbar px-4",
		"border-b border-[var(--border-soft)]",
		// Shell chrome paints above the content zone — the zone's container
		// seam creates a stacking context, and its absolute dropdown must
		// not slip under content.
		"relative z-10",
		"[container-type:inline-size] [container-name:topbar]",
	),
	sidebar: cn(
		"[grid-area:sidebar] flex flex-col items-center relative",
		"w-sidebar-collapsed py-3 gap-2",
		"border-r border-[var(--border-subtle)]",
		"overflow-x-hidden overflow-y-auto scrollbar-thin",
		"transition-[width,padding] duration-[var(--duration-md)] ease-[cubic-bezier(0.4,0,0.2,1)]",
		"motion-reduce:transition-none",
		"[container-type:inline-size] [container-name:sidebar]",
	),
	sidebarExpanded: cn(
		"[grid-area:sidebar] flex flex-col relative",
		"w-sidebar-expanded py-3 px-2",
		"border-r border-[var(--border-subtle)]",
		"overflow-x-hidden overflow-y-auto scrollbar-thin",
		"transition-[width,padding] duration-[var(--duration-md)] ease-[cubic-bezier(0.4,0,0.2,1)]",
		"motion-reduce:transition-none",
		"[container-type:inline-size] [container-name:sidebar]",
	),
	content: cn(
		"[grid-area:content] overflow-y-auto scrollbar-thin p-4 lg:p-6",
		"[container-type:inline-size] [container-name:content]",
	),
	context: cn("[grid-area:context] w-0 overflow-hidden", "border-l border-[var(--border-subtle)]"),
	contextExpanded: cn(
		"[grid-area:context] w-context overflow-y-auto scrollbar-thin",
		"border-l border-[var(--border-subtle)]",
		"[container-type:inline-size] [container-name:context]",
	),
	statusbar: cn(
		"[grid-area:statusbar] flex items-center justify-between",
		"h-statusbar px-4 py-1",
		"border-t border-[var(--border-soft)]",
		"text-xs text-[var(--text-muted)]",
		"overflow-x-auto scrollbar-thin",
		"[container-type:inline-size] [container-name:statusbar]",
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
	<!-- Shell-wide cosmic backdrop — subtle ambient layer behind everything.
	     The sidebar mounts its own stronger instance below for accent depth.
	     Optional starfield .webp can be dropped at static/imgs/backgrounds/cosmic-stars.webp
	     and wired via the imageSrc prop when authored. -->
	<BackgroundScene variation="cosmic-galaxy" palette="cosmic" speed="slow" intensity="subtle" motion="on" />

	<header data-kind="shell" data-slot="topbar" class={SLOTS.topbar}>
		<TopBar />
	</header>

	<aside data-kind="shell" data-slot="sidebar" class={isSidebarExpanded ? SLOTS.sidebarExpanded : SLOTS.sidebar} data-expanded={isSidebarExpanded ? "true" : undefined}>
		<!-- Sidebar-scoped cosmic backdrop at stronger intensity.
		     Parent <aside> has position: relative + overflow-x-hidden so the
		     animation stays clipped inside the rail/panel. -->
		<BackgroundScene variation="cosmic-galaxy" palette="cosmic" speed="slow" intensity="strong" motion="on" />
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

	<SetupWizardOverlay />

	<!-- Model swap overlay — full-screen block during load/unload only -->
	<SwapOverlay />

	<ActivityHud />
</div>
