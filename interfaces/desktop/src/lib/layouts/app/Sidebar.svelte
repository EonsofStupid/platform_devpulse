<!--
  @file src/lib/layouts/app/Sidebar.svelte
  @module @devpulse/layouts/app/Sidebar
  @layer lib

  Vertical sidebar with Lucide icons and ColdLight primitives.
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
import { Box } from "$lib/design/components/box/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Stack } from "$lib/design/components/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
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
	<Stack gap="1" class="pt-1">
		{#each navHubs as hub (hub.id)}
			<a href={hub.href} onclick={() => handleHubClick(hub)} class="contents">
				<Button
					intent={isActive(hub.href) ? "primary" : "ghost"}
					size="sm"
					radius="md"
					surface={isActive(hub.href) ? "glass-void" : undefined}
					glow={isActive(hub.href) ? "teal" : undefined}
					class={isExpanded
						? "w-full justify-start gap-3 px-3 py-2"
						: "h-10 w-10 justify-self-end"}
					aria-label={hub.label}
					aria-current={isActive(hub.href) ? "page" : undefined}
					title={hub.label}
				>
					<hub.icon size={18} />
					{#if isExpanded}
						<Text size="sm" color="secondary" class="truncate">{hub.label}</Text>
					{/if}
				</Button>
			</a>
		{/each}
	</Stack>

	<Stack gap="1" class="pb-1">
		<Button
			intent="ghost"
			size="sm"
			radius="md"
			class={isExpanded
				? "w-full justify-start gap-3 px-3 py-2"
				: "h-10 w-10 justify-self-end"}
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
	</Stack>

	{#if globalState.sidebar_submenu && submenuRoutes.length > 0}
		<Box
			data-slot="submenu"
			surface="glass-deep"
			depth="z2"
			radius="md"
			class="absolute left-full top-0 z-[var(--z-dropdown)] flex h-full w-48 flex-col gap-1 p-2"
			role="menu"
		>
			<Text size="xs" color="muted" class="mb-1 px-2 font-semibold uppercase tracking-wider">
				{globalState.sidebar_submenu}
			</Text>
			{#each submenuRoutes as route (route.path)}
				<a href={route.path} onclick={handleSubmenuNav} class="contents">
					<Button
						intent="ghost"
						size="sm"
						radius="md"
						class="w-full justify-start px-3 py-2 capitalize"
						aria-current={isActive(route.path) ? "page" : undefined}
						role="menuitem"
					>
						<Text size="sm" color="secondary">{route.label}</Text>
					</Button>
				</a>
			{/each}
		</Box>
	{/if}
</nav>
