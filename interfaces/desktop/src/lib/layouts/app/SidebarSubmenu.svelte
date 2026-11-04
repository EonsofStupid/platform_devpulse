<!--
  @file src/lib/layouts/app/SidebarSubmenu.svelte
  @module @devpulse/layouts/app/SidebarSubmenu
  @layer lib

  The open hub's child pages (plan 0008 R17), names from copy. A region of
  the frame, not a child of the sidebar rail: the rail scrolls and clips
  (its backdrop stays inside it), which hid a flyout drawn past its edge.
  Frame places this beside the rail, over the page. Over the page it needs
  a surface of its own, so the panel is ColdLight's popover content (a
  floating panel anchored to its trigger: elevated, from the family in
  scope). Escape or a press outside closes it; a press on the rail is left to
  the hub buttons, which toggle it.

  @consumers
  - Frame.svelte: placed in the content cell
-->
<script lang="ts">
import { useDismissLayer, useEscapeLayer } from "@devpulse/coldlight/behaviors";
import { Button } from "@devpulse/coldlight/components/button";
import { POPOVER_DEFAULTS } from "@devpulse/coldlight/components/popover";
import { Text } from "@devpulse/coldlight/components/text";
import { styleAttrs } from "@devpulse/coldlight/renderforge";
import { cn } from "@devpulse/coldlight/utils";
import { groupOf, hrefOf, routeCopy } from "#lib/sys/routing/index.js";
import { globalState } from "#lib/sys/runes/global.svelte.js";
import { page } from "$app/state";
import { hubEntries, isActiveRoute, submenuOf } from "./sidebar-entries.js";

interface Props {
	/** The sidebar rail; a press there is the hub buttons' to handle. */
	rail?: HTMLElement | null;
	/** Frame's placement of this region. */
	class?: string;
}

let { rail = null, class: className }: Props = $props();

const hubs = $derived(hubEntries(groupOf(page.route.id)));
const openHub = $derived(hubs.find((h) => h.segment === globalState.sidebar_submenu));
const submenu = $derived(openHub ? submenuOf(openHub) : []);
const open = $derived(submenu.length > 0);

/** The panel's dismiss rules, live while it is mounted — as ColdLight's popover attaches its own. */
function attachLayers(panel: HTMLElement): void {
	useEscapeLayer({ enabled: () => true, onEscape: () => globalState.closeSubmenu() });
	useDismissLayer({
		enabled: () => true,
		node: () => panel,
		exclude: () => [rail],
		onDismiss: () => globalState.closeSubmenu(),
	});
}
</script>

{#if openHub && open}
	<div data-kind="shell" data-slot="submenu" class={cn("flex p-2", className)}>
		<div
			use:attachLayers
			{...styleAttrs({ kind: "popover", variant: POPOVER_DEFAULTS.variant })}
			data-slot="content"
			class="flex w-48 flex-col gap-1 p-2"
			role="menu"
		>
			<Text size="xs" color="muted" class="mb-1 px-2 font-semibold uppercase tracking-wider">
				{routeCopy(openHub)?.label}
			</Text>
			{#each submenu as child (child.path)}
				<a href={hrefOf(child)} onclick={() => globalState.closeSubmenu()} class="contents">
					<Button
						variant="ghost"
						size="sm"
						class="w-full justify-start px-3 py-2"
						aria-current={isActiveRoute(child, page.url.pathname) ? "page" : undefined}
						role="menuitem"
					>
						<Text size="sm" color="secondary">{routeCopy(child)?.label}</Text>
					</Button>
				</a>
			{/each}
		</div>
	</div>
{/if}
