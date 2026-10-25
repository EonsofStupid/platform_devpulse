<script lang="ts">
	/**
	 * ChatInput - Input field for chat messages with voice support
	 *
	 * Voice modes:
	 * - Click: Toggle recording on/off
	 * - Hold: Press and hold to record, release to transcribe
	 */
	import { voiceStore } from '$lib/stores';

	interface Props {
		onSend: (content: string) => void;
		disabled?: boolean;
		placeholder?: string;
		showVoice?: boolean;
		voiceMode?: 'click' | 'hold';
	}

	let {
		onSend,
		disabled = false,
		placeholder = 'Type a message...',
		showVoice = true,
		voiceMode = 'hold'
	}: Props = $props();

	let inputValue = $state('');
	let holdTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let isHolding = $state(false);

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

	// Voice recording callback
	function onTranscription(text: string | null) {
		if (text) {
			inputValue = inputValue ? `${inputValue} ${text}` : text;
		}
	}

	// Click mode: toggle recording
	function handleVoiceClick() {
		if (voiceMode === 'click') {
			voiceStore.toggleRecording(onTranscription);
		}
	}

	// Hold mode: start recording on press
	function handleVoiceDown(e: MouseEvent | TouchEvent) {
		if (voiceMode !== 'hold' || disabled) return;

		e.preventDefault();
		isHolding = true;

		// Small delay to distinguish from click
		holdTimer = setTimeout(() => {
			if (isHolding && !isRecording) {
				// Pass callback to startRecording - it will be called when stopRecording is called
				voiceStore.startRecording(onTranscription);
			}
		}, 150);
	}

	// Hold mode: stop recording on release
	function handleVoiceUp() {
		if (voiceMode !== 'hold') return;

		isHolding = false;

		if (holdTimer) {
			clearTimeout(holdTimer);
			holdTimer = null;
		}

		if (isRecording) {
			voiceStore.stopRecording();
		}
	}

	// Cancel on mouse/touch leave
	function handleVoiceLeave() {
		if (voiceMode === 'hold' && isRecording) {
			handleVoiceUp();
		}
	}
</script>

<form class="chat-input" onsubmit={handleSubmit}>
	<textarea
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
			class:holding={isHolding}
			onclick={handleVoiceClick}
			onmousedown={handleVoiceDown}
			onmouseup={handleVoiceUp}
			onmouseleave={handleVoiceLeave}
			ontouchstart={handleVoiceDown}
			ontouchend={handleVoiceUp}
			disabled={disabled}
			title={voiceMode === 'hold' ? 'Hold to record' : (isRecording ? 'Stop recording' : 'Start voice input')}
		>
			<span class="voice-icon">{isRecording ? '⏹️' : '🎙️'}</span>
			{#if isRecording}
				<span class="recording-indicator"></span>
			{/if}
		</button>
	{/if}
	<button type="submit" disabled={disabled || !inputValue.trim()}>
		<span>📤</span>
	</button>
</form>

<style>
	.chat-input {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	textarea {
		flex: 1;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 0.75rem;
		color: var(--color-text-primary);
		font-size: 0.875rem;
		resize: none;
		outline: none;
		min-height: 44px;
		max-height: 120px;
	}

	textarea::placeholder {
		color: var(--color-text-secondary);
	}

	textarea:focus {
		border-color: rgba(139, 92, 246, 0.5);
	}

	button {
		width: 44px;
		height: 44px;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border: none;
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		transform: scale(1.05);
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.voice-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		position: relative;
		overflow: hidden;
	}

	.voice-btn:hover:not(:disabled) {
		background: rgba(139, 92, 246, 0.3);
		border-color: rgba(139, 92, 246, 0.5);
	}

	.voice-btn.holding {
		background: rgba(139, 92, 246, 0.4);
		border-color: rgba(139, 92, 246, 0.6);
		transform: scale(0.95);
	}

	.voice-btn.recording {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.5);
	}

	.voice-icon {
		position: relative;
		z-index: 1;
	}

	.recording-indicator {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: rgba(239, 68, 68, 0.3);
		animation: pulse-ring 1.25s ease-out infinite;
		pointer-events: none;
	}

	@keyframes pulse-ring {
		0% {
			transform: translate(-50%, -50%) scale(0.5);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0;
		}
	}
</style>
