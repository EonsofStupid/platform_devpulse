<script lang="ts">
	/**
	 * MessageList - Displays chat messages
	 * Uses global design tokens from styles/tokens/
	 */
	import { chatStore } from '../stores';
	import type { Message } from '../types';

	interface Props {
		messages?: Message[];
		loading?: boolean;
	}

	let { messages, loading = false }: Props = $props();

	// Use passed messages or fallback to store
	const displayMessages = $derived(messages ?? chatStore.messages);
</script>

<div class="messages">
	{#each displayMessages as message (message.id)}
		<div
			class="message"
			class:message-user={message.role === 'user'}
			class:message-assistant={message.role === 'assistant'}
		>
			<div class="message-avatar">
				{message.role === 'user' ? '👤' : '🤖'}
			</div>
			<div class="message-bubble glass">
				{message.content}
				{#if message.timestamp}
					<time class="message-time">
						{new Date(message.timestamp).toLocaleTimeString()}
					</time>
				{/if}
			</div>
		</div>
	{/each}

	{#if loading}
		<div class="loading">
			<span class="loading-dot"></span>
			<span class="loading-dot"></span>
			<span class="loading-dot"></span>
		</div>
	{/if}

	{#if displayMessages.length === 0 && !loading}
		<div class="empty glass">
			<div class="empty-icon">💬</div>
			<p>No messages yet. Start a conversation!</p>
		</div>
	{/if}
</div>

<style>
	.messages {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3);
		padding: var(--dp-space-4);
		min-height: 100%;
	}

	.message {
		display: flex;
		gap: var(--dp-space-3);
		max-width: 85%;
	}

	.message-user {
		align-self: flex-end;
		flex-direction: row-reverse;
	}

	.message-assistant {
		align-self: flex-start;
	}

	.message-avatar {
		width: 32px;
		height: 32px;
		border-radius: var(--dp-radius-full);
		background: var(--dp-glass-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--dp-text-sm);
		flex-shrink: 0;
	}

	.message-bubble {
		padding: var(--dp-space-3) var(--dp-space-4);
		border-radius: var(--dp-radius-lg);
		font-size: var(--dp-text-sm);
		line-height: 1.5;
		color: var(--dp-text-primary);
	}

	.message-user .message-bubble {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-color: var(--dp-glass-border-bright);
	}

	.message-time {
		display: block;
		margin-top: var(--dp-space-2);
		font-size: 0.625rem;
		color: var(--dp-text-dim);
	}

	.loading {
		display: flex;
		align-items: center;
		gap: var(--dp-space-1);
		padding: var(--dp-space-3);
	}

	.loading-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--dp-radius-full);
		background: var(--dp-accent-primary);
		animation: bounce 1.4s ease-in-out infinite;
	}

	.loading-dot:nth-child(1) { animation-delay: 0s; }
	.loading-dot:nth-child(2) { animation-delay: 0.2s; }
	.loading-dot:nth-child(3) { animation-delay: 0.4s; }

	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0.6);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--dp-space-8);
		text-align: center;
		color: var(--dp-text-muted);
		margin: auto;
	}

	.empty-icon {
		font-size: 2.5rem;
		margin-bottom: var(--dp-space-3);
		opacity: 0.5;
	}

	.empty p {
		margin: 0;
		font-size: var(--dp-text-sm);
	}
</style>
