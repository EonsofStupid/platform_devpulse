<script lang="ts">
	/**
	 * ROTI Dashboard - Return on Time Invested calculation and visualization
	 */
	import Header from '$lib/components/layout/Header.svelte';
	import MetricsCard from '$lib/components/MetricsCard.svelte';

	// Scaffolded ROTI data
	let rotiScore = 0.0;
	let timeInvested = 0;
	let valueGenerated = 0;
	let sessionsAnalyzed = 0;
</script>

<div class="flex flex-col h-full">
	<Header title="ROTI Dashboard" />

	<div class="flex-1 p-6 overflow-auto">
		<div class="info-banner glass">
			<p>
				<strong>Implementation Status:</strong> ROTI calculation not yet implemented. This
				dashboard will show Return on Time Invested metrics based on user session analysis.
			</p>
		</div>

		<!-- Metrics Row -->
		<div class="grid grid-cols-4 gap-4 mb-6">
			<MetricsCard label="ROTI Score" value={rotiScore.toFixed(2)} color="blue" />
			<MetricsCard label="Time Invested" value={timeInvested} unit="hrs" color="purple" />
			<MetricsCard label="Value Generated" value={valueGenerated} color="green" />
			<MetricsCard label="Sessions" value={sessionsAnalyzed} color="cyan" />
		</div>

		<div class="sections-grid">
			<!-- ROTI Formula -->
			<div class="section glass">
				<h3 class="section-title">ROTI Formula</h3>
				<div class="formula-display">
					<code>ROTI = (Value Generated / Time Invested) × Effectiveness Factor</code>
				</div>
				<ul class="formula-notes">
					<li>Value Generated: Completion of tasks, code written, problems solved</li>
					<li>Time Invested: Active session time, excluding idle periods</li>
					<li>Effectiveness Factor: Quality metrics, error rate, user satisfaction</li>
				</ul>
			</div>

			<!-- Time Breakdown -->
			<div class="section glass">
				<h3 class="section-title">Time Breakdown</h3>
				<div class="placeholder-chart">
					<p class="text-dim">Chart: Time distribution across activities</p>
					<p class="text-dim">(Coding, Research, Communication, Idle)</p>
				</div>
			</div>

			<!-- Value Metrics -->
			<div class="section glass">
				<h3 class="section-title">Value Metrics</h3>
				<div class="metrics-list">
					<div class="list-item">
						<span>Tasks Completed</span>
						<span class="value">0</span>
					</div>
					<div class="list-item">
						<span>Code Lines Written</span>
						<span class="value">0</span>
					</div>
					<div class="list-item">
						<span>Problems Solved</span>
						<span class="value">0</span>
					</div>
					<div class="list-item">
						<span>Documentation Created</span>
						<span class="value">0</span>
					</div>
				</div>
			</div>

			<!-- Effectiveness -->
			<div class="section glass">
				<h3 class="section-title">Effectiveness</h3>
				<div class="metrics-list">
					<div class="list-item">
						<span>Error Rate</span>
						<span class="value">—</span>
					</div>
					<div class="list-item">
						<span>First-Time Success</span>
						<span class="value">—</span>
					</div>
					<div class="list-item">
						<span>User Satisfaction</span>
						<span class="value">—</span>
					</div>
					<div class="list-item">
						<span>Context Switches</span>
						<span class="value">0</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.info-banner {
		padding: 1rem 1.5rem;
		margin-bottom: 2rem;
		background: rgba(251, 146, 60, 0.1);
		border: 1px solid rgba(251, 146, 60, 0.3);
		border-radius: 1rem;
	}

	.info-banner p {
		color: #fb923c;
		font-size: 0.875rem;
		margin: 0;
	}

	.sections-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.section {
		padding: 1.5rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #f1f5f9;
	}

	.formula-display {
		background: rgba(255, 255, 255, 0.05);
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.formula-display code {
		color: #06b6d4;
		font-family: 'SF Mono', 'Monaco', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		display: block;
	}

	.formula-notes {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.formula-notes li {
		font-size: 0.8125rem;
		color: #94a3b8;
		padding-left: 1.5rem;
		position: relative;
	}

	.formula-notes li::before {
		content: '→';
		position: absolute;
		left: 0;
		color: #6366f1;
	}

	.placeholder-chart {
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 3rem 2rem;
		text-align: center;
	}

	.text-dim {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.metrics-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.list-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 0.5rem;
	}

	.list-item span:first-child {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.list-item .value {
		font-size: 0.875rem;
		font-weight: 600;
		color: #cbd5e1;
		font-family: 'SF Mono', 'Monaco', monospace;
	}

	.glass {
		background: rgba(17, 24, 39, 0.8);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
	}
</style>
