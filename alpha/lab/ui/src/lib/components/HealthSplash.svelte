<script lang="ts">
	/**
	 * HealthSplash - Startup system check with animated display
	 * Blocks navigation until all critical systems are verified
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface HealthCheck {
		component: string;
		status: 'pass' | 'warn' | 'fail' | 'unknown';
		message: string | null;
		latency_ms: number | null;
	}

	interface HealthResponse {
		status: string;
		checks: HealthCheck[];
		timestamp: string;
		overall_healthy: boolean;
	}

	let checks = $state<HealthCheck[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let canProceed = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('http://localhost:3001/api/health');
			if (!response.ok) {
				throw new Error(`Health check failed: ${response.statusText}`);
			}

			const data: HealthResponse = await response.json();
			checks = data.checks;
			canProceed = data.overall_healthy;
			loading = false;

			// Auto-proceed if healthy after 1.5 seconds
			if (canProceed) {
				setTimeout(() => {
					goto('/dashboard');
				}, 1500);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			loading = false;
		}
	});

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'pass':
				return '✓';
			case 'warn':
				return '⚠';
			case 'fail':
				return '✗';
			default:
				return '?';
		}
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'pass':
				return 'check-pass';
			case 'warn':
				return 'check-warn';
			case 'fail':
				return 'check-fail';
			default:
				return 'check-unknown';
		}
	}
</script>

<div class="health-splash">
	<div class="splash-container glass">
		<h1 class="splash-title">DevPulse Lab</h1>
		<p class="splash-subtitle">Mission Control Initialization</p>

		{#if loading}
			<div class="loading-state">
				<div class="neural-loader"></div>
				<p>Checking systems...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<div class="error-icon">✗</div>
				<p class="error-message">{error}</p>
				<button class="btn-secondary" onclick={() => window.location.reload()}>Retry</button>
			</div>
		{:else}
			<div class="checks-list">
				{#each checks as check (check.component)}
					<div class={`check-item ${getStatusClass(check.status)}`}>
						<span class="check-icon">{getStatusIcon(check.status)}</span>
						<span class="check-component">{check.component}</span>
						{#if check.message}
							<span class="check-message">{check.message}</span>
						{/if}
						{#if check.latency_ms}
							<span class="check-latency">{check.latency_ms}ms</span>
						{/if}
					</div>
				{/each}
			</div>

			{#if !canProceed}
				<div class="warning-state">
					<p>Some systems are not fully operational</p>
					<button class="btn-secondary" onclick={() => goto('/dashboard')}>
						Proceed Anyway
					</button>
				</div>
			{:else}
				<div class="success-state">
					<p class="text-success">All systems operational</p>
					<p class="text-dim">Redirecting to dashboard...</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.health-splash {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1), transparent 70%);
		padding: 2rem;
	}

	.splash-container {
		max-width: 600px;
		width: 100%;
		padding: 3rem;
		text-align: center;
	}

	.splash-title {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, #6366f1, #a855f7);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.splash-subtitle {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 2rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.loading-state {
		padding: 2rem;
	}

	.neural-loader {
		width: 50px;
		height: 50px;
		border: 3px solid rgba(99, 102, 241, 0.2);
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-state {
		padding: 2rem;
	}

	.error-icon {
		font-size: 3rem;
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.error-message {
		color: #f87171;
		margin-bottom: 1.5rem;
	}

	.checks-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 2rem 0;
		text-align: left;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.check-icon {
		font-size: 1.25rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.check-component {
		font-weight: 600;
		min-width: 120px;
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
	}

	.check-message {
		color: #9ca3af;
		flex: 1;
	}

	.check-latency {
		color: #6b7280;
		font-size: 0.75rem;
		font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
	}

	.check-pass {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.check-pass .check-icon {
		color: #22c55e;
	}

	.check-warn {
		border-color: rgba(251, 146, 60, 0.3);
	}

	.check-warn .check-icon {
		color: #fb923c;
	}

	.check-fail {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.check-fail .check-icon {
		color: #ef4444;
	}

	.check-unknown .check-icon {
		color: #6b7280;
	}

	.warning-state {
		margin-top: 2rem;
		padding: 1.5rem;
		background: rgba(251, 146, 60, 0.1);
		border: 1px solid rgba(251, 146, 60, 0.3);
		border-radius: 0.75rem;
	}

	.warning-state p {
		color: #fb923c;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.success-state {
		margin-top: 2rem;
		padding: 1.5rem;
	}

	.text-success {
		color: #22c55e;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.text-dim {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.btn-secondary {
		padding: 0.625rem 1.25rem;
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 0.5rem;
		color: #a5b4fc;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: rgba(99, 102, 241, 0.2);
		border-color: rgba(99, 102, 241, 0.5);
	}

	.glass {
		background: rgba(17, 24, 39, 0.8);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
	}
</style>
