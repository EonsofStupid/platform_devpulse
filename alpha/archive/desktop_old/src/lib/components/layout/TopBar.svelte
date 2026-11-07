<script lang="ts">
	/**
	 * TopBar - 66px fixed top bar
	 * 
	 * Layout: [≡] DevPulse | Maestro Status | [🔔] [👤] [⚙️]
	 */
	import { statusStore } from '$lib/stores';

	interface Props {
		onMenuToggle?: () => void;
	}

	let { onMenuToggle }: Props = $props();

	let aiReady = $derived(statusStore.aiReady);
	let aiThinking = $derived(statusStore.loading);
</script>

<header class="topbar">
	<div class="left">
		<button class="menu-btn" onclick={onMenuToggle} title="Toggle sidebar">
			<span class="icon">≡</span>
		</button>
		<div class="brand">
			<span class="brand-icon">⚡</span>
			<span class="brand-text">DevPulse</span>
		</div>
	</div>

	<div class="center">
		<div class="maestro-status" class:ready={aiReady} class:thinking={aiThinking}>
			<span class="status-dot"></span>
			<span class="status-text">
				{#if aiThinking}
					Maestro Thinking...
				{:else if aiReady}
					Maestro Ready
				{:else}
					Maestro Offline
				{/if}
			</span>
		</div>
	</div>

	<div class="right">
		<button class="action-btn" title="Notifications">
			<span class="icon">🔔</span>
		</button>
		<button class="action-btn" title="Profile">
			<span class="icon">👤</span>
		</button>
		<a href="/settings" class="action-btn" title="Settings">
			<span class="icon">⚙️</span>
		</a>
	</div>
</header>

<style>
	.topbar {
		height: 66px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1rem;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		position: fixed;
		top: 0;
		left: 52px;
		right: 0;
		z-index: 100;
	}

	.left, .right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.menu-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		font-size: 1.25rem;
		transition: all 0.15s ease;
	}

	.menu-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.brand-icon {
		font-size: 1.5rem;
	}

	.brand-text {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.center {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
	}

	.maestro-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
	}

	.maestro-status.ready .status-dot {
		background: #22c55e;
		box-shadow: 0 0 8px #22c55e;
	}

	.maestro-status.thinking .status-dot {
		background: #f59e0b;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.status-text {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	.action-btn {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		font-size: 1.1rem;
		transition: all 0.15s ease;
		text-decoration: none;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}
</style>
