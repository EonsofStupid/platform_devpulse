<!--
  @file src/lib/layouts/app/TopBar.svelte
  @module @devpulse/layouts/app/TopBar

  Top navigation bar. Reference: refernece-dashboard3.png / dashboard4.png
  Layout: [hamburger + brand] — [center: PULSE FEED pill] — [right: search + notifications + chat + clyffy + avatar]
  Height: 4.125rem (set by Frame.svelte topbar slot)

  @defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { Bell, Menu, MessageCircle, Search } from "@lucide/svelte";
import { invoke } from "@tauri-apps/api/core";
import { Avatar } from "$lib/design/components/avatar/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { TextField as Input } from "$lib/design/components/text-field/index.js";
import { Parasite } from "$lib/design/plugins/parasite";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { wizardState } from "$lib/domains/app/models/feature/setup-wizard/index.js";
import { ProjectSwitcher } from "$lib/domains/app/projects/index.js";
import { ClyffyStatusOrb, clyffyConnection } from "$lib/domains/clyffy/index.js";
import { globalState } from "$lib/sys/runes/global.svelte";

let searchOpen = $state(false);
let searchQuery = $state("");

// Wire connection (Tier-1/Tier-2) — drives the platform-chrome no-AI
// indicator next to the orb. Ref-counted; teardown returned to $effect.
$effect(() => clyffyConnection.subscribe());

function toggleSearch(): void {
	searchOpen = !searchOpen;
	if (!searchOpen) searchQuery = "";
}

function openChat(): void {
	invoke("open_chat_window");
}

function onKey(e: KeyboardEvent): void {
	if (e.key === "Escape" && searchOpen) toggleSearch();
}
</script>

<div class="flex w-full items-center justify-between gap-4" role="toolbar" tabindex="0" onkeydown={onKey} data-tauri-drag-region>
	<!-- Left: hamburger + brand -->
	<div class={hstack({ gap: "3", align: "center" })}>
		<Button
			preset="ghost"
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
		<!-- Active-project pill — next to brand so "what am I working on"
		     is the first thing the user sees after the app identity. -->
		<ProjectSwitcher />
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
		<Button preset="ghost" size="sm" class="h-9 w-9 rounded-full" title="Search" aria-label="Search" onclick={toggleSearch}>
			<Search size={16} />
		</Button>

		<Button preset="ghost" size="sm" class="h-9 w-9 rounded-full" title="Notifications" aria-label="Notifications">
			<Bell size={16} />
		</Button>

		<Button preset="ghost" size="sm" class="h-9 w-9 rounded-full" title="Open Chat" aria-label="Open Chat" onclick={openChat}>
			<MessageCircle size={16} />
		</Button>

		{#if searchOpen}
			<div class={cn("absolute right-4 top-16 z-50 rounded-lg border p-2")} style="background: var(--background-color); border-color: var(--border-color);">
				<Input
					size="sm"
					class="w-64"
					type="text"
					value={searchQuery}
					oninput={(e) => { searchQuery = (e.currentTarget as HTMLInputElement).value; }}
					placeholder="Search..."
				/>
			</div>
		{/if}

		<!-- No-AI indicator (platform-chrome surface of the three: statusbar /
		     topbar / chat). Subtle absence cue: renders ONLY while standalone —
		     the AI layer is a connection, so this is a mode, never an error.
		     Clicking it is the RE-ENTRY point: opens the wizard on the
		     endpoint (connect) step. The mood orb next door is a separate
		     concern (clyffyStatus, not the wire) and stays connection-blind
		     by design. -->
		{#if clyffyConnection.tier === "tier1"}
			<Button
				preset="ghost"
				size="sm"
				aria-label="Connect the AI layer"
				onclick={() => {
					wizardState.goTo("endpoint");
					wizardState.open();
				}}
			>
				<Badge variant="neutral" size="sm" class="gap-1.5">
					<span class="status-dot h-1.5 w-1.5 rounded-full" data-subsystem-state="pending" style="background: currentColor; opacity: 0.55;"></span>
					<span class="text-xs">AI</span>
				</Badge>
			</Button>
		{/if}

		<!-- Clyffy presence orb -->
		<ClyffyStatusOrb size="sm" />

		<Avatar size={32} alt="User avatar" fallback="DP" />
	</div>
</div>
