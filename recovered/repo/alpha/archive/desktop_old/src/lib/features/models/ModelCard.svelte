<script lang="ts">
	/**
	 * ModelCard - Display a single model with its role and status
	 */
	import ModelProgressBar from "./ModelProgressBar.svelte";
	import type { ModelRole, ModelStatus } from "./types";

	interface Props {
		role: ModelRole;
		modelId: string | null;
		modelName: string | null;
		status: ModelStatus;
		loadProgress?: number;
		loadStage?: string;
		vramUsage?: number; // GB
		device?: string;
		loadTime?: number; // seconds
		error?: string | null;
		onLoad?: () => void;
		onUnload?: () => void;
		onSwitch?: () => void;
	}

	let {
		role,
		modelId,
		modelName,
		status,
		loadProgress = 0,
		loadStage = "idle",
		vramUsage,
		device,
		loadTime,
		error = null,
		onLoad,
		onUnload,
		onSwitch,
	}: Props = $props();

	const roleLabels: Record<ModelRole, string> = {
		llm: "LLM",
		embedder: "EMBEDDER",
		reranker: "RERANKER",
		tts: "TTS",
		stt: "STT",
	};

	const roleDescriptions: Record<ModelRole, string> = {
		llm: "Main reasoning model for chat",
		embedder: "Vector embedding generation",
		reranker: "Search result reranking",
		tts: "Text-to-speech synthesis",
		stt: "Speech-to-text transcription",
	};

	const roleIcons: Record<ModelRole, string> = {
		llm: "🧠",
		embedder: "📐",
		reranker: "🎯",
		tts: "🔊",
		stt: "🎤",
	};
</script>

<div
	class="model-card"
	class:loaded={status === "loaded"}
	class:loading={status === "loading"}
	class:error={status === "error"}
>
	<div class="card-header">
		<div class="role-info">
			<span class="role-icon">{roleIcons[role]}</span>
			<span class="role-label">{roleLabels[role]}</span>
		</div>
		<div
			class="status-badge"
			class:loaded={status === "loaded"}
			class:loading={status === "loading"}
			class:error={status === "error"}
		>
			{#if status === "loaded"}
				<span class="status-dot"></span> LOADED
			{:else if status === "loading"}
				<span class="spinner"></span> LOADING
			{:else if status === "error"}
				ERROR
			{:else}
				EMPTY
			{/if}
		</div>
	</div>

	<div class="card-body">
		{#if modelName}
			<div class="model-name">{modelName}</div>
		{:else}
			<div class="model-empty">(not assigned)</div>
		{/if}

		{#if status === "loading"}
			<ModelProgressBar
				stage={loadStage as
					| "idle"
					| "checking"
					| "loading_weights"
					| "loading_projector"
					| "warming_up"
					| "ready"
					| "failed"}
				progress={loadProgress}
				{error}
			/>
		{/if}

		{#if status === "loaded" && (vramUsage || device || loadTime)}
			<div class="model-stats">
				{#if vramUsage}
					<span class="stat">VRAM: {vramUsage.toFixed(1)}GB</span>
				{/if}
				{#if device}
					<span class="stat">Device: {device}</span>
				{/if}
				{#if loadTime}
					<span class="stat">Load: {loadTime.toFixed(1)}s</span>
				{/if}
			</div>
		{/if}

		{#if error && status === "error"}
			<div class="error-message">{error}</div>
		{/if}
	</div>

	<div class="card-actions">
		{#if status === "unloaded" && modelId}
			<button class="action-btn load" onclick={onLoad}>
				Load Model
			</button>
		{:else if status === "loaded"}
			<button class="action-btn unload" onclick={onUnload}>
				Unload
			</button>
		{/if}

		<button class="action-btn switch" onclick={onSwitch}>
			{modelId ? "Switch Model" : "Assign Model"}
		</button>
	</div>
</div>

<style>
	.model-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.model-card.loaded {
		border-color: rgba(34, 197, 94, 0.3);
	}

	.model-card.loading {
		border-color: rgba(99, 102, 241, 0.3);
	}

	.model-card.error {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.role-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.role-icon {
		font-size: 1.25rem;
	}

	.role-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.7);
		letter-spacing: 0.05em;
	}

	.status-badge {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.5);
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.status-badge.loaded {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.status-badge.loading {
		background: rgba(99, 102, 241, 0.2);
		color: #818cf8;
	}

	.status-badge.error {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}

	.spinner {
		width: 10px;
		height: 10px;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.card-body {
		margin-bottom: 0.75rem;
	}

	.model-name {
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 0.5rem;
	}

	.model-empty {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.4);
		font-style: italic;
	}

	.model-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.stat {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.error-message {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 6px;
		font-size: 0.75rem;
		color: #ef4444;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		flex: 1;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		border: 1px solid transparent;
	}

	.action-btn.load {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border-color: rgba(34, 197, 94, 0.3);
	}

	.action-btn.load:hover {
		background: rgba(34, 197, 94, 0.3);
	}

	.action-btn.unload {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}

	.action-btn.unload:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.action-btn.switch {
		background: rgba(99, 102, 241, 0.2);
		color: #818cf8;
		border-color: rgba(99, 102, 241, 0.3);
	}

	.action-btn.switch:hover {
		background: rgba(99, 102, 241, 0.3);
	}
</style>
