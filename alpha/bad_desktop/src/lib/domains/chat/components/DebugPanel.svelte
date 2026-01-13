<script lang="ts">
	/**
	 * DebugPanel - Toggle controls for testing chat features
	 *
	 * Shows:
	 * - Feature toggles (streaming, voice, driftGuard)
	 * - Connection status
	 * - Quick actions for testing
	 */
	import { chatStore } from '../stores';
	import { voiceStore } from '$lib/stores';

	let collapsed = $state(true);

	// Chat features
	let streaming = $derived(chatStore.features.streaming);
	let voiceInput = $derived(chatStore.features.voiceInput);
	let voiceOutput = $derived(chatStore.features.voiceOutput);
	let driftGuard = $derived(chatStore.features.driftGuard);

	// Voice status
	let sttReady = $derived(voiceStore.status?.stt_ready ?? false);
	let ttsReady = $derived(voiceStore.status?.tts_ready ?? false);

	// Message stats
	let messageCount = $derived(chatStore.messages.length);
	let sessionId = $derived(chatStore.sessionId);
</script>

{#if collapsed}
	<button class="debug-toggle" onclick={() => (collapsed = false)} title="Debug Panel">
		🔧
	</button>
{:else}
	<div class="debug-panel">
		<header class="panel-header">
			<span>Debug</span>
			<button class="close-btn" onclick={() => (collapsed = true)}>×</button>
		</header>

		<section class="section">
			<h4>Features</h4>
			<label class="toggle-row">
				<input type="checkbox" checked={streaming} onchange={() => chatStore.toggleFeature('streaming')} />
				<span>Streaming</span>
			</label>
			<label class="toggle-row">
				<input type="checkbox" checked={voiceInput} onchange={() => chatStore.toggleFeature('voiceInput')} />
				<span>Voice Input</span>
			</label>
			<label class="toggle-row">
				<input type="checkbox" checked={voiceOutput} onchange={() => chatStore.toggleFeature('voiceOutput')} />
				<span>Voice Output</span>
			</label>
			<label class="toggle-row">
				<input type="checkbox" checked={driftGuard} onchange={() => chatStore.toggleFeature('driftGuard')} />
				<span>Drift Guard</span>
			</label>
		</section>

		<section class="section">
			<h4>Status</h4>
			<div class="status-row">
				<span>STT</span>
				<span class="badge" class:ready={sttReady}>{sttReady ? 'Ready' : 'Off'}</span>
			</div>
			<div class="status-row">
				<span>TTS</span>
				<span class="badge" class:ready={ttsReady}>{ttsReady ? 'Ready' : 'Off'}</span>
			</div>
			<div class="status-row">
				<span>Messages</span>
				<span class="value">{messageCount}</span>
			</div>
		</section>

		<section class="section">
			<h4>Actions</h4>
			<div class="actions">
				<button onclick={() => chatStore.clear()}>Clear Chat</button>
				<button onclick={() => chatStore.newSession()}>New Session</button>
				<button onclick={() => chatStore.loadHistory()}>Reload History</button>
			</div>
		</section>

		<div class="session-id">
			Session: {sessionId.slice(0, 8)}...
		</div>
	</div>
{/if}

<style>
	.debug-toggle {
		position: fixed;
		bottom: 80px;
		right: 12px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(139, 92, 246, 0.2);
		border: 1px solid rgba(139, 92, 246, 0.3);
		color: #a78bfa;
		cursor: pointer;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		transition: all 0.15s ease;
	}

	.debug-toggle:hover {
		background: rgba(139, 92, 246, 0.3);
		transform: scale(1.05);
	}

	.debug-panel {
		position: fixed;
		bottom: 80px;
		right: 12px;
		width: 200px;
		background: rgba(15, 23, 42, 0.95);
		border: 1px solid rgba(139, 92, 246, 0.3);
		border-radius: 8px;
		font-size: 0.75rem;
		z-index: 100;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: rgba(139, 92, 246, 0.15);
		border-bottom: 1px solid rgba(139, 92, 246, 0.2);
		font-weight: 600;
		color: #a78bfa;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		font-size: 1rem;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: white;
	}

	.section {
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.section:last-of-type {
		border-bottom: none;
	}

	h4 {
		margin: 0 0 0.375rem 0;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.4);
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
		cursor: pointer;
		color: rgba(255, 255, 255, 0.8);
	}

	.toggle-row input {
		margin: 0;
		accent-color: #8b5cf6;
	}

	.status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
		color: rgba(255, 255, 255, 0.7);
	}

	.badge {
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		background: rgba(239, 68, 68, 0.2);
		color: #fca5a5;
	}

	.badge.ready {
		background: rgba(34, 197, 94, 0.2);
		color: #86efac;
	}

	.value {
		font-weight: 600;
		color: #a78bfa;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.actions button {
		padding: 0.375rem 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.6875rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.actions button:hover {
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.3);
	}

	.session-id {
		padding: 0.375rem 0.75rem;
		font-size: 0.625rem;
		color: rgba(255, 255, 255, 0.3);
		font-family: monospace;
	}
</style>
