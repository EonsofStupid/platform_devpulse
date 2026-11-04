<!--
  @file src/lib/layouts/app/Sidebar.svelte
  @module @devpulse/layouts/app/Sidebar
  @layer lib

  Vertical sidebar built from the route folders (plan 0008): hubs are the
  route group's top-level pages and `footer` pages pin below the hubs. Icons,
  order and placement are each folder's own `_nav`; names are copy. See
  `sidebar-entries.ts`. A hub with child pages toggles its submenu, which
  Frame draws beside this rail (`SidebarSubmenu.svelte`) — inside the rail
  it was clipped.

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
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import { cn, stack } from "@devpulse/coldlight/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-svelte";
import { copyState } from "#lib/sys/copy/index.js";
import { hrefOf, type RouteNode, routeCopy } from "#lib/sys/routing/index.js";
import { globalState } from "#lib/sys/runes/global.svelte.js";
import { page } from "$app/state";
import { footerEntries, groupOf, hubEntries, isActiveRoute, submenuOf } from "./sidebar-entries.js";

const group = $derived(groupOf(page.route.id));
const hubs = $derived(hubEntries(group));
const footer = $derived(footerEntries(group));
const text = $derived(copyState.catalog?.layout.sidebar);

const isActive = (node: RouteNode): boolean => isActiveRoute(node, page.url.pathname);

function handleHubClick(hub: RouteNode): void {
	if (submenuOf(hub).length > 0) {
		globalState.openSubmenu(hub.segment);
	} else {
		globalState.closeSubmenu();
	}
	globalState.setDomain(hub.segment);
}

const isExpanded = $derived(globalState.sidebar_mode === "expanded");
</script>

{#snippet entry(node: RouteNode, extraClass: string, onclick?: () => void)}
	{@const copy = routeCopy(node)}
	{@const label = copy?.label ?? ""}
	{@const Icon = node.nav.icon}
	<a href={hrefOf(node)} {onclick} class="contents">
		<Button
			variant={isActive(node) ? "primary" : "ghost"}
			size="sm"
			class={cn(
				"relative",
				isExpanded ? "w-full justify-start gap-3 px-3 py-2" : "h-11 w-11 justify-self-center",
				extraClass,
			)}
			aria-label={label}
			aria-current={isActive(node) ? "page" : undefined}
			title={label}
		>
			{#if Icon}
				<Icon size={20} />
			{/if}
			{#if isExpanded}
				<Text size="sm" color="secondary" class="truncate">{label}</Text>
			{/if}
			{#if node.nav.badge?.()}
				<span
					aria-label={copy?.badge ?? undefined}
					class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
					style="background: var(--accent-positive-main)"
				></span>
			{/if}
		</Button>
	</a>
{/snippet}

<nav class="relative z-10 grid h-full grid-rows-[1fr_auto] gap-2" aria-label={text?.label}>
	<div class={`${stack({ gap: "1" })} pt-1`}>
		{#each hubs as hub (hub.path)}
			{@render entry(hub, isActive(hub) ? "rounded-md" : "", () => handleHubClick(hub))}
		{/each}
	</div>

	{#if import.meta.env.DEV && footer.length > 0}
		<div class={`${stack({ gap: "1" })} border-t border-[var(--border-soft)] pt-1`}>
			{#each footer as pinned (pinned.path)}
				{@render entry(pinned, "")}
			{/each}
		</div>
	{/if}

	<div class={`${stack({ gap: "1" })} pb-1`}>
		<Button
			variant="ghost"
			size="sm"
			class={isExpanded
				? "w-full justify-start gap-3 px-3 py-2"
				: "h-11 w-11 justify-self-center"}
			title={isExpanded ? text?.collapse : text?.expand}
			aria-label={isExpanded ? text?.collapse : text?.expand}
			onclick={() => globalState.toggleSidebar()}
		>
			{#if isExpanded}
				<PanelLeftClose size={18} />
				<Text size="sm" color="secondary" class="truncate">{text?.collapse_short}</Text>
			{:else}
				<PanelLeftOpen size={18} />
			{/if}
		</Button>
	</div>
</nav>
