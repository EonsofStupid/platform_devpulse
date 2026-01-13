<script lang="ts">
	/**
	 * ChatInput - Input field for chat messages with voice support
	 * Uses global design tokens and input recipes
	 */
	import { voiceStore } from '$lib/stores';

	interface Props {
		onSend: (content: string) => void;
		disabled?: boolean;
		placeholder?: string;
		showVoice?: boolean;
	}

	let { onSend, disabled = false, placeholder = 'Type a message...', showVoice = true }: Props = $props();

	let inputValue = $state('');

	// Voice state from store
	let isRecording = $derived(voiceStore.isRecording);
	let sttReady = $derived(voiceStore.status?.stt_ready ?? false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (inputValue.trim() && !disabled) {
			onSend(inputValue.trim());
			inputValue = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}

	function handleVoiceToggle() {
		voiceStore.toggleRecording((text) => {
			// Append transcribed text to input
			if (text) {
				inputValue = inputValue ? `${inputValue} ${text}` : text;
			}
		});
	}
</script>

<form class="input-form" onsubmit={handleSubmit}>
	<textarea
		class="input-field input"
		bind:value={inputValue}
		{placeholder}
		{disabled}
		onkeydown={handleKeydown}
		rows="1"
	></textarea>
	{#if showVoice && sttReady}
		<button
			type="button"
			class="voice-btn"
			class:recording={isRecording}
			onclick={handleVoiceToggle}
			disabled={disabled}
			title={isRecording ? 'Stop recording' : 'Start voice input'}
		>
			<span>{isRecording ? '⏹️' : '🎙️'}</span>
		</button>
	{/if}
	<button
		type="submit"
		class="send-btn"
		class:loading={disabled}
		disabled={disabled || !inputValue.trim()}
	>
		{#if disabled}
			<span class="spinner"></span>
		{:else}
			<span>📤</span>
		{/if}
	</button>
</form>

<style>
	.input-form {
		display: flex;
		align-items: flex-end;
		gap: var(--dp-space-2);
	}

	.input-field {
		flex: 1;
		min-height: 40px;
		max-height: 120px;
		resize: none;
		font-family: inherit;
	}

	.voice-btn,
	.send-btn {
		width: 40px;
		height: 40px;
		padding: 0;
		border: 1px solid var(--dp-glass-border);
		border-radius: var(--dp-radius);
		background: var(--dp-glass-bg);
		color: var(--dp-text-secondary);
		font-size: var(--dp-text-base);
		cursor: pointer;
		transition: all var(--dp-transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.voice-btn:hover,
	.send-btn:hover:not(:disabled) {
		background: var(--dp-glass-border);
		border-color: var(--dp-glass-border-bright);
		color: var(--dp-text-primary);
	}

	.voice-btn.recording {
		background: oklch(from var(--dp-error) l c h / 0.3);
		border-color: var(--dp-error);
		animation: pulse 1s ease-in-out infinite;
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-btn.loading {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid var(--dp-glass-border);
		border-top-color: var(--dp-accent-primary);
		border-radius: var(--dp-radius-full);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
</style>
