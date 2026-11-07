<script lang="ts">
	/**
	 * GalleryView - Snipping tool with AI analysis
	 * Features: Screen capture, region selection, AI image analysis, history
	 */

	interface Capture {
		id: string;
		thumbnail: string;
		timestamp: Date;
		analysis?: string;
	}

	let captures = $state<Capture[]>([]);
	let isCapturing = $state(false);

	async function startCapture() {
		isCapturing = true;
		// TODO: Invoke Tauri screen capture
		// await invoke('start_screen_capture');
		setTimeout(() => {
			isCapturing = false;
		}, 100);
	}

	async function captureRegion() {
		// TODO: Invoke Tauri region capture
		// await invoke('capture_region');
	}

	async function analyzeCapture(capture: Capture) {
		// TODO: Send to AI for analysis
		console.log('Analyzing capture:', capture.id);
	}

	function formatDate(date: Date): string {
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="gallery">
	<header class="gallery-header">
		<h1>Gallery</h1>
		<p class="subtitle">Screen captures with AI vision</p>
	</header>

	<div class="capture-actions">
		<button class="capture-btn glass" onclick={startCapture} disabled={isCapturing}>
			<span class="btn-icon">📸</span>
			<span>Full Screen</span>
			<kbd>Ctrl+Shift+S</kbd>
		</button>
		<button class="capture-btn glass" onclick={captureRegion} disabled={isCapturing}>
			<span class="btn-icon">✂️</span>
			<span>Region</span>
			<kbd>Ctrl+Shift+R</kbd>
		</button>
		<button class="capture-btn glass" disabled={isCapturing}>
			<span class="btn-icon">🪟</span>
			<span>Window</span>
			<kbd>Ctrl+Shift+W</kbd>
		</button>
	</div>

	<div class="gallery-grid">
		{#each captures as capture (capture.id)}
			<div class="capture-card glass">
				<div class="capture-thumbnail">
					<img src={capture.thumbnail} alt="Screen capture" />
					<div class="capture-overlay">
						<button class="overlay-btn" onclick={() => analyzeCapture(capture)}>
							🔍 Analyze
						</button>
						<button class="overlay-btn">
							📋 Copy
						</button>
					</div>
				</div>
				<div class="capture-info">
					<time>{formatDate(capture.timestamp)}</time>
					{#if capture.analysis}
						<p class="capture-analysis">{capture.analysis}</p>
					{/if}
				</div>
			</div>
		{/each}

		{#if captures.length === 0}
			<div class="empty-state glass">
				<div class="empty-icon">📷</div>
				<h3>No captures yet</h3>
				<p>Take a screenshot to get started. Maestro can analyze images and extract text.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.gallery {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.gallery-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-secondary);
		margin: 0.5rem 0 0;
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.capture-actions {
		display: flex;
		gap: 1rem;
	}

	.capture-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border: none;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: all 0.2s;
	}

	.capture-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.capture-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-icon {
		font-size: 1.25rem;
	}

	.capture-btn kbd {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 0.25rem;
		color: var(--color-text-secondary);
		margin-left: auto;
	}

	.gallery-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		overflow-y: auto;
	}

	.capture-card {
		overflow: hidden;
	}

	.capture-thumbnail {
		position: relative;
		aspect-ratio: 16 / 9;
		background: rgba(0, 0, 0, 0.3);
	}

	.capture-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.capture-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		opacity: 0;
		transition: opacity 0.2s;
	}

	.capture-thumbnail:hover .capture-overlay {
		opacity: 1;
	}

	.overlay-btn {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.overlay-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.capture-info {
		padding: 1rem;
	}

	.capture-info time {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.capture-analysis {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary);
		max-width: 300px;
	}
</style>
