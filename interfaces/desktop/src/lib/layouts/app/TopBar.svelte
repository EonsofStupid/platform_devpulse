<!--
  @file src/lib/layouts/app/TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib

  @description
  Top navigation bar with ColdLight primitives.
  Parasite logo left, icon buttons + avatar right.

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Bell, MessageCircle, Search } from "lucide-svelte";
import { Parasite } from "$lib/design/plugins/parasite";
import { Avatar, AvatarFallback } from "$lib/design/primitives/avatar";
import { Button, ButtonIcon } from "$lib/design/primitives/button";

let searchOpen = $state(false);
let searchQuery = $state("");
let inputEl = $state<HTMLInputElement | null>(null);

function toggleSearch(): void {
	searchOpen = !searchOpen;
	if (!searchOpen) searchQuery = "";
}

$effect(() => {
	if (searchOpen && inputEl) {
		inputEl.focus();
	}
});

function openChat(): void {
	invoke("open_chat_window");
}

function onKey(e: KeyboardEvent): void {
	if (e.key === "Escape" && searchOpen) toggleSearch();
}
</script>

<div class="flex w-full items-center justify-between" onkeydown={onKey}>
	<div class="flex items-center" style:font-family="var(--font-display)">
		<Parasite size="sm" />
	</div>

	<div class="flex-1"></div>

	<div class="flex items-center gap-2">
		<Button
			class="flex h-8 w-8 items-center justify-center"
			title="Search"
			aria-label="Search"
			onclick={toggleSearch}
		>
			<ButtonIcon><Search size={16} /></ButtonIcon>
		</Button>

		<Button
			class="flex h-8 w-8 items-center justify-center"
			title="Notifications"
			aria-label="Notifications"
		>
			<ButtonIcon><Bell size={16} /></ButtonIcon>
		</Button>

		<Button
			class="flex h-8 w-8 items-center justify-center"
			title="Open Chat"
			aria-label="Open Chat"
			onclick={openChat}
		>
			<ButtonIcon><MessageCircle size={16} /></ButtonIcon>
		</Button>

		{#if searchOpen}
			<div
				class="absolute right-4 top-12 z-[var(--z-dropdown)] rounded-lg p-2 shadow-z3 glass-void"
				role="dialog"
				aria-label="Search"
			>
				<input
					bind:this={inputEl}
					class="w-64 rounded-md bg-[var(--matte-dark)] border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--color-teal-500)]"
					type="text"
					bind:value={searchQuery}
					placeholder="Search..."
				/>
			</div>
		{/if}

		<Avatar class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--glass-deep)] border border-[var(--border-subtle)] overflow-hidden">
			<AvatarFallback class="flex h-full w-full items-center justify-center text-xs text-[var(--text-secondary)]">
				DP
			</AvatarFallback>
		</Avatar>
	</div>
</div>
