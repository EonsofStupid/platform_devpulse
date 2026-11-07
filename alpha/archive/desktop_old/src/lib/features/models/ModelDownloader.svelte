<script lang="ts">
	/**
	 * ModelDownloader - Download models from HuggingFace
	 * Shows recommended models and download progress
	 */

	interface HfModel {
		repo_id: string;
		filename: string;
		size_bytes: number;
		quantization: string;
		description: string;
	}

	interface DownloadProgress {
		handle: string;
		repo_id: string;
		filename: string;
		downloaded_bytes: number;
		total_bytes: number;
		speed_bps: number;
		eta_seconds: number;
		status: 'downloading' | 'paused' | 'completed' | 'failed';
		error?: string;
	}

	interface Props {
		onClose: () => void;
		onDownloadStart?: (handle: string) => void;
		onDownloadComplete?: (modelId: string) => void;
	}

	let { onClose, onDownloadStart, onDownloadComplete }: Props = $props();

	let searchQuery = $state('');
	let searching = $state(false);
	let searchResults = $state<HfModel[]>([]);
	let activeDownloads = $state<DownloadProgress[]>([]);

	// Recommended models (hard-coded for now - will be dynamic)
	const recommendedModels: HfModel[] = [
		{
			repo_id: 'Qwen/Qwen3-VL-8B-Instruct-GGUF',
			filename: 'qwen3-vl-8b-instruct-q6_k.gguf',
			size_bytes: 6_200_000_000,
			quantization: 'Q6_K',
			description: 'Vision-Language model for chat with images'
		},
		{
			repo_id: 'Qwen/Qwen3-VL-4B-Instruct-GGUF',
			filename: 'qwen3-vl-4b-instruct-q6_k.gguf',
			size_bytes: 3_100_000_000,
			quantization: 'Q6_K',
			description: 'Smaller VL model, lower VRAM'
		},
		{
			repo_id: 'Qwen/Qwen3-Embedding-0.6B-GGUF',
			filename: 'qwen3-embed-0.6b.gguf',
			size_bytes: 600_000_000,
			quantization: 'F16',
			description: 'Text embeddings for vector search'
		},
		{
			repo_id: 'Qwen/Qwen3-Reranker-0.6B-GGUF',
			filename: 'qwen3-rerank-0.6b.gguf',
			size_bytes: 600_000_000,
			quantization: 'F16',
			description: 'Reranker for search results'
		}
	];

	function formatBytes(bytes: number): string {
		if (bytes >= 1_000_000_000) {
			return (bytes / 1_000_000_000).toFixed(1) + ' GB';
		}
		if (bytes >= 1_000_000) {
			return (bytes / 1_000_000).toFixed(1) + ' MB';
		}
		return (bytes / 1_000).toFixed(1) + ' KB';
	}

	function formatSpeed(bps: number): string {
		if (bps >= 1_000_000) {
			return (bps / 1_000_000).toFixed(1) + ' MB/s';
		}
		return (bps / 1_000).toFixed(1) + ' KB/s';
	}

	function formatEta(seconds: number): string {
		if (seconds < 60) return `${Math.round(seconds)}s`;
		if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
		return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
	}

	async function handleSearch() {
		if (!searchQuery.trim()) return;
		searching = true;
		// TODO: Implement actual HF search via Tauri command
		// For now, filter recommended models
		searchResults = recommendedModels.filter(
			(m) =>
				m.repo_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.description.toLowerCase().includes(searchQuery.toLowerCase())
		);
		searching = false;
	}

	async function startDownload(model: HfModel) {
		// TODO: Implement via Tauri command
		// const handle = await invoke('download_model', { repoId: model.repo_id, filename: model.filename });
		// onDownloadStart?.(handle);

		// Mock for now - add to active downloads
		const mockProgress: DownloadProgress = {
			handle: crypto.randomUUID(),
			repo_id: model.repo_id,
			filename: model.filename,
			downloaded_bytes: 0,
			total_bytes: model.size_bytes,
			speed_bps: 45_000_000,
			eta_seconds: model.size_bytes / 45_000_000,
			status: 'downloading'
		};
		activeDownloads = [...activeDownloads, mockProgress];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="downloader-overlay" onclick={onClose} role="presentation">
	<div class="downloader-dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
		<header class="dialog-header">
			<h2>Download Model</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
		</header>

		<div class="dialog-body">
			<!-- Search -->
			<div class="search-section">
				<div class="search-input-wrap">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search HuggingFace..."
						onkeydown={(e) => e.key === 'Enter' && handleSearch()}
					/>
					<button class="search-btn" onclick={handleSearch} disabled={searching}>
						{searching ? '...' : 'Search'}
					</button>
				</div>
			</div>

			<!-- Active Downloads -->
			{#if activeDownloads.length > 0}
				<div class="section">
					<h3>DOWNLOADING</h3>
					<div class="download-list">
						{#each activeDownloads as dl (dl.handle)}
							<div class="download-item">
								<div class="download-info">
									<span class="download-name">{dl.filename}</span>
									<span class="download-meta">
										{formatBytes(dl.downloaded_bytes)} / {formatBytes(dl.total_bytes)}
										• {formatSpeed(dl.speed_bps)}
										• ETA: {formatEta(dl.eta_seconds)}
									</span>
								</div>
								<div class="download-progress">
									<div
										class="download-bar"
										style="width: {(dl.downloaded_bytes / dl.total_bytes) * 100}%"
									></div>
								</div>
								<div class="download-actions">
									<button class="dl-btn cancel">Cancel</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Search Results -->
			{#if searchResults.length > 0}
				<div class="section">
					<h3>SEARCH RESULTS</h3>
					<div class="model-list">
						{#each searchResults as model (model.repo_id + model.filename)}
							<div class="model-item">
								<div class="model-info">
									<span class="model-name">{model.repo_id}</span>
									<span class="model-file">{model.filename}</span>
									<span class="model-meta">
										{model.quantization} • {formatBytes(model.size_bytes)}
									</span>
									<span class="model-desc">{model.description}</span>
								</div>
								<button class="download-btn" onclick={() => startDownload(model)}>
									Download
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Recommended Models -->
			<div class="section">
				<h3>RECOMMENDED MODELS</h3>
				<div class="model-list">
					{#each recommendedModels as model (model.repo_id + model.filename)}
						<div class="model-item">
							<div class="model-info">
								<span class="model-name">{model.repo_id.split('/')[1]}</span>
								<span class="model-meta">
									{model.quantization} • {formatBytes(model.size_bytes)}
								</span>
								<span class="model-desc">{model.description}</span>
							</div>
							<button class="download-btn" onclick={() => startDownload(model)}>
								Download
							</button>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<footer class="dialog-footer">
			<button class="btn close" onclick={onClose}>Close</button>
		</footer>
	</div>
</div>

<style>
	.downloader-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}

	.downloader-dialog {
		background: var(--bg-secondary, #1a1a2e);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		width: 95%;
		max-width: 600px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.dialog-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.dialog-body {
		padding: 1.25rem 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.search-section {
		margin-bottom: 1.5rem;
	}

	.search-input-wrap {
		display: flex;
		gap: 0.5rem;
	}

	.search-input-wrap input {
		flex: 1;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: #fff;
		font-size: 0.9rem;
	}

	.search-input-wrap input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.search-input-wrap input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.search-btn {
		padding: 0.75rem 1.25rem;
		background: #6366f1;
		border: none;
		border-radius: 8px;
		color: #fff;
		font-weight: 500;
		cursor: pointer;
	}

	.search-btn:hover:not(:disabled) {
		background: #4f46e5;
	}

	.search-btn:disabled {
		opacity: 0.6;
	}

	.section {
		margin-bottom: 1.5rem;
	}

	.section h3 {
		font-size: 0.7rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.1em;
		margin: 0 0 0.75rem 0;
	}

	.model-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.model-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		gap: 1rem;
	}

	.model-info {
		flex: 1;
		min-width: 0;
	}

	.model-name {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.model-file {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.15rem;
	}

	.model-meta {
		font-size: 0.75rem;
		color: #6366f1;
		display: block;
		margin-top: 0.15rem;
	}

	.model-desc {
		display: block;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 0.25rem;
	}

	.download-btn {
		padding: 0.5rem 1rem;
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 6px;
		color: #22c55e;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.download-btn:hover {
		background: rgba(34, 197, 94, 0.3);
	}

	.download-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.download-item {
		padding: 1rem;
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.2);
		border-radius: 10px;
	}

	.download-info {
		margin-bottom: 0.5rem;
	}

	.download-name {
		display: block;
		font-size: 0.85rem;
		font-weight: 500;
		color: #fff;
	}

	.download-meta {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.download-progress {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.download-bar {
		height: 100%;
		background: #6366f1;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.download-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.dl-btn {
		padding: 0.35rem 0.75rem;
		font-size: 0.75rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.dl-btn.cancel {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	.dialog-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		justify-content: flex-end;
	}

	.btn.close {
		padding: 0.6rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: #fff;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.btn.close:hover {
		background: rgba(255, 255, 255, 0.15);
	}
</style>
