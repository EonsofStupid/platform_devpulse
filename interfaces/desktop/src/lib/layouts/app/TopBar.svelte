<!--
  @file src/lib/layouts/app/TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib

  Top navigation bar. Parasite logo left, ColdLight icon buttons + avatar right.
  All interactive elements use ColdLight components — zero raw HTML buttons.

  @since 1.0.0
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Bell, MessageCircle, Search } from "lucide-svelte";
import { Avatar } from "$lib/design/components/avatar/index.js";
import { Box } from "$lib/design/components/box/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { HStack } from "$lib/design/components/hstack/index.js";
import { Input } from "$lib/design/components/input/index.js";
import { Parasite } from "$lib/design/plugins/parasite";

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

	<HStack gap="2" align="center">
		<Button
			intent="ghost"
			size="sm"
			radius="full"
			class="h-8 w-8"
			title="Search"
			aria-label="Search"
			onclick={toggleSearch}
		>
			<Search size={16} />
		</Button>

		<Button
			intent="ghost"
			size="sm"
			radius="full"
			class="h-8 w-8"
			title="Notifications"
			aria-label="Notifications"
		>
			<Bell size={16} />
		</Button>

		<Button
			intent="ghost"
			size="sm"
			glow="teal"
			radius="full"
			class="h-8 w-8"
			title="Open Chat"
			aria-label="Open Chat"
			onclick={openChat}
		>
			<MessageCircle size={16} />
		</Button>

		{#if searchOpen}
			<Box
				preset="panel-glass"
				radius="lg"
				class="absolute right-4 top-12 z-[var(--z-dropdown)] p-2"
			>
				<Input
					size="sm"
					preset="input-default"
					class="w-64"
					type="text"
					value={searchQuery}
					oninput={(e) => { searchQuery = e.currentTarget.value; }}
					placeholder="Search..."
				/>
			</Box>
		{/if}

		<Avatar size="sm" alt="User avatar" class="h-8 w-8">
			DP
		</Avatar>
	</HStack>
</div>
