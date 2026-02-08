<!--
  @file src/lib/layouts/app/Sidebar.svelte
  @module @devpulse/layouts/app/Sidebar
  @layer lib

  @description
  Vertical sidebar with ColdLight primitives and Lucide icons.
  Supports child route submenu via globalState.

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0
-->
<script lang="ts">
import {
	Brain,
	Home,
	Palette,
	PanelLeftClose,
	PanelLeftOpen,
	Radio,
	Sparkles,
	Wrench,
} from "lucide-svelte";
import { page } from "$app/state";
import { Button, ButtonIcon } from "$lib/design/primitives/button";
import { getChildRoutes } from "$lib/sys/routing/child-routes";
import { globalState } from "$lib/sys/runes/global.svelte";

interface NavHub {
	id: string;
	icon: typeof Home;
	label: string;
	href: string;
}

const navHubs: NavHub[] = [
	{ id: "devpulse", icon: Home, label: "Home", href: "/devpulse" },
	{ id: "ui-demo", icon: Palette, label: "UI Demo", href: "/ui-demo" },
	{ id: "overmind", icon: Brain, label: "OverMind", href: "/overmind" },
	{ id: "wiredfront", icon: Radio, label: "WiredFront", href: "/wiredfront" },
	{ id: "devforge", icon: Wrench, label: "DevForge", href: "/devforge" },
	{ id: "maestro", icon: Sparkles, label: "Maestro", href: "/maestro" },
];

function isActive(href: string): boolean {
	return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
}

function handleHubClick(hub: NavHub): void {
	const children = getChildRoutes(hub.href);
	if (children.length > 0) {
		globalState.openSubmenu(hub.id);
	} else {
		globalState.closeSubmenu();
	}
	globalState.setDomain(hub.id);
}

function handleSubmenuNav(): void {
	globalState.closeSubmenu();
}

const submenuRoutes = $derived(
	globalState.sidebar_submenu
		? getChildRoutes(navHubs.find((h) => h.id === globalState.sidebar_submenu)?.href ?? "")
		: [],
);

const isExpanded = $derived(globalState.sidebar_mode === "expanded");
</script>

<nav class="relative grid h-full grid-rows-[1fr_auto] gap-2" aria-label="Primary">
	<div class="grid auto-rows-min gap-2" role="list">
		{#each navHubs as hub (hub.id)}
			<a
				href={hub.href}
				data-kind="button"
				data-slot="root"
				class="flex items-center rounded-md"
				class:justify-center={!isExpanded}
				class:w-10={!isExpanded}
				class:h-10={!isExpanded}
				class:justify-self-end={!isExpanded}
				class:w-full={isExpanded}
				class:gap-3={isExpanded}
				class:px-3={isExpanded}
				class:py-2={isExpanded}
				aria-label={hub.label}
				aria-current={isActive(hub.href) ? "page" : undefined}
				title={hub.label}
				onclick={() => handleHubClick(hub)}
			>
				<span data-kind="button" data-slot="icon" class="flex shrink-0 items-center justify-center">
					<hub.icon size={18} />
				</span>
				{#if isExpanded}
					<span class="truncate text-sm text-[var(--text-secondary)]">{hub.label}</span>
				{/if}
			</a>
		{/each}
	</div>

	<div class="grid auto-rows-min gap-2">
		<Button
			class="flex items-center rounded-md {isExpanded ? 'w-full gap-3 px-3 py-2' : 'h-10 w-10 justify-center justify-self-end'}"
			title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
			aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
			onclick={() => globalState.toggleSidebar()}
		>
			<ButtonIcon>
				{#if isExpanded}
					<PanelLeftClose size={18} />
				{:else}
					<PanelLeftOpen size={18} />
				{/if}
			</ButtonIcon>
			{#if isExpanded}
				<span class="truncate text-sm text-[var(--text-secondary)]">Collapse</span>
			{/if}
		</Button>
	</div>

	{#if globalState.sidebar_submenu && submenuRoutes.length > 0}
		<div
			data-slot="submenu"
			class="absolute left-full top-0 z-[var(--z-dropdown)] flex h-full w-48 flex-col gap-1 p-2"
			role="menu"
		>
			<span class="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				{globalState.sidebar_submenu}
			</span>
			{#each submenuRoutes as route (route.path)}
				<a
					href={route.path}
					data-kind="button"
					data-slot="root"
					class="flex w-full items-center rounded-md px-3 py-2 text-sm capitalize text-[var(--text-secondary)]"
					aria-current={isActive(route.path) ? "page" : undefined}
					onclick={handleSubmenuNav}
					role="menuitem"
				>
					{route.label}
				</a>
			{/each}
		</div>
	{/if}
</nav>
