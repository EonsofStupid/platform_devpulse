<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import ChatStream from '$lib/components/chat/ChatStream.svelte';
	import InferenceMetrics from '$lib/components/chat/InferenceMetrics.svelte';
	import { chatStore } from '$lib/stores/chat.svelte';

	onMount(() => {
		chatStore.loadSessions();
	});

	async function newSession() {
		await chatStore.createSession();
	}
</script>

<div class="flex flex-col h-full">
	<Header title="Chat" />

	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar: Sessions -->
		<div class="w-64 border-r border-white/10 p-4 flex flex-col gap-4">
			<button
				onclick={newSession}
				class="w-full px-4 py-2 bg-accent-blue/20 text-accent-blue border border-accent-blue rounded-lg hover:bg-accent-blue/30 transition-all"
			>
				New Session
			</button>

			<div class="flex-1 overflow-auto custom-scrollbar space-y-1">
				{#each chatStore.sessions as session (session.id)}
					<button
						onclick={() => chatStore.selectSession(session.id)}
						class="w-full p-3 rounded-lg text-left transition-all {chatStore.activeSessionId ===
						session.id
							? 'bg-white/10 border border-white/20'
							: 'hover:bg-white/5'}"
					>
						<div class="text-sm text-white truncate">Session {session.id.slice(0, 8)}</div>
						<div class="text-xs text-gray-500">
							{session.message_count} messages
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Main chat area -->
		<div class="flex-1 flex flex-col">
			{#if chatStore.activeSession}
				<ChatStream />
			{:else}
				<div class="flex-1 flex items-center justify-center text-gray-500">
					<div class="text-center">
						<p>No session selected</p>
						<p class="text-sm mt-2">Create a new session or select one from the sidebar</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right sidebar: Metrics -->
		<div class="w-72 border-l border-white/10 p-4">
			<InferenceMetrics />
		</div>
	</div>
</div>
