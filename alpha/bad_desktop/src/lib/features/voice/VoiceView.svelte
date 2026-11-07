<script lang="ts">
	/**
	 * VoiceView - Voice interaction with Maestro
	 *
	 * Features:
	 * - Shows VoiceSetup wizard if voice is not configured
	 * - Push-to-talk and continuous listening when configured
	 * - Voice feedback (TTS playback)
	 */
	import { onMount } from 'svelte';
	import { voiceStore } from '$lib/stores/voice.svelte';
	import { getVoiceStatus, needsVoiceSetup, type VoiceStatus } from '$lib/api/voice';
	import VoiceSetup from './VoiceSetup.svelte';

	// State
	let status = $state<VoiceStatus | null>(null);
	let loading = $state(true);
	let showSetup = $state(false);

	// Derived from store
	const isRecording = $derived(voiceStore.isRecording);
	const isSpeaking = $derived(voiceStore.isSpeaking);
	const storeError = $derived(voiceStore.error);

	// Local state for transcript display
	let transcript = $state('');

	onMount(async () => {
		await loadStatus();
	});

	async function loadStatus() {
		loading = true;
		try {
			status = await getVoiceStatus();
			// Show setup if not configured
			showSetup = needsVoiceSetup(status);
			// Initialize voice store with status
			voiceStore.status = status;
		} catch (e) {
			console.error('Failed to load voice status:', e);
		} finally {
			loading = false;
		}
	}

	function toggleRecording() {
		if (!status?.stt_ready) {
			voiceStore.error = 'Speech-to-text not configured. Click Settings to set up.';
			return;
		}

		// Use the store's toggle method with transcript callback
		voiceStore.toggleRecording((text) => {
			transcript = text;
		});
	}

	function handleSetupComplete() {
		// Reload status after setup
		loadStatus();
	}

	function openSettings() {
		showSetup = true;
	}

	function closeSettings() {
		showSetup = false;
	}
</script>

<div class="voice">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading voice status...</p>
		</div>
	{:else if showSetup && status}
		<VoiceSetup {status} onComplete={handleSetupComplete} />
	{:else}
		<header class="voice-header">
			<h1>Voice</h1>
			<p class="subtitle">Talk with Maestro</p>
		</header>

		<div class="voice-visualizer glass">
			<div class="voice-orb" class:listening={isRecording} class:speaking={isSpeaking}>
				<div class="orb-inner">
					{#if isRecording}
						<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
						</svg>
					{:else if isSpeaking}
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
						</svg>
					{:else}
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
							<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
							<line x1="12" y1="19" x2="12" y2="23" />
							<line x1="8" y1="23" x2="16" y2="23" />
						</svg>
					{/if}
				</div>
				<div class="orb-ring ring-1"></div>
				<div class="orb-ring ring-2"></div>
				<div class="orb-ring ring-3"></div>
			</div>

			<div class="voice-status">
				{#if isRecording}
					<span class="status-text recording">Listening...</span>
				{:else if isSpeaking}
					<span class="status-text speaking">Maestro is speaking...</span>
				{:else if status?.stt_ready}
					<span class="status-text ready">Ready</span>
				{:else}
					<span class="status-text not-ready">Voice not configured</span>
				{/if}
			</div>
		</div>

		{#if storeError}
			<div class="error-banner glass">
				<span>{storeError}</span>
				<button onclick={() => voiceStore.clearError()}>Dismiss</button>
			</div>
		{/if}

		<div class="voice-controls">
			<button
				class="voice-btn glass"
				class:active={isRecording}
				class:disabled={!status?.stt_ready}
				onclick={toggleRecording}
			>
				{isRecording ? 'Stop' : 'Push to Talk'}
				<kbd>Space</kbd>
			</button>

			<button class="voice-btn glass secondary" onclick={openSettings}>
				Settings
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
			</button>
		</div>

		{#if transcript}
			<div class="transcript glass">
				<h3>Transcript</h3>
				<p>{transcript}</p>
			</div>
		{/if}

		<div class="voice-status-bar glass">
			<div class="status-item" class:ready={status?.stt_ready} class:missing={!status?.stt_ready}>
				<span class="icon">{status?.stt_ready ? '✓' : '○'}</span>
				<span>STT</span>
			</div>
			<div class="status-item" class:ready={status?.tts_ready} class:missing={!status?.tts_ready}>
				<span class="icon">{status?.tts_ready ? '✓' : '○'}</span>
				<span>TTS</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.voice {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		height: 100%;
		color: var(--color-text-secondary);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid rgba(255, 255, 255, 0.1);
		border-top-color: #8b5cf6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.voice-header {
		text-align: center;
	}

	.voice-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0;
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.voice-visualizer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding: 3rem;
		width: 100%;
		max-width: 400px;
	}

	.voice-orb {
		position: relative;
		width: 150px;
		height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.orb-inner {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		z-index: 1;
		transition: all 0.3s;
	}

	.voice-orb.listening .orb-inner {
		background: linear-gradient(135deg, #22c55e, #16a34a);
		animation: pulse-inner 1s ease-in-out infinite;
	}

	.voice-orb.speaking .orb-inner {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		animation: pulse-inner 0.5s ease-in-out infinite;
	}

	@keyframes pulse-inner {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	.orb-ring {
		position: absolute;
		border-radius: 50%;
		border: 2px solid rgba(139, 92, 246, 0.3);
		opacity: 0;
	}

	.voice-orb.listening .orb-ring,
	.voice-orb.speaking .orb-ring {
		animation: ripple 2s ease-out infinite;
	}

	.ring-1 {
		width: 100px;
		height: 100px;
		animation-delay: 0s;
	}
	.ring-2 {
		width: 120px;
		height: 120px;
		animation-delay: 0.5s;
	}
	.ring-3 {
		width: 140px;
		height: 140px;
		animation-delay: 1s;
	}

	@keyframes ripple {
		0% {
			opacity: 0.5;
			transform: scale(0.8);
		}
		100% {
			opacity: 0;
			transform: scale(1.5);
		}
	}

	.voice-status {
		font-size: 1.125rem;
	}

	.status-text {
		color: var(--color-text-secondary);
	}

	.status-text.recording {
		color: #22c55e;
	}

	.status-text.speaking {
		color: #f59e0b;
	}

	.status-text.ready {
		color: #22c55e;
	}

	.status-text.not-ready {
		color: var(--color-text-secondary);
	}

	.error-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
		color: #ef4444;
		width: 100%;
		max-width: 500px;
	}

	.error-banner button {
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: 1px solid currentColor;
		border-radius: 0.25rem;
		color: inherit;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.voice-controls {
		display: flex;
		gap: 1rem;
	}

	.voice-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		border: none;
		color: var(--color-text-primary);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.voice-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.voice-btn.active {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
	}

	.voice-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.voice-btn.secondary {
		background: rgba(255, 255, 255, 0.03);
	}

	.voice-btn kbd {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.25rem;
		color: var(--color-text-secondary);
	}

	.transcript {
		width: 100%;
		max-width: 600px;
		padding: 1.5rem;
	}

	.transcript h3 {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem;
	}

	.transcript p {
		margin: 0;
		line-height: 1.6;
	}

	.voice-status-bar {
		display: flex;
		gap: 1.5rem;
		padding: 0.75rem 1.5rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.status-item.ready {
		color: #22c55e;
	}

	.status-item.missing {
		color: var(--color-text-secondary);
	}

	.status-item .icon {
		font-size: 1rem;
	}
</style>
