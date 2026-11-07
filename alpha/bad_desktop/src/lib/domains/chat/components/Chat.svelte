<script lang="ts">
	/**
	 * ChatWindowView - Standalone layout for Tauri child window
	 *
	 * Features:
	 * - Native title bar (minimize/close via OS)
	 * - Mode-based theming
	 * - Pin (always-on-top) toggle
	 * - Dock to main window edge
	 * - Social channels
	 * - HUD quick actions
	 */
	import { onMount } from 'svelte';
	import MessageList from './MessageList.svelte';
	import ChatInput from './ChatInput.svelte';
	import TaskPanel from './TaskPanel.svelte';
	import DebugPanel from './DebugPanel.svelte';
	import { chatStore, MODE_THEMES, type AssistantMode } from '../stores';
	import { ruminationState, voiceStore } from '$lib/stores';
	import { dockChatWindow, toggleChatAlwaysOnTop, navigateMainWindow, focusMainWindow, restoreMainWindow } from '$lib/api/window';

	// Rumination state
	let isRuminating = $derived(ruminationState.isProcessing);
	let currentLayer = $derived(ruminationState.layerLabel);

	// Theme state (mode-based)
	let currentMode = $derived(chatStore.assistantMode);
	let theme = $derived(MODE_THEMES[currentMode]);
	let connectionStatus = $derived(chatStore.connectionStatus);

	// Voice state
	let voiceReady = $derived(voiceStore.status?.tts_ready || voiceStore.status?.stt_ready);
	let isRecording = $derived(voiceStore.isRecording);

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

	// Available modes for quick switching
	const modes: AssistantMode[] = ['chat', 'dev', 'thinkspace', 'planning'];

	function setMode(mode: AssistantMode) {
		chatStore.setAssistantMode(mode);
	}

	// Pin state (always-on-top)
	let isPinned = $state(false);

	function handleSend(content: string) {
		chatStore.send(content);
	}

	async function handlePin() {
		try {
			isPinned = await toggleChatAlwaysOnTop();
		} catch (e) {
			console.error('Failed to toggle pin:', e);
		}
	}

	async function handleDock(edge: 'left' | 'right') {
		await dockChatWindow(edge);
	}

	async function navigateTo(route: string) {
		try {
			await restoreMainWindow();
			await navigateMainWindow(route);
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

<div class="chat-window" style="--glass-tint: {theme.hue};">
	<!-- Header -->
	<header class="chat-header glass-deep">
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
				<span class="status-badge status-thinking">{currentLayer}</span>
			{:else}
				<span class="status-badge status-ready">Ready</span>
			{/if}
			<span
				class="connection-dot"
				class:connected={connectionStatus === 'connected'}
				class:connecting={connectionStatus === 'connecting'}
				class:error={connectionStatus === 'error'}
				title={connectionStatus}
			></span>
		</div>
		<div class="header-right">
			<div class="mode-selector glass">
				{#each modes as mode}
					<button
						class="mode-btn"
						class:active={currentMode === mode}
						onclick={() => setMode(mode)}
						title={MODE_THEMES[mode].label}
					>
						{MODE_THEMES[mode].icon}
					</button>
				{/each}
			</div>
			<button class="icon-btn" onclick={() => handleDock('left')} title="Dock left">◧</button>
			<button class="icon-btn" onclick={() => handleDock('right')} title="Dock right">◨</button>
			<button class="icon-btn pin" class:active={isPinned} onclick={handlePin} title={isPinned ? 'Unpin from top' : 'Pin to top'}>📌</button>
		</div>
	</header>

	<!-- Social Bar -->
	<nav class="social-bar glass">
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
		<div class="task-section glass-layer-1">
			<TaskPanel />
		</div>
	{/if}

	<!-- Chat Area (always visible) -->
	<main class="chat-area">
		<MessageList messages={chatStore.messages} loading={chatStore.loading} />

		{#if chatStore.error}
			<div class="error-msg glass-error">
				{chatStore.error}
				<button onclick={() => (chatStore.error = null)}>×</button>
			</div>
		{/if}
	</main>

	<!-- Input -->
	<div class="input-section glass-deep">
		<ChatInput onSend={handleSend} disabled={chatStore.loading} />
	</div>

	<!-- Debug Panel (test toggles) -->
	<DebugPanel />

	<!-- HUD Bar -->
	<footer class="hud-bar glass-intense">
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
					<button class="hud-action glass-card" onclick={() => navigateTo(action.route)}>
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
		background: var(--dp-obsidian-950);
		color: var(--dp-text-primary);
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	/* === HEADER === */
	.chat-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--dp-space-2) var(--dp-space-3);
		border-radius: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
	}

	.maestro-icon {
		color: var(--dp-accent-primary);
		display: flex;
		filter: drop-shadow(0 0 6px oklch(from var(--dp-accent-primary) l c h / 0.5));
		transition: color 0.3s ease, filter 0.3s ease;
	}

	.maestro-icon.ruminating {
		animation: spin 3s linear infinite;
	}

	.title {
		font-weight: 600;
		font-size: var(--dp-text-sm);
		color: var(--dp-text-primary);
	}

	.status-badge {
		font-size: 0.5625rem;
		padding: 0.125rem var(--dp-space-2);
		border-radius: var(--dp-radius-full);
		font-weight: 500;
		text-transform: uppercase;
	}

	.status-ready {
		background: oklch(from var(--dp-success) l c h / 0.2);
		color: var(--dp-success);
	}

	.status-thinking {
		background: oklch(from var(--dp-accent-primary) l c h / 0.3);
		color: var(--dp-text-primary);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.connection-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--dp-radius-full);
		background: var(--dp-text-dim);
		transition: all 0.3s ease;
	}

	.connection-dot.connected {
		background: var(--dp-success);
		box-shadow: 0 0 6px oklch(from var(--dp-success) l c h / 0.6);
	}

	.connection-dot.connecting {
		background: var(--dp-warning);
		animation: pulse 1s ease-in-out infinite;
	}

	.connection-dot.error {
		background: var(--dp-error);
		box-shadow: 0 0 6px oklch(from var(--dp-error) l c h / 0.6);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: var(--dp-space-1);
	}

	/* Mode selector */
	.mode-selector {
		display: flex;
		gap: 2px;
		padding: 2px;
		border-radius: var(--dp-radius);
		margin-right: var(--dp-space-2);
	}

	.mode-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: var(--dp-radius-sm);
		font-size: var(--dp-text-xs);
		cursor: pointer;
		transition: all var(--dp-transition-fast);
		opacity: 0.5;
	}

	.mode-btn:hover {
		opacity: 0.8;
		background: var(--dp-glass-border);
	}

	.mode-btn.active {
		opacity: 1;
		background: oklch(from var(--dp-accent-primary) l c h / 0.3);
		box-shadow: 0 0 8px oklch(from var(--dp-accent-primary) l c h / 0.3);
	}

	.icon-btn {
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--dp-text-muted);
		font-size: var(--dp-text-xs);
		cursor: pointer;
		border-radius: var(--dp-radius-sm);
		transition: all var(--dp-transition-fast);
	}

	.icon-btn:hover {
		color: var(--dp-text-primary);
		background: var(--dp-glass-border);
	}

	.icon-btn.pin.active {
		background: oklch(from var(--dp-accent-primary) l c h / 0.3);
		color: var(--dp-accent-primary);
	}

	/* === SOCIAL BAR === */
	.social-bar {
		display: flex;
		gap: var(--dp-space-1);
		padding: var(--dp-space-2);
		border-radius: 0;
		overflow-x: auto;
	}

	.channel-btn {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
		padding: var(--dp-space-2) var(--dp-space-3);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--dp-radius);
		color: var(--dp-text-muted);
		font-size: var(--dp-text-xs);
		cursor: pointer;
		transition: all var(--dp-transition-fast);
		white-space: nowrap;
	}

	.channel-btn:hover {
		color: var(--dp-text-primary);
		background: var(--dp-glass-border);
	}

	.channel-btn.active {
		color: var(--dp-text-primary);
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-color: var(--dp-glass-border-bright);
	}

	.channel-icon {
		font-size: var(--dp-text-sm);
	}

	.channel-name {
		font-weight: 500;
	}

	.unread-badge {
		background: var(--dp-error);
		color: white;
		font-size: 0.5625rem;
		padding: 0.0625rem 0.3125rem;
		border-radius: var(--dp-radius-full);
		font-weight: 600;
	}

	/* === TASK SECTION === */
	.task-section {
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
		background: var(--dp-obsidian-900);
	}

	.error-msg {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--dp-space-2) var(--dp-space-3);
		margin: var(--dp-space-2);
		border-radius: var(--dp-radius);
		font-size: var(--dp-text-xs);
	}

	.error-msg button {
		background: transparent;
		border: none;
		color: inherit;
		font-size: var(--dp-text-base);
		cursor: pointer;
		opacity: 0.7;
		padding: 0;
	}

	.error-msg button:hover {
		opacity: 1;
	}

	/* === INPUT === */
	.input-section {
		padding: var(--dp-space-2);
		border-radius: 0;
	}

	/* === HUD BAR === */
	.hud-bar {
		border-radius: 0;
	}

	.hud-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--dp-space-2);
	}

	.hud-trigger {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2);
		padding: var(--dp-space-1) var(--dp-space-2);
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border: 1px solid var(--dp-glass-border-bright);
		border-radius: var(--dp-radius);
		color: var(--dp-accent-primary);
		font-size: 0.6875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--dp-transition-fast);
	}

	.hud-trigger:hover {
		background: oklch(from var(--dp-accent-primary) l c h / 0.3);
	}

	.hud-icon {
		font-size: var(--dp-text-sm);
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
		gap: var(--dp-space-1);
	}

	.quick-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--dp-radius-sm);
		font-size: var(--dp-text-sm);
		cursor: pointer;
		transition: all var(--dp-transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.quick-btn:hover {
		background: var(--dp-glass-border);
		border-color: var(--dp-glass-border-bright);
	}

	.quick-btn.active {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		border-color: var(--dp-glass-border-bright);
	}

	.quick-btn.recording {
		background: oklch(from var(--dp-error) l c h / 0.3);
		border-color: var(--dp-error);
		animation: pulse 1s ease-in-out infinite;
	}

	.hud-expanded {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--dp-space-2);
		padding: var(--dp-space-2);
		border-top: 1px solid var(--dp-glass-border);
	}

	.hud-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--dp-space-1);
		padding: var(--dp-space-2);
		color: var(--dp-text-secondary);
		cursor: pointer;
	}

	.hud-action:hover {
		color: var(--dp-text-primary);
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
		background: var(--dp-glass-border);
		border-radius: 3px;
	}

	.chat-area::-webkit-scrollbar-thumb:hover {
		background: var(--dp-glass-border-bright);
	}
</style>
