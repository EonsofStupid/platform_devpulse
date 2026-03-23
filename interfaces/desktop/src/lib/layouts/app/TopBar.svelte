<!--
  @file src/lib/layouts/app/TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib

  Top navigation bar. Parasite logo left, ColdLight icon buttons + avatar right.
  All interactive elements use ColdLight components.

  @since 1.0.0
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Bell, MessageCircle, Search } from "lucide-svelte";
import { Avatar } from "$lib/design/components/avatar/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { TextField as Input } from "$lib/design/components/text-field/index.js";
import { Parasite } from "$lib/design/plugins/parasite";
import { cn } from "$lib/design/utils/cn.js";

let searchOpen = $state(false);
let searchQuery = $state("");

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

<div class="flex w-full items-center justify-between" role="toolbar" tabindex="0" onkeydown={onKey}>
	<div class="flex items-center" style:font-family="var(--font-display)">
		<Parasite size="sm" />
	</div>

	<div class="flex-1"></div>

	<div class={hstack({ gap: "2", align: "center" })}>
		<Button
			intent="ghost"
			size="sm"
			class="h-8 w-8 rounded-full"
			title="Search"
			aria-label="Search"
			onclick={toggleSearch}
		>
			<Search size={16} />
		</Button>

		<Button
			intent="ghost"
			size="sm"
			class="h-8 w-8 rounded-full"
			title="Notifications"
			aria-label="Notifications"
		>
			<Bell size={16} />
		</Button>

		<Button
			intent="ghost"
			size="sm"
			class="h-8 w-8 rounded-full"
			title="Open Chat"
			aria-label="Open Chat"
			onclick={openChat}
		>
			<MessageCircle size={16} />
		</Button>

		{#if searchOpen}
			<div
				class={cn(box({}), "v-s0 v-r3 absolute right-4 top-12 z-[var(--z-dropdown)] p-2")}
				data-kind="box"
				data-slot="root"
			>
				<Input
					size="sm"
					class="w-64"
					type="text"
					value={searchQuery}
					oninput={(e) => { searchQuery = e.currentTarget.value; }}
					placeholder="Search..."
				/>
			</div>
		{/if}

		<Avatar size={32} alt="User avatar" fallback="DP" />
	</div>
</div>
