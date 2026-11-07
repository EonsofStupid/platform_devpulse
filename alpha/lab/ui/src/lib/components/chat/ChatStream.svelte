<script lang="ts">
	import { chatStore } from '$lib/stores/chat.svelte';
	import MessageBubble from './MessageBubble.svelte';

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			chatStore.sendMessage();
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- Messages -->
	<div class="flex-1 overflow-auto custom-scrollbar p-4 space-y-3">
		{#if chatStore.messages.length === 0}
			<div class="text-center text-gray-500 py-8">
				<p>No messages yet</p>
				<p class="text-xs mt-2">Start a conversation below</p>
			</div>
		{:else}
			{#each chatStore.messages as message (message.id)}
				<MessageBubble {message} />
			{/each}
		{/if}
	</div>

	<!-- Input -->
	<div class="p-4 border-t border-white/10">
		<div class="flex gap-2">
			<textarea
				bind:value={chatStore.inputText}
				onkeydown={handleKeydown}
				placeholder="Type a message..."
				rows="2"
				class="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue resize-none"
			></textarea>
			<button
				onclick={() => chatStore.sendMessage()}
				disabled={chatStore.sending || !chatStore.inputText.trim()}
				class="px-4 bg-accent-blue/20 text-accent-blue border border-accent-blue rounded-lg hover:bg-accent-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if chatStore.sending}
					...
				{:else}
					Send
				{/if}
			</button>
		</div>
	</div>
</div>
