<script lang="ts">
	/**
	 * MessageList - Displays chat messages
	 */
	import { chatStore } from '$lib/stores/chat.svelte';
	import type { Message } from '$lib/api';

	interface Props {
		messages?: Message[];
		loading?: boolean;
	}

	let { messages, loading = false }: Props = $props();

	// Use passed messages or fallback to store
	const displayMessages = $derived(messages ?? chatStore.messages);
</script>

<div class="message-list">
	{#each displayMessages as message (message.id)}
		<div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
			<div class="message-avatar">
				{message.role === 'user' ? '👤' : '🤖'}
			</div>
			<div class="message-content">
				<div class="message-text">{message.content}</div>
				{#if message.timestamp}
					<time class="message-time">
						{new Date(message.timestamp).toLocaleTimeString()}
					</time>
				{/if}
			</div>
		</div>
	{/each}

	{#if loading}
		<div class="loading-indicator">
			<span class="loading-dot"></span>
			<span class="loading-dot"></span>
			<span class="loading-dot"></span>
		</div>
	{/if}

	{#if displayMessages.length === 0 && !loading}
		<div class="empty-state">
			<p>No messages yet. Start a conversation!</p>
		</div>
	{/if}
</div>

<style>
	.message-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		overflow-y: auto;
	}

	.message {
		display: flex;
		gap: 0.75rem;
		max-width: 80%;
	}

	.message.user {
		margin-left: auto;
		flex-direction: row-reverse;
	}

	.message-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.message-content {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
	}

	.message.user .message-content {
		background: rgba(139, 92, 246, 0.2);
	}

	.message-text {
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.message-time {
		font-size: 0.625rem;
		color: var(--color-text-secondary);
		margin-top: 0.25rem;
		display: block;
	}

	.loading-indicator {
		display: flex;
		gap: 0.25rem;
		padding: 1rem;
		justify-content: center;
	}

	.loading-dot {
		width: 8px;
		height: 8px;
		background: var(--color-text-secondary);
		border-radius: 50%;
		animation: bounce 1.4s ease-in-out infinite;
	}

	.loading-dot:nth-child(1) { animation-delay: 0s; }
	.loading-dot:nth-child(2) { animation-delay: 0.2s; }
	.loading-dot:nth-child(3) { animation-delay: 0.4s; }

	@keyframes bounce {
		0%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-8px); }
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-secondary);
	}
</style>
