<!--
  @file src/lib/layouts/app/TopBar.svelte
  @module @devpulse/layouts/app/TopBar
  @layer lib

  @description
  Top navigation bar. Parasite logo left, icon buttons + avatar right.

  @consumers
  - Frame.svelte: Main app layout

  @since 1.0.0
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Bell, MessageCircle, Search } from "lucide-svelte";
import { Parasite } from "$lib/design/plugins/parasite";

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
		<button
			data-kind="button"
			data-slot="root"
			class="flex h-8 w-8 items-center justify-center"
			title="Search"
			aria-label="Search"
			onclick={toggleSearch}
		>
			<span data-kind="button" data-slot="icon"><Search size={16} /></span>
		</button>

		<button
			data-kind="button"
			data-slot="root"
			class="flex h-8 w-8 items-center justify-center"
			title="Notifications"
			aria-label="Notifications"
		>
			<span data-kind="button" data-slot="icon"><Bell size={16} /></span>
		</button>

		<button
			data-kind="button"
			data-slot="root"
			class="flex h-8 w-8 items-center justify-center"
			title="Open Chat"
			aria-label="Open Chat"
			onclick={openChat}
		>
			<span data-kind="button" data-slot="icon"><MessageCircle size={16} /></span>
		</button>

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

		<div
			data-kind="avatar"
			data-slot="root"
			class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--glass-deep)] border border-[var(--border-subtle)] overflow-hidden"
		>
			<span
				data-kind="avatar"
				data-slot="fallback"
				class="flex h-full w-full items-center justify-center text-xs text-[var(--text-secondary)]"
			>
				DP
			</span>
		</div>
	</div>
</div>
