<script lang="ts">
	/**
	 * MaestroFab - Lightweight floating action button for Maestro
	 * Opens the separate chat window via Tauri command
	 * Does NOT load chat UI - keeps main bundle light
	 */
	import { onMount } from 'svelte';
	import { ruminationState } from '$lib/stores';
	import { openChatWindow } from '$lib/api/window';

	// Rumination indicator
	let isRuminating = $derived(ruminationState.isProcessing);

	// Notification state (could wire to backend later)
	let hasNotification = $state(false);

	async function handleClick() {
		try {
			await openChatWindow();
		} catch (e) {
			console.error('Failed to open chat window:', e);
		}
	}

	// Keyboard shortcut: Ctrl+G to open Maestro
	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
			event.preventDefault();
			handleClick();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<button
	class="maestro-fab"
	class:has-notification={hasNotification}
	class:is-ruminating={isRuminating}
	onclick={handleClick}
	aria-label="Open Maestro (Ctrl+G)"
	title="Open Maestro (Ctrl+G)"
>
	<div class="maestro-avatar" class:ruminating={isRuminating}>
		<svg width="28" height="28" viewBox="0 0 32 32" fill="none">
			<circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none" />
			<circle cx="16" cy="16" r="6" fill="currentColor" />
			<path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" stroke-width="2" />
		</svg>
	</div>

	{#if isRuminating}
		<div class="rumination-ring"></div>
	{/if}

	{#if hasNotification}
		<span class="notification-dot"></span>
	{/if}
</button>

<style>
	.maestro-fab {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: none;
		background: rgba(36, 3, 54, 0.9);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 1000;
		transition: all 0.2s ease;
		box-shadow:
			0 4px 20px rgba(127, 47, 168, 0.4),
			0 0 30px rgba(127, 47, 168, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.maestro-fab:hover {
		transform: scale(1.1);
		box-shadow:
			0 6px 30px rgba(127, 47, 168, 0.5),
			0 0 40px rgba(127, 47, 168, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.15);
	}

	.maestro-fab:active {
		transform: scale(0.95);
	}

	.maestro-avatar {
		color: #7f2fa8;
		display: flex;
		filter: drop-shadow(0 0 8px rgba(127, 47, 168, 0.6));
	}

	.maestro-fab.has-notification {
		animation: pulse-glow 2s ease-in-out infinite;
	}

	.maestro-fab.is-ruminating {
		animation: rumination-glow 1.5s ease-in-out infinite;
	}

	.maestro-avatar.ruminating {
		animation: rumination-spin 3s linear infinite;
	}

	/* Rumination ring */
	.rumination-ring {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 2px solid transparent;
		border-top-color: #4f46e5;
		border-right-color: rgba(79, 70, 229, 0.5);
		animation: rumination-ring-spin 1s linear infinite;
	}

	.notification-dot {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 12px;
		height: 12px;
		background: #00b87a;
		border-radius: 50%;
		border: 2px solid rgba(36, 3, 54, 0.9);
		box-shadow: 0 0 8px rgba(0, 184, 122, 0.6);
	}

	@keyframes pulse-glow {
		0%,
		100% {
			box-shadow:
				0 4px 20px rgba(127, 47, 168, 0.4),
				0 0 30px rgba(127, 47, 168, 0.2);
		}
		50% {
			box-shadow:
				0 4px 30px rgba(127, 47, 168, 0.6),
				0 0 50px rgba(127, 47, 168, 0.4);
		}
	}

	@keyframes rumination-glow {
		0%,
		100% {
			box-shadow:
				0 4px 20px rgba(79, 70, 229, 0.4),
				0 0 30px rgba(79, 70, 229, 0.2);
		}
		50% {
			box-shadow:
				0 4px 35px rgba(79, 70, 229, 0.6),
				0 0 50px rgba(79, 70, 229, 0.4);
		}
	}

	@keyframes rumination-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes rumination-ring-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
