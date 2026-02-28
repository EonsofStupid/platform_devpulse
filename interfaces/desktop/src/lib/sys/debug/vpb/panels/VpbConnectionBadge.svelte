<!--
	@file VPB Connection Badge — Dev Server Status
	@layer vpb
-->
<script lang="ts">
	import { vpbConnection } from "../state/vpb-connection.svelte.js";
</script>

{#if !vpbConnection.connected}
	<div class="vpb-conn-badge vpb-conn-badge--disconnected">
		<span class="vpb-conn-badge__dot"></span>
		Disconnected
		{#if vpbConnection.reconnectCount > 0}
			<span class="vpb-conn-badge__count">(reconnected {vpbConnection.reconnectCount}x)</span>
		{/if}
	</div>
{/if}

<style>
	.vpb-conn-badge {
		position: absolute;
		top: 44px;
		right: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 11px;
		z-index: 10;
	}
	.vpb-conn-badge--disconnected {
		background: oklch(0.4 0.15 30 / 0.9);
		color: oklch(0.9 0.1 50);
		border: 1px solid oklch(0.5 0.15 30 / 0.5);
	}
	.vpb-conn-badge__dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: oklch(0.7 0.2 30);
		animation: vpb-pulse 1.5s infinite;
	}
	.vpb-conn-badge__count {
		opacity: 0.7;
	}
	@keyframes vpb-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}
</style>
