<script lang="ts">
	/**
	 * VoiceView - Voice interaction with Maestro
	 * Features: Push-to-talk, continuous listening, voice feedback, status monitoring
	 */
	import { onMount } from 'svelte';
	import { voiceStore } from '$lib/stores/voice.svelte';

	const isRecording = $derived(voiceStore.isRecording);
	const isSpeaking = $derived(voiceStore.isSpeaking);
	const status = $derived(voiceStore.status);
	const error = $derived(voiceStore.error);
	const isRefreshing = $derived(voiceStore.isRefreshing);
	const downloadInstructions = $derived(voiceStore.downloadInstructions);

	// Local state
	let transcript = $state('');
	let showStatusPanel = $state(false);
	let showDownloadInstructions = $state(false);

	onMount(async () => {
		await voiceStore.init();
		if (!voiceStore.isFullyReady) {
			await voiceStore.fetchDownloadInstructions();
		}
	});

	function toggleRecording() {
		voiceStore.toggleRecording((text) => {
			transcript = text;
		});
	}

	async function refreshStatus() {
		await voiceStore.refresh();
	}

	async function testTTS() {
		if (status?.tts_ready) {
			await voiceStore.speakText('Hello! This is a test of the text to speech system.');
		}
	}

	function dismissError() {
		voiceStore.clearError();
	}
</script>

<div class="voice">
	<header class="voice-header">
		<h1>Voice</h1>
		<p class="subtitle">Talk with Maestro</p>
	</header>

	{#if error}
		<div class="error-banner">
			<span>{error}</span>
			<button onclick={dismissError}>Dismiss</button>
		</div>
	{/if}

	<!-- Status Panel Toggle -->
	<button class="status-toggle glass" onclick={() => (showStatusPanel = !showStatusPanel)}>
		<span class="status-indicator" class:ready={voiceStore.isFullyReady} class:partial={voiceStore.isPartiallyReady && !voiceStore.isFullyReady} class:unavailable={!voiceStore.isPartiallyReady}></span>
		<span>
			{#if voiceStore.isFullyReady}
				Voice Ready
			{:else if voiceStore.isPartiallyReady}
				Voice Partially Ready
			{:else}
				Voice Unavailable
			{/if}
		</span>
		<span class="toggle-icon">{showStatusPanel ? '▼' : '▶'}</span>
	</button>

	<!-- Status Panel -->
	{#if showStatusPanel}
		<div class="status-panel glass">
			<div class="status-header">
				<h3>Voice Model Status</h3>
				<button class="refresh-btn" onclick={refreshStatus} disabled={isRefreshing}>
					{isRefreshing ? 'Checking...' : 'Refresh'}
				</button>
			</div>

			<div class="status-grid">
				<div class="status-item" class:ready={status?.stt_ready} class:missing={!status?.stt_ready}>
					<span class="status-icon">{status?.stt_ready ? '✓' : '✗'}</span>
					<div class="status-info">
						<span class="status-name">Speech-to-Text (STT)</span>
						<span class="status-engine">Whisper</span>
					</div>
				</div>

				<div class="status-item" class:ready={status?.tts_ready} class:missing={!status?.tts_ready}>
					<span class="status-icon">{status?.tts_ready ? '✓' : '✗'}</span>
					<div class="status-info">
						<span class="status-name">Text-to-Speech (TTS)</span>
						<span class="status-engine">Kokoro</span>
					</div>
				</div>
			</div>

			{#if status?.stt_missing?.length || status?.tts_missing?.length}
				<div class="missing-models">
					<h4>Missing Model Files</h4>
					{#if status?.stt_missing?.length}
						<div class="missing-group">
							<span class="missing-label">STT:</span>
							<ul>
								{#each status.stt_missing as file}
									<li>{file}</li>
								{/each}
							</ul>
						</div>
					{/if}
					{#if status?.tts_missing?.length}
						<div class="missing-group">
							<span class="missing-label">TTS:</span>
							<ul>
								{#each status.tts_missing as file}
									<li>{file}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>

				<button
					class="instructions-btn"
					onclick={() => (showDownloadInstructions = !showDownloadInstructions)}
				>
					{showDownloadInstructions ? 'Hide' : 'Show'} Download Instructions
				</button>

				{#if showDownloadInstructions && downloadInstructions}
					<pre class="download-instructions">{downloadInstructions}</pre>
				{/if}
			{/if}

			{#if status?.tts_ready}
				<div class="test-section">
					<button class="test-btn" onclick={testTTS} disabled={isSpeaking}>
						{isSpeaking ? 'Speaking...' : 'Test TTS'}
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<div class="voice-visualizer glass">
		<div class="voice-orb" class:listening={isRecording} class:speaking={isSpeaking} class:disabled={!status?.stt_ready}>
			<div class="orb-inner">
				{#if !status?.stt_ready}
					⚠️
				{:else if isRecording}
					🎤
				{:else if isSpeaking}
					🔊
				{:else}
					🎙️
				{/if}
			</div>
			<div class="orb-ring ring-1"></div>
			<div class="orb-ring ring-2"></div>
			<div class="orb-ring ring-3"></div>
		</div>

		<div class="voice-status">
			{#if !status?.stt_ready}
				<span class="status-text warning">STT not available</span>
			{:else if isRecording}
				<span class="status-text">Listening...</span>
			{:else if isSpeaking}
				<span class="status-text">Maestro is speaking...</span>
			{:else}
				<span class="status-text">Ready</span>
			{/if}
		</div>
	</div>

	<div class="voice-controls">
		<button
			class="voice-btn glass"
			class:active={isRecording}
			onclick={toggleRecording}
			disabled={!status?.stt_ready}
		>
			{isRecording ? 'Stop' : 'Push to Talk'}
			<kbd>Space</kbd>
		</button>

		<button class="voice-btn glass secondary" onclick={() => (showStatusPanel = !showStatusPanel)}>
			Settings
			<span>⚙️</span>
		</button>
	</div>

	{#if transcript}
		<div class="transcript glass">
			<h3>Transcript</h3>
			<p>{transcript}</p>
		</div>
	{/if}

	<div class="voice-tips glass">
		<h3>Tips</h3>
		<ul>
			<li>Hold <kbd>Space</kbd> for push-to-talk</li>
			<li>Say "Hey Maestro" for voice activation</li>
			<li>Speak clearly for best results</li>
		</ul>
	</div>
</div>

<style>
	.voice {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		overflow-y: auto;
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

	.error-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		color: #ef4444;
		width: 100%;
		max-width: 600px;
	}

	.error-banner button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		text-decoration: underline;
	}

	/* Status Toggle Button */
	.status-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.5rem;
		border: none;
		color: var(--color-text-primary);
		cursor: pointer;
		width: 100%;
		max-width: 400px;
	}

	.status-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #6b7280;
	}

	.status-indicator.ready {
		background: #22c55e;
	}

	.status-indicator.partial {
		background: #f59e0b;
	}

	.status-indicator.unavailable {
		background: #ef4444;
	}

	.toggle-icon {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	/* Status Panel */
	.status-panel {
		width: 100%;
		max-width: 600px;
		padding: 1.5rem;
	}

	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.status-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.refresh-btn {
		padding: 0.5rem 1rem;
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 0.5rem;
		color: #818cf8;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.refresh-btn:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.3);
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		border: 1px solid transparent;
	}

	.status-item.ready {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.status-item.missing {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.status-icon {
		font-size: 1.25rem;
	}

	.status-item.ready .status-icon {
		color: #22c55e;
	}

	.status-item.missing .status-icon {
		color: #ef4444;
	}

	.status-info {
		display: flex;
		flex-direction: column;
	}

	.status-name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.status-engine {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.missing-models {
		padding: 1rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.missing-models h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: #ef4444;
	}

	.missing-group {
		margin: 0.5rem 0;
	}

	.missing-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.missing-models ul {
		margin: 0.25rem 0 0;
		padding-left: 1.25rem;
	}

	.missing-models li {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-family: monospace;
	}

	.instructions-btn {
		width: 100%;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		cursor: pointer;
		margin-bottom: 1rem;
	}

	.instructions-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.download-instructions {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.5rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		white-space: pre-wrap;
		word-break: break-word;
		overflow-x: auto;
		margin: 0 0 1rem;
	}

	.test-section {
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.test-btn {
		padding: 0.5rem 1rem;
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 0.5rem;
		color: #22c55e;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.test-btn:hover:not(:disabled) {
		background: rgba(34, 197, 94, 0.3);
	}

	.test-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Voice Visualizer */
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
		font-size: 2rem;
		z-index: 1;
		transition: all 0.3s;
	}

	.voice-orb.disabled .orb-inner {
		background: linear-gradient(135deg, #6b7280, #4b5563);
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
		color: var(--color-text-secondary);
	}

	.status-text.warning {
		color: #f59e0b;
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

	.voice-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
	}

	.voice-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.voice-btn.active {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.5);
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

	.voice-tips {
		width: 100%;
		max-width: 600px;
		padding: 1.5rem;
	}

	.voice-tips h3 {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin: 0 0 0.75rem;
	}

	.voice-tips ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.voice-tips li {
		margin: 0.5rem 0;
		color: var(--color-text-secondary);
	}

	.voice-tips kbd {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.25rem;
	}
</style>
