<script lang="ts">
	/**
	 * VoiceSetup - Voice model configuration wizard
	 *
	 * Guides users through setting up voice models (Whisper for STT, Kokoro for TTS).
	 * Steps:
	 * 1. Status - Show current state, prompt to browse
	 * 2. Scanning - Show spinner while scanning folder
	 * 3. Results - Show discovered models, let user confirm
	 * 4. Help - Show download instructions if no models found
	 */
	import { open } from '@tauri-apps/plugin-dialog';
	import {
		scanVoiceModels,
		getVoiceSetupHelp,
		saveVoiceModelPath,
		type VoiceDiscoveryResult,
		type VoiceStatus
	} from '$lib/api/voice';

	// Props
	interface Props {
		status: VoiceStatus;
		onComplete?: () => void;
	}

	let { status, onComplete }: Props = $props();

	// State
	type Step = 'status' | 'scanning' | 'results' | 'help' | 'saving';
	let step = $state<Step>('status');
	let discovery = $state<VoiceDiscoveryResult | null>(null);
	let helpText = $state('');
	let selectedPath = $state('');
	let error = $state<string | null>(null);

	async function handleBrowse() {
		error = null;
		const result = await open({
			directory: true,
			title: 'Select Voice Models Folder',
			multiple: false
		});

		if (result) {
			selectedPath = result;
			step = 'scanning';

			try {
				discovery = await scanVoiceModels(result);
				if (discovery.whisper_models.length > 0 || discovery.kokoro_models.length > 0) {
					step = 'results';
				} else {
					// No models found, show help
					await loadHelp();
					step = 'help';
				}
			} catch (e) {
				error = String(e);
				step = 'status';
			}
		}
	}

	async function loadHelp() {
		try {
			helpText = await getVoiceSetupHelp();
		} catch (e) {
			helpText = 'Failed to load help text.';
		}
	}

	async function showHelp() {
		await loadHelp();
		step = 'help';
	}

	async function confirmSelection() {
		if (!selectedPath) return;

		step = 'saving';
		try {
			await saveVoiceModelPath(selectedPath);
			onComplete?.();
		} catch (e) {
			error = String(e);
			step = 'results';
		}
	}

	function backToStatus() {
		step = 'status';
		error = null;
	}

	// Count ready models
	$effect(() => {
		if (discovery) {
			const readyWhisper = discovery.whisper_models.filter((m) => m.ready).length;
			const readyKokoro = discovery.kokoro_models.filter((m) => m.ready).length;
			console.log(`Found ${readyWhisper} ready Whisper, ${readyKokoro} ready Kokoro models`);
		}
	});
</script>

<div class="voice-setup">
	{#if step === 'status'}
		<div class="setup-card glass">
			<div class="setup-icon">
				<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
					<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
					<line x1="12" y1="19" x2="12" y2="23" />
					<line x1="8" y1="23" x2="16" y2="23" />
				</svg>
			</div>
			<h2>Voice Setup</h2>
			<p class="description">
				Configure speech recognition (STT) and text-to-speech (TTS) for hands-free interaction with
				Maestro.
			</p>

			<div class="current-status">
				<div class="status-item" class:ready={status.stt_ready} class:missing={!status.stt_ready}>
					<span class="status-icon">{status.stt_ready ? '✓' : '○'}</span>
					<span>Speech-to-Text (Whisper)</span>
				</div>
				<div class="status-item" class:ready={status.tts_ready} class:missing={!status.tts_ready}>
					<span class="status-icon">{status.tts_ready ? '✓' : '○'}</span>
					<span>Text-to-Speech (Kokoro)</span>
				</div>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="actions">
				<button class="btn primary" onclick={handleBrowse}>Browse for Models Folder</button>
				<button class="btn secondary" onclick={showHelp}>Need Help?</button>
			</div>
		</div>

	{:else if step === 'scanning'}
		<div class="setup-card glass">
			<div class="scanning">
				<div class="spinner"></div>
				<h2>Scanning...</h2>
				<p class="path">{selectedPath}</p>
			</div>
		</div>

	{:else if step === 'results'}
		<div class="setup-card glass results">
			<h2>Found Models</h2>
			<p class="scanned-path">Scanned: {discovery?.scanned_path}</p>

			{#if discovery}
				<div class="model-sections">
					<div class="model-section">
						<h3>Whisper (Speech-to-Text)</h3>
						{#if discovery.whisper_models.length === 0}
							<p class="empty">No Whisper models found</p>
						{:else}
							{#each discovery.whisper_models as model}
								<div class="model-item" class:ready={model.ready}>
									<span class="model-icon">{model.ready ? '✓' : '⚠'}</span>
									<div class="model-info">
										<span class="model-name">{model.name}</span>
										<span class="model-size">({model.size})</span>
									</div>
									{#if !model.ready && model.missing.length > 0}
										<span class="missing-files">Missing: {model.missing.join(', ')}</span>
									{/if}
								</div>
							{/each}
						{/if}
					</div>

					<div class="model-section">
						<h3>Kokoro (Text-to-Speech)</h3>
						{#if discovery.kokoro_models.length === 0}
							<p class="empty">No Kokoro models found</p>
						{:else}
							{#each discovery.kokoro_models as model}
								<div class="model-item" class:ready={model.ready}>
									<span class="model-icon">{model.ready ? '✓' : '⚠'}</span>
									<div class="model-info">
										<span class="model-name">{model.name}</span>
										{#if model.voices.length > 0}
											<span class="voice-count">({model.voices.length} voices)</span>
										{/if}
									</div>
									{#if !model.ready && model.missing.length > 0}
										<span class="missing-files">Missing: {model.missing.join(', ')}</span>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</div>

				{#if discovery.errors.length > 0}
					<div class="errors">
						{#each discovery.errors as err}
							<p class="error-line">{err}</p>
						{/each}
					</div>
				{/if}
			{/if}

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="actions">
				{#if discovery?.has_stt || discovery?.has_tts}
					<button class="btn primary" onclick={confirmSelection}>Use These Models</button>
				{/if}
				<button class="btn secondary" onclick={handleBrowse}>Browse Different Folder</button>
				<button class="btn tertiary" onclick={backToStatus}>Back</button>
			</div>
		</div>

	{:else if step === 'help'}
		<div class="setup-card glass help">
			<h2>Download Voice Models</h2>
			<p class="description">
				Voice models are not included with DevPulse. Follow these instructions to download them.
			</p>

			<pre class="help-text">{helpText}</pre>

			<div class="actions">
				<button class="btn primary" onclick={handleBrowse}>Re-scan After Download</button>
				<button class="btn tertiary" onclick={backToStatus}>Back</button>
			</div>
		</div>

	{:else if step === 'saving'}
		<div class="setup-card glass">
			<div class="scanning">
				<div class="spinner"></div>
				<h2>Saving Configuration...</h2>
			</div>
		</div>
	{/if}
</div>

<style>
	.voice-setup {
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 2rem;
		min-height: 400px;
	}

	.setup-card {
		max-width: 500px;
		width: 100%;
		padding: 2rem;
		text-align: center;
	}

	.setup-card.results {
		max-width: 600px;
		text-align: left;
	}

	.setup-card.help {
		max-width: 700px;
		text-align: left;
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
	}

	.setup-icon {
		margin-bottom: 1rem;
		color: var(--color-accent, #8b5cf6);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
	}

	h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-text-secondary, #a1a1aa);
	}

	.description {
		color: var(--color-text-secondary, #a1a1aa);
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}

	.current-status {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
	}

	.status-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.status-item.ready {
		color: #22c55e;
	}

	.status-item.missing {
		color: var(--color-text-secondary, #a1a1aa);
	}

	.status-icon {
		font-size: 1.25rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn.primary {
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		color: white;
	}

	.btn.primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
	}

	.btn.secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary, white);
	}

	.btn.secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn.tertiary {
		background: transparent;
		color: var(--color-text-secondary, #a1a1aa);
	}

	.btn.tertiary:hover {
		color: var(--color-text-primary, white);
	}

	.scanning {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
	}

	.spinner {
		width: 48px;
		height: 48px;
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

	.path,
	.scanned-path {
		color: var(--color-text-secondary, #a1a1aa);
		font-family: monospace;
		font-size: 0.875rem;
		word-break: break-all;
	}

	.model-sections {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin: 1.5rem 0;
	}

	.model-section {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
	}

	.model-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.model-item:last-child {
		border-bottom: none;
	}

	.model-item.ready {
		color: #22c55e;
	}

	.model-icon {
		font-size: 1rem;
		min-width: 1.5rem;
	}

	.model-info {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: baseline;
	}

	.model-name {
		font-weight: 500;
	}

	.model-size,
	.voice-count {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #a1a1aa);
	}

	.missing-files {
		font-size: 0.75rem;
		color: #f59e0b;
		display: block;
		width: 100%;
	}

	.empty {
		color: var(--color-text-secondary, #a1a1aa);
		font-style: italic;
		margin: 0.5rem 0;
	}

	.help-text {
		background: rgba(0, 0, 0, 0.3);
		padding: 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.6;
		overflow-x: auto;
		white-space: pre-wrap;
		margin: 1.5rem 0;
		max-height: 300px;
		overflow-y: auto;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		padding: 0.75rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.errors {
		margin: 1rem 0;
		padding: 0.75rem;
		background: rgba(245, 158, 11, 0.1);
		border-radius: 0.5rem;
	}

	.error-line {
		margin: 0.25rem 0;
		color: #f59e0b;
		font-size: 0.875rem;
	}
</style>
