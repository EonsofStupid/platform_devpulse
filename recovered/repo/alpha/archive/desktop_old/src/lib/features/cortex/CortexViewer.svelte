<script lang="ts">
	/**
	 * CortexViewer - Visual representation of Maestro's thinking process
	 *
	 * Shows the RAG pipeline stages:
	 * INPUT -> RETRIEVAL -> RERANKING -> REASONING -> OUTPUT
	 */
	import { ruminationState } from "$lib/stores";

	interface Props {
		onClose?: () => void;
	}

	let { onClose }: Props = $props();

	// Pipeline state from rumination
	let isProcessing = $derived(ruminationState.isProcessing);
	let currentLayer = $derived(ruminationState.layerLabel);

	type StageStatus = "pending" | "active" | "complete" | "error";

	interface PipelineStage {
		id: string;
		label: string;
		status: StageStatus;
		icon: string;
		detail?: string;
		progress?: number;
		metric?: string;
	}

	// Pipeline stages with mock data (will be wired to real backend)
	let stages = $state<PipelineStage[]>([
		{
			id: "input",
			label: "INPUT",
			status: "complete",
			icon: "📝",
			detail: '"How do I..."',
		},
		{
			id: "retrieval",
			label: "RETRIEVAL",
			status: "active",
			icon: "🔍",
			detail: "Searching 3,247 chunks",
			progress: 65,
			metric: "Found 12 relevant",
		},
		{
			id: "reranking",
			label: "RERANKING",
			status: "pending",
			icon: "🎯",
			detail: "Scoring relevance",
			metric: "Top 5 selected",
		},
		{
			id: "reasoning",
			label: "REASONING",
			status: "pending",
			icon: "🧠",
			detail: "Llm processing",
			metric: "Layer: Cortex",
		},
		{
			id: "output",
			label: "OUTPUT",
			status: "pending",
			icon: "💬",
		},
	]);

	// Metrics
	let metrics = $state({
		tokens: 1247,
		latency: 1.2,
		context: 4096,
	});

	function getStageColor(status: StageStatus): string {
		switch (status) {
			case "complete":
				return "#22c55e";
			case "active":
				return "#6366f1";
			case "error":
				return "#ef4444";
			default:
				return "rgba(255, 255, 255, 0.3)";
		}
	}
</script>

<div class="cortex-viewer">
	<header class="viewer-header">
		<h2>CORTEX VIEWER</h2>
		{#if onClose}
			<button class="close-btn" onclick={onClose} aria-label="Close"
				>×</button
			>
		{/if}
	</header>

	<div class="pipeline">
		{#each stages as stage, i (stage.id)}
			<div class="stage-container">
				<!-- Stage Node -->
				<div
					class="stage-node"
					class:complete={stage.status === "complete"}
					class:active={stage.status === "active"}
					class:error={stage.status === "error"}
				>
					<div class="node-icon">{stage.icon}</div>
					<div class="node-label">{stage.label}</div>

					{#if stage.detail}
						<div class="node-detail">{stage.detail}</div>
					{/if}

					{#if stage.status === "active" && stage.progress !== undefined}
						<div class="node-progress">
							<div
								class="progress-bar"
								style="width: {stage.progress}%"
							></div>
						</div>
					{/if}
				</div>

				<!-- Stage Info (side panel) -->
				{#if stage.metric && (stage.status === "active" || stage.status === "complete")}
					<div
						class="stage-info"
						style="border-color: {getStageColor(stage.status)}"
					>
						<span class="info-arrow">◄─</span>
						<span class="info-text">{stage.metric}</span>
					</div>
				{/if}

				<!-- Connector -->
				{#if i < stages.length - 1}
					<div
						class="connector"
						class:active={stage.status === "complete"}
					></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Metrics Footer -->
	<footer class="metrics-footer">
		<div class="metric">
			<span class="metric-label">Tokens</span>
			<span class="metric-value">{metrics.tokens.toLocaleString()}</span>
		</div>
		<div class="metric">
			<span class="metric-label">Latency</span>
			<span class="metric-value">{metrics.latency.toFixed(1)}s</span>
		</div>
		<div class="metric">
			<span class="metric-label">Context</span>
			<span class="metric-value">{metrics.context.toLocaleString()}</span>
		</div>
	</footer>
</div>

<style>
	.cortex-viewer {
		background: rgba(20, 20, 35, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 16px;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
		overflow: hidden;
	}

	.viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.viewer-header h2 {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.8);
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.pipeline {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stage-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		width: 100%;
	}

	.stage-node {
		width: 180px;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		text-align: center;
		transition: all 0.3s ease;
	}

	.stage-node.complete {
		border-color: rgba(34, 197, 94, 0.5);
		background: rgba(34, 197, 94, 0.08);
	}

	.stage-node.active {
		border-color: rgba(99, 102, 241, 0.6);
		background: rgba(99, 102, 241, 0.1);
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
	}

	.stage-node.error {
		border-color: rgba(239, 68, 68, 0.5);
		background: rgba(239, 68, 68, 0.08);
	}

	.node-icon {
		font-size: 1.5rem;
		margin-bottom: 0.25rem;
	}

	.node-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.7);
	}

	.node-detail {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.25rem;
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.node-progress {
		margin-top: 0.5rem;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: #6366f1;
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.stage-info {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.35rem 0.6rem;
		background: rgba(0, 0, 0, 0.4);
		border-left: 2px solid;
		border-radius: 0 6px 6px 0;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.info-arrow {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.connector {
		width: 2px;
		height: 24px;
		background: rgba(255, 255, 255, 0.15);
		margin: 0.25rem 0;
		transition: background 0.3s ease;
	}

	.connector.active {
		background: rgba(34, 197, 94, 0.5);
	}

	.metrics-footer {
		display: flex;
		justify-content: center;
		gap: 2rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.metric {
		text-align: center;
	}

	.metric-label {
		display: block;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.15rem;
	}

	.metric-value {
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		font-family: "JetLlms Mono", "Fira Code", monospace;
	}
</style>
