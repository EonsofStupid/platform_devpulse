<!--
  @file src/lib/layouts/app/Sidebar.svelte
  @module @devpulse/layouts/app/Sidebar
  @layer lib

  Vertical sidebar with Lucide icons and ColdLight components.
  Supports child route submenu via globalState.

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0

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
import {
	Brain,
	Database,
	Home,
	Palette,
	PanelLeftClose,
	PanelLeftOpen,
	Radio,
	Sparkles,
	Wrench,
} from "lucide-svelte";
import { page } from "$app/state";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { stack } from "$lib/design/utils/stack/index.js";
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
	{ id: "clyffy", icon: Sparkles, label: "Clyffy", href: "/clyffy" },
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
	<div class={`${stack({ gap: "1" })} pt-1`}>
		{#each navHubs as hub (hub.id)}
			<a href={hub.href} onclick={() => handleHubClick(hub)} class="contents">
				<Button
					preset={isActive(hub.href) ? "primary" : "ghost"}
					size="sm"
					class={cn(
						isExpanded
							? "w-full justify-start gap-3 px-3 py-2"
							: "h-11 w-11 justify-self-center",
						isActive(hub.href) && "rounded-md",
					)}
					aria-label={hub.label}
					aria-current={isActive(hub.href) ? "page" : undefined}
					title={hub.label}
				>
					<hub.icon size={20} />
					{#if isExpanded}
						<Text size="sm" color="secondary" class="truncate">{hub.label}</Text>
					{/if}
				</Button>
			</a>
		{/each}
	</div>

	{#if import.meta.env.DEV}
		<div class={`${stack({ gap: "1" })} border-t border-[var(--border-soft)] pt-1`}>
			<a href="/devpulse/models" class="contents">
				<Button
					preset={isActive("/devpulse/models") ? "primary" : "ghost"}
					size="sm"
					class={cn(
						isExpanded
							? "w-full justify-start gap-3 px-3 py-2"
							: "h-11 w-11 justify-self-center",
					)}
					aria-label="Models"
					title="Model Control"
				>
					<Database size={20} />
					{#if isExpanded}
						<Text size="sm" color="secondary" class="truncate">Models</Text>
					{/if}
				</Button>
			</a>
		</div>
	{/if}

	<div class={`${stack({ gap: "1" })} pb-1`}>
		<Button
			preset="ghost"
			size="sm"
			class={isExpanded
				? "w-full justify-start gap-3 px-3 py-2"
				: "h-11 w-11 justify-self-center"}
			title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
			aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
			onclick={() => globalState.toggleSidebar()}
		>
			{#if isExpanded}
				<PanelLeftClose size={18} />
				<Text size="sm" color="secondary" class="truncate">Collapse</Text>
			{:else}
				<PanelLeftOpen size={18} />
			{/if}
		</Button>
	</div>

	{#if globalState.sidebar_submenu && submenuRoutes.length > 0}
		<div
			data-slot="submenu"
			class={cn(box({}), "absolute left-full top-0 z-[var(--z-dropdown)] flex h-full w-48 flex-col gap-1 p-2")}
			role="menu"
		>
			<Text size="xs" color="muted" class="mb-1 px-2 font-semibold uppercase tracking-wider">
				{globalState.sidebar_submenu}
			</Text>
			{#each submenuRoutes as route (route.path)}
				<a href={route.path} onclick={handleSubmenuNav} class="contents">
					<Button
						preset="ghost"
						size="sm"
						class="w-full justify-start px-3 py-2 capitalize"
						aria-current={isActive(route.path) ? "page" : undefined}
						role="menuitem"
					>
						<Text size="sm" color="secondary">{route.label}</Text>
					</Button>
				</a>
			{/each}
		</div>
	{/if}
</nav>
