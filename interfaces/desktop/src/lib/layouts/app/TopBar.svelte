<!--
  @file src/lib/layouts/app/TopBar.svelte
  @module @devpulse/layouts/app/TopBar

  Top navigation bar. Reference: refernece-dashboard3.png / dashboard4.png
  Layout: [hamburger + brand] — [center: PULSE FEED pill] — [right: search + notifications + chat + DevPulse Tools + clyffy + avatar]
  The DevPulse Tools button and the avatar (→ Profile) take their names and
  icon from the route folders they open (plan 0008 R18).
  Height: 4.125rem (set by Frame.svelte topbar slot)

  @defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { Avatar } from "@devpulse/coldlight/components/avatar";
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField as Input } from "@devpulse/coldlight/components/text-field";
import { Parasite } from "@devpulse/coldlight/plugins/parasite";
import { hstack } from "@devpulse/coldlight/utils";
import { Bell, Menu, MessageCircle, Search, Sparkles } from "lucide-svelte";
import { onboardingState } from "$lib/domains/app/onboarding/index.js";
import { ProjectSwitcher } from "$lib/domains/app/projects/index.js";
import { ClyffyStatusOrb } from "$lib/domains/clyffy/index.js";
import { openWindow } from "$lib/sys/bindings/window/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { logError } from "$lib/sys/logger.js";
import { hrefOf, routeAt, routeCopy } from "$lib/sys/routing/index.js";
import { globalState } from "$lib/sys/runes/global.svelte";

let searchOpen = $state(false);
let searchQuery = $state("");
const text = $derived(copyState.catalog?.hubs.topbar);

function toggleSearch(): void {
	searchOpen = !searchOpen;
	if (!searchOpen) searchQuery = "";
}

async function openChat(): Promise<void> {
	const result = await openWindow("Chat");
	if (result.status === "error") {
		logError("layouts.app.TopBar", `open chat window failed: ${result.error}`);
	}
}

/** The DevPulse Tools window: opened, or brought forward if it is already open. */
const tools = routeAt("/devtools");
const toolsLabel = $derived(tools ? routeCopy(tools)?.label : undefined);

async function openTools(): Promise<void> {
	const result = await openWindow("DevTools");
	if (result.status === "error") {
		logError("layouts.app.TopBar", `open devtools window failed: ${result.error}`);
	}
}

const profile = routeAt("/profile");
const profileLabel = $derived(profile ? routeCopy(profile)?.label : undefined);

$effect(() => {
	void copyState.load();
});

function onKey(e: KeyboardEvent): void {
	if (e.key === "Escape" && searchOpen) toggleSearch();
}
</script>

<div class="flex w-full items-center justify-between gap-4" role="toolbar" tabindex="0" onkeydown={onKey} data-tauri-drag-region>
	<!-- Left: hamburger + brand -->
	<div class={hstack({ gap: "3", align: "center" })}>
		<Button
			variant="ghost"
			size="sm"
			class="h-9 w-9"
			title="Toggle sidebar"
			aria-label="Toggle sidebar"
			onclick={() => globalState.toggleSidebar()}
		>
			<Menu size={18} />
		</Button>
		<div class="flex items-center gap-2" style:font-family="var(--font-display)">
			<Parasite size="sm" />
		</div>
		<Badge variant="neutral" size="sm">{globalState.current_domain.toUpperCase()}</Badge>
		<!-- Active-project pill — next to brand so "what am I working on"
		     is the first thing the user sees after the app identity. -->
		<ProjectSwitcher />
		<!-- First run was set for later: the way back in (Rust reopens it). -->
		{#if onboardingState.current?.status === "later" && copyState.catalog}
			<Button variant="secondary" size="sm" onclick={onboardingState.reopen} disabled={onboardingState.busy}>
				{copyState.catalog.onboarding.common.reopen}
			</Button>
		{/if}
	</div>

	<!-- Center: PULSE FEED pill -->
	<div class="flex flex-1 items-center justify-center">
		<Badge variant="neutral" size="lg" class="gap-2 px-4 py-1.5">
			<span class="text-xs font-bold uppercase tracking-widest" style="color: var(--color-teal-400, oklch(0.75 0.18 180));">
				PULSE FEED
			</span>
		</Badge>
	</div>

	<!-- Right: actions + clyffy + avatar -->
	<div class={hstack({ gap: "2", align: "center" })}>
		<Button variant="ghost" size="sm" class="h-9 w-9 rounded-full" title="Search" aria-label="Search" onclick={toggleSearch}>
			<Search size={16} />
		</Button>

		<Button variant="ghost" size="sm" class="h-9 w-9 rounded-full" title="Notifications" aria-label="Notifications">
			<Bell size={16} />
		</Button>

		<Button variant="ghost" size="sm" class="h-9 w-9 rounded-full" title="Open Chat" aria-label="Open Chat" onclick={openChat}>
			<MessageCircle size={16} />
		</Button>

		<Button
			variant="ghost"
			size="sm"
			class="h-9 w-9 rounded-full"
			title={text?.chat_overlay}
			aria-label={text?.chat_overlay}
			aria-pressed={globalState.chat_overlay_open}
			onclick={() => globalState.toggleChatOverlay()}
		>
			<Sparkles size={16} />
		</Button>

		{#if tools}
			{@const ToolsIcon = tools.nav.icon}
			<Button variant="ghost" size="sm" class="h-9 w-9 rounded-full" title={toolsLabel} aria-label={toolsLabel} onclick={openTools}>
				{#if ToolsIcon}
					<ToolsIcon size={16} />
				{/if}
			</Button>
		{/if}

		{#if searchOpen}
			<div class="absolute right-4 top-full z-50 mt-2 p-3" data-slot="search" data-focus-container>
				<Input
					size="sm"
					class="w-full"
					type="text"
					value={searchQuery}
					onValueChange={(next) => { searchQuery = next; }}
					placeholder={text?.search_placeholder}
				/>
				<Text size="sm" color="muted" class="mt-2 block">{text?.search_unavailable}</Text>
			</div>
		{/if}

		<!-- Clyffy presence orb -->
		<ClyffyStatusOrb size="sm" />

		{#if profile}
			<a href={hrefOf(profile)} class="rounded-full" title={profileLabel} aria-label={profileLabel}>
				<Avatar size={32} alt="User avatar" fallback="DP" />
			</a>
		{:else}
			<Avatar size={32} alt="User avatar" fallback="DP" />
		{/if}
	</div>
</div>
