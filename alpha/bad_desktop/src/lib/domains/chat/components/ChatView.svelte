<script lang="ts">
	/**
	 * ChatView - Core chat interface using chatStore (Svelte 5 runes)
	 * 
	 * Used by:
	 * - ChatOverlay (slide-out panel)
	 * - chat-window route (popup Tauri window)
	 * 
	 * Does NOT use features/chat/stores - those are legacy.
	 * SSOT is lib/stores/chat.svelte.ts
	 */
	import { chatStore } from '../stores';

	let inputValue = $state('');
	let messagesContainer: HTMLElement;

	// Scroll to bottom when messages change
	$effect(() => {
		if (chatStore.messages.length && messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});

	async function handleSend() {
		const content = inputValue.trim();
		if (!content || chatStore.loading) return;

		inputValue = '';
		await chatStore.send(content);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}
</script>

<div class="chat-view">
	<!-- Messages -->
	<div class="messages" bind:this={messagesContainer}>
		{#if chatStore.messages.length === 0}
			<div class="empty-state">
				<div class="empty-icon">💬</div>
				<p>Start a conversation with Maestro</p>
				<p class="hint">Ask about your code, get help with tasks, or just chat</p>
			</div>
		{:else}
			{#each chatStore.messages as message (message.id)}
				<div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
					<div class="message-content">
						{message.content}
					</div>
					{#if message.is_stub}
						<div class="stub-badge">stub response</div>
					{/if}
				</div>
			{/each}
		{/if}

		{#if chatStore.loading}
			<div class="message assistant loading">
				<div class="typing-indicator">
					<span></span><span></span><span></span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Error -->
	{#if chatStore.error}
		<div class="error-bar">
			{chatStore.error}
			<button onclick={() => chatStore.error = null}>×</button>
		</div>
	{/if}

	<!-- Input -->
	<div class="input-area">
		<textarea
			bind:value={inputValue}
			onkeydown={handleKeydown}
			placeholder="Message Maestro..."
			disabled={chatStore.loading}
			rows="1"
		></textarea>
		<button 
			class="send-btn" 
			onclick={handleSend}
			disabled={!inputValue.trim() || chatStore.loading}
		>
			{#if chatStore.loading}
				<span class="spinner"></span>
			{:else}
				→
			{/if}
		</button>
	</div>
</div>

<style>
	.chat-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-bg-primary, #0a0a0a);
	}

	/* Messages area */
	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary, #888);
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state .hint {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	/* Messages */
	.message {
		max-width: 80%;
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		animation: fadeIn 0.2s ease-out;
	}

	.message.user {
		align-self: flex-end;
		background: var(--color-accent, #3b82f6);
		color: white;
		border-bottom-right-radius: 0.25rem;
	}

	.message.assistant {
		align-self: flex-start;
		background: var(--color-bg-secondary, #1a1a1a);
		border: 1px solid var(--color-border, #333);
		border-bottom-left-radius: 0.25rem;
	}

	.message-content {
		white-space: pre-wrap;
		word-break: break-word;
	}

	.stub-badge {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-warning, #f59e0b);
		margin-top: 0.5rem;
		opacity: 0.8;
	}

	/* Typing indicator */
	.typing-indicator {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
	}

	.typing-indicator span {
		width: 0.5rem;
		height: 0.5rem;
		background: var(--color-text-secondary, #888);
		border-radius: 50%;
		animation: bounce 1.4s infinite ease-in-out;
	}

	.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
	.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

	@keyframes bounce {
		0%, 80%, 100% { transform: scale(0); }
		40% { transform: scale(1); }
	}

	/* Error bar */
	.error-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: var(--color-error-bg, rgba(239, 68, 68, 0.1));
		border-top: 1px solid var(--color-error, #ef4444);
		color: var(--color-error, #ef4444);
		font-size: 0.875rem;
	}

	.error-bar button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1.25rem;
		line-height: 1;
	}

	/* Input area */
	.input-area {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		border-top: 1px solid var(--color-border, #333);
		background: var(--color-bg-secondary, #1a1a1a);
	}

	.input-area textarea {
		flex: 1;
		resize: none;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border, #333);
		border-radius: 1.5rem;
		background: var(--color-bg-primary, #0a0a0a);
		color: var(--color-text-primary, #fff);
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s;
	}

	.input-area textarea:focus {
		border-color: var(--color-accent, #3b82f6);
	}

	.input-area textarea:disabled {
		opacity: 0.5;
	}

	.send-btn {
		width: 2.5rem;
		height: 2.5rem;
		border: none;
		border-radius: 50%;
		background: var(--color-accent, #3b82f6);
		color: white;
		font-size: 1.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: opacity 0.2s, transform 0.1s;
	}

	.send-btn:hover:not(:disabled) {
		transform: scale(1.05);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid transparent;
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(0.5rem); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Scrollbar */
	.messages::-webkit-scrollbar {
		width: 6px;
	}

	.messages::-webkit-scrollbar-track {
		background: transparent;
	}

	.messages::-webkit-scrollbar-thumb {
		background: var(--color-border, #333);
		border-radius: 3px;
	}

	.messages::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary, #888);
	}
</style>
