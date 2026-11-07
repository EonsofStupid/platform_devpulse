<script lang="ts">
	/**
	 * Maestro Chat Window - Separate lightweight window
	 *
	 * Structure:
	 * - Header: Maestro status, window controls
	 * - Social Bar: Quick access to friends/channels
	 * - Chat Area: Always visible message list
	 * - HUD Bar: Dashboard quick actions (expandable)
	 * - Input: Message input with voice controls
	 */
	import { onMount } from 'svelte';
	import { MessageList, ChatInput, TaskPanel, DebugPanel } from '$lib/components/chat';
	import { chatStore, ruminationState, voiceStore, taskStore } from '$lib/stores';
	import { closeChatWindow, dockChatWindow, navigateMainWindow, focusMainWindow, restoreMainWindow } from '$lib/api/window';

	// Rumination state
	let isRuminating = $derived(ruminationState.isProcessing);
	let currentLayer = $derived(ruminationState.layerLabel);

	// Voice state
	let voiceReady = $derived(voiceStore.status?.tts_ready || voiceStore.status?.stt_ready);
	let isRecording = $derived(voiceStore.isRecording);
	let isSpeaking = $derived(voiceStore.isSpeaking);

	// HUD state
	let hudExpanded = $state(false);
	let showTasks = $state(false);

	// Social channels (mock - will be wired to backend)
	const channels = [
		{ id: 'maestro', name: 'Maestro', icon: '🤖', unread: 0, active: true },
		{ id: 'team', name: 'Team', icon: '👥', unread: 2, active: false },
		{ id: 'notes', name: 'Notes', icon: '📝', unread: 0, active: false }
	];
	let activeChannel = $state('maestro');

	// HUD quick actions
	const hudActions = [
		{ id: 'dashboard', label: 'Dashboard', icon: '🏠', route: '/' },
		{ id: 'projects', label: 'Projects', icon: '📁', route: '/projects' },
		{ id: 'voice', label: 'Voice', icon: '🎙️', route: '/voice' },
		{ id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' }
	];

	function handleSend(content: string) {
		chatStore.send(content);
	}

	async function handleClose() {
		await closeChatWindow();
	}

	async function handleDock(edge: 'left' | 'right') {
		await dockChatWindow(edge);
	}

	async function navigateTo(route: string) {
		try {
			await restoreMainWindow();
			await navigateMainWindow(route);
			// Keep chat focused, main window comes up in background
		} catch (e) {
			console.error('Failed to navigate:', e);
		}
	}

	async function showDashboard() {
		try {
			await restoreMainWindow();
			await focusMainWindow();
		} catch (e) {
			console.error('Failed to show dashboard:', e);
		}
	}

	function toggleVoice() {
		chatStore.toggleFeature('voiceInput');
	}

	onMount(() => {
		voiceStore.init();
		chatStore.init();
	});
</script>

<div class="chat-window">
	<!-- Header -->
	<header class="header">
		<div class="header-left">
			<div class="maestro-icon" class:ruminating={isRuminating}>
				<svg width="18" height="18" viewBox="0 0 32 32" fill="none">
					<circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none" />
					<circle cx="16" cy="16" r="6" fill="currentColor" />
					<path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" stroke-width="2" />
				</svg>
			</div>
			<span class="title">Maestro</span>
			{#if isRuminating}
				<span class="status thinking">{currentLayer}</span>
			{:else}
				<span class="status ready">Ready</span>
			{/if}
		</div>
		<div class="header-right">
			<button class="icon-btn" onclick={() => handleDock('left')} title="Dock left">◧</button>
			<button class="icon-btn" onclick={() => handleDock('right')} title="Dock right">◨</button>
			<button class="icon-btn close" onclick={handleClose} title="Close">✕</button>
		</div>
	</header>

	<!-- Social Bar -->
	<nav class="social-bar">
		{#each channels as ch}
			<button
				class="channel-btn"
				class:active={activeChannel === ch.id}
				onclick={() => (activeChannel = ch.id)}
			>
				<span class="channel-icon">{ch.icon}</span>
				<span class="channel-name">{ch.name}</span>
				{#if ch.unread > 0}
					<span class="unread-badge">{ch.unread}</span>
				{/if}
			</button>
		{/each}
	</nav>

	<!-- Task Panel (collapsible) -->
	{#if showTasks}
		<div class="task-section">
			<TaskPanel />
		</div>
	{/if}

	<!-- Chat Area (always visible) -->
	<main class="chat-area">
		<MessageList messages={chatStore.messages} loading={chatStore.loading} />

		{#if chatStore.error}
			<div class="error-msg">
				{chatStore.error}
				<button onclick={() => (chatStore.error = null)}>×</button>
			</div>
		{/if}
	</main>

	<!-- Input -->
	<div class="input-section">
		<ChatInput onSend={handleSend} disabled={chatStore.loading} />
	</div>

	<!-- Debug Panel (test toggles) -->
	<DebugPanel />

	<!-- HUD Bar -->
	<footer class="hud-bar">
		<div class="hud-main">
			<button class="hud-trigger" onclick={() => (hudExpanded = !hudExpanded)}>
				<span class="hud-icon">⚡</span>
				<span class="hud-label">HUD</span>
				<span class="hud-arrow" class:expanded={hudExpanded}>▲</span>
			</button>

			<div class="hud-quick">
				<button class="quick-btn" onclick={showDashboard} title="Show Dashboard">
					🖥️
				</button>
				<button class="quick-btn" class:active={showTasks} onclick={() => (showTasks = !showTasks)} title="Tasks">
					📋
				</button>
				{#if voiceReady}
					<button
						class="quick-btn"
						class:active={chatStore.features.voiceInput}
						class:recording={isRecording}
						onclick={toggleVoice}
						title="Voice"
					>
						🎙️
					</button>
				{/if}
			</div>
		</div>

		{#if hudExpanded}
			<div class="hud-expanded">
				{#each hudActions as action}
					<button class="hud-action" onclick={() => navigateTo(action.route)}>
						<span class="action-icon">{action.icon}</span>
						<span class="action-label">{action.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	</footer>
</div>

<style>
	.chat-window {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: linear-gradient(135deg, rgba(36, 3, 54, 0.98) 0%, rgba(45, 15, 60, 0.95) 100%);
		color: #e8e0f0;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* === HEADER === */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		background: rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid rgba(130, 111, 214, 0.25);
		-webkit-app-region: drag;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.maestro-icon {
		color: #7f2fa8;
		display: flex;
		filter: drop-shadow(0 0 6px rgba(127, 47, 168, 0.5));
	}

	.maestro-icon.ruminating {
		animation: spin 3s linear infinite;
	}

	.title {
		font-weight: 600;
		font-size: 0.875rem;
		background: linear-gradient(135deg, #e8e0f0 0%, #a78bfa 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.status {
		font-size: 0.5625rem;
		padding: 0.125rem 0.375rem;
		border-radius: 9999px;
		font-weight: 500;
		text-transform: uppercase;
	}

	.status.ready {
		background: rgba(0, 184, 122, 0.2);
		color: #00b87a;
	}

	.status.thinking {
		background: rgba(79, 70, 229, 0.3);
		color: white;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.header-right {
		display: flex;
		gap: 0.125rem;
		-webkit-app-region: no-drag;
	}

	.icon-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		color: rgba(232, 224, 240, 0.5);
		font-size: 0.75rem;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.icon-btn:hover {
		color: #e8e0f0;
		background: rgba(130, 111, 214, 0.2);
	}

	.icon-btn.close:hover {
		background: rgba(239, 68, 68, 0.3);
		color: #fca5a5;
	}

	/* === SOCIAL BAR === */
	.social-bar {
		display: flex;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(130, 111, 214, 0.15);
		overflow-x: auto;
	}

	.channel-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		color: rgba(232, 224, 240, 0.6);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.channel-btn:hover {
		color: #e8e0f0;
		background: rgba(130, 111, 214, 0.15);
	}

	.channel-btn.active {
		color: #e8e0f0;
		background: rgba(127, 47, 168, 0.25);
		border-color: rgba(127, 47, 168, 0.4);
	}

	.channel-icon {
		font-size: 0.875rem;
	}

	.channel-name {
		font-weight: 500;
	}

	.unread-badge {
		background: #ef4444;
		color: white;
		font-size: 0.5625rem;
		padding: 0.0625rem 0.3125rem;
		border-radius: 9999px;
		font-weight: 600;
	}

	/* === TASK SECTION === */
	.task-section {
		border-bottom: 1px solid rgba(130, 111, 214, 0.15);
		max-height: 200px;
		overflow-y: auto;
	}

	/* === CHAT AREA === */
	.chat-area {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
	}

	.error-msg {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		margin: 0.5rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 6px;
		color: #fca5a5;
		font-size: 0.75rem;
	}

	.error-msg button {
		background: transparent;
		border: none;
		color: inherit;
		font-size: 1rem;
		cursor: pointer;
		opacity: 0.7;
		padding: 0;
	}

	.error-msg button:hover {
		opacity: 1;
	}

	/* === INPUT === */
	.input-section {
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.25);
		border-top: 1px solid rgba(130, 111, 214, 0.15);
	}

	/* === HUD BAR === */
	.hud-bar {
		background: rgba(0, 0, 0, 0.4);
		border-top: 1px solid rgba(130, 111, 214, 0.25);
	}

	.hud-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.375rem 0.5rem;
	}

	.hud-trigger {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: rgba(127, 47, 168, 0.2);
		border: 1px solid rgba(127, 47, 168, 0.3);
		border-radius: 6px;
		color: #a78bfa;
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.hud-trigger:hover {
		background: rgba(127, 47, 168, 0.3);
	}

	.hud-icon {
		font-size: 0.875rem;
	}

	.hud-arrow {
		font-size: 0.5rem;
		transition: transform 0.2s ease;
	}

	.hud-arrow.expanded {
		transform: rotate(180deg);
	}

	.hud-quick {
		display: flex;
		gap: 0.25rem;
	}

	.quick-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quick-btn:hover {
		background: rgba(130, 111, 214, 0.15);
		border-color: rgba(130, 111, 214, 0.2);
	}

	.quick-btn.active {
		background: rgba(127, 47, 168, 0.2);
		border-color: rgba(127, 47, 168, 0.3);
	}

	.quick-btn.recording {
		background: rgba(239, 68, 68, 0.3);
		border-color: rgba(239, 68, 68, 0.4);
		animation: pulse 1s ease-in-out infinite;
	}

	.hud-expanded {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.375rem;
		padding: 0.5rem;
		border-top: 1px solid rgba(130, 111, 214, 0.15);
	}

	.hud-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: rgba(130, 111, 214, 0.1);
		border: 1px solid rgba(130, 111, 214, 0.15);
		border-radius: 8px;
		color: rgba(232, 224, 240, 0.8);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.hud-action:hover {
		background: rgba(130, 111, 214, 0.2);
		border-color: rgba(130, 111, 214, 0.3);
		color: #e8e0f0;
	}

	.action-icon {
		font-size: 1.25rem;
	}

	.action-label {
		font-size: 0.625rem;
		font-weight: 500;
	}

	/* === ANIMATIONS === */
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	/* === SCROLLBAR === */
	.chat-area::-webkit-scrollbar {
		width: 5px;
	}

	.chat-area::-webkit-scrollbar-track {
		background: transparent;
	}

	.chat-area::-webkit-scrollbar-thumb {
		background: rgba(130, 111, 214, 0.3);
		border-radius: 3px;
	}

	.chat-area::-webkit-scrollbar-thumb:hover {
		background: rgba(130, 111, 214, 0.5);
	}
</style>
