<script lang="ts">
	/**
	 * Dashboard Page - Main overview after health check
	 * Shows system metrics, recent signals, and component status
	 */
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import MetricsCard from '$lib/components/MetricsCard.svelte';
	import { signalStore } from '$lib/stores/signals.svelte';

	// Signal store auto-connects via +layout.svelte
</script>

<div class="flex flex-col h-full">
	<Header title="Dashboard" />

	<div class="flex-1 p-6 overflow-auto">
		<!-- Metrics Row -->
		<div class="grid grid-cols-4 gap-4 mb-6">
			<MetricsCard label="Signals" value={signalStore.signals.length} color="blue" />
			<MetricsCard label="Active Minions" value={0} color="green" />
			<MetricsCard label="Loaded Models" value={0} color="purple" />
			<MetricsCard label="VRAM Usage" value="0.0" unit="GB" color="amber" />
		</div>

		<div class="welcome-panel glass">
			<h2 class="welcome-title">Mission Control Ready</h2>
			<p class="welcome-text">
				All systems operational. Navigate using the sidebar to access model management, agent
				status, ROTI analytics, and pipeline visualization.
			</p>

			<div class="quick-links">
				<a href="/models" class="quick-link glass">
					<span class="link-icon">🔧</span>
					<span class="link-text">Model Management</span>
				</a>
				<a href="/agents" class="quick-link glass">
					<span class="link-icon">🤖</span>
					<span class="link-text">Sub-Agent Status</span>
				</a>
				<a href="/roti" class="quick-link glass">
					<span class="link-icon">📊</span>
					<span class="link-text">ROTI Dashboard</span>
				</a>
				<a href="/pipeline" class="quick-link glass">
					<span class="link-icon">⚡</span>
					<span class="link-text">Pipeline Viz</span>
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.welcome-panel {
		padding: 3rem;
		text-align: center;
		margin: 2rem auto;
		max-width: 800px;
	}

	.welcome-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #6366f1, #a855f7);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.welcome-text {
		color: #94a3b8;
		font-size: 1rem;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.quick-links {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 2rem;
	}

	.quick-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.5rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.quick-link:hover {
		transform: translateY(-2px);
		border-color: rgba(99, 102, 241, 0.4);
	}

	.link-icon {
		font-size: 2rem;
	}

	.link-text {
		color: #cbd5e1;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.glass {
		background: rgba(17, 24, 39, 0.8);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
	}
</style>
