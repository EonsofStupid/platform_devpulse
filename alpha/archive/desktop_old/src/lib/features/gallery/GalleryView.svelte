<script lang="ts">
	/**
	 * GalleryView - Screen capture with AI analysis
	 * Features: Screen capture, region selection, AI image analysis, save, copy
	 */
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { projectsStore } from '$lib/stores';
	import RegionSelector from './RegionSelector.svelte';
	import ImageEditor from './ImageEditor.svelte';

	interface CaptureResult {
		id: string;
		data_base64: string;
		width: number;
		height: number;
		timestamp: number;
		file_path: string | null;
	}

	interface SavedCapture {
		id: string;
		filename: string;
		path: string;
		created_at: number;
	}

	interface ScreenInfo {
		id: number;
		name: string;
		x: number;
		y: number;
		width: number;
		height: number;
		is_primary: boolean;
		scale_factor: number;
	}

	// Capture state
	let captures = $state<CaptureResult[]>([]);
	let savedCaptures = $state<SavedCapture[]>([]);
	let isCapturing = $state(false);
	let screens = $state<ScreenInfo[]>([]);
	let error = $state<string | null>(null);

	// Selected capture for preview/editing
	let selectedCapture = $state<CaptureResult | null>(null);
	let showPreview = $state(false);

	// Save options
	let saveScope = $state<'global' | 'project'>('global');
	let showSaveDialog = $state(false);
	let captureToSave = $state<CaptureResult | null>(null);

	// Analysis state
	let isAnalyzing = $state(false);
	let analysisResults = $state<Map<string, string>>(new Map());

	// Region selection state
	let showRegionSelector = $state(false);

	// Image editor state
	let showImageEditor = $state(false);
	let captureToEdit = $state<CaptureResult | null>(null);

	onMount(async () => {
		// Load available screens
		try {
			screens = await invoke<ScreenInfo[]>('list_screens');
		} catch (e) {
			console.error('Failed to list screens:', e);
		}

		// Load saved captures
		await loadSavedCaptures();
	});

	async function loadSavedCaptures() {
		try {
			savedCaptures = await invoke<SavedCapture[]>('list_captures', {
				scope: 'global',
				projectId: null
			});
		} catch (e) {
			console.error('Failed to load captures:', e);
		}
	}

	async function captureScreen() {
		isCapturing = true;
		error = null;

		try {
			const result = await invoke<CaptureResult>('capture_screen');
			captures = [result, ...captures];
			selectedCapture = result;
			showPreview = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			isCapturing = false;
		}
	}

	function startRegionCapture() {
		showRegionSelector = true;
	}

	async function handleRegionSelected(region: { x: number; y: number; width: number; height: number }) {
		showRegionSelector = false;
		isCapturing = true;
		error = null;

		try {
			const result = await invoke<CaptureResult>('capture_region', { region });
			captures = [result, ...captures];
			selectedCapture = result;
			showPreview = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			isCapturing = false;
		}
	}

	function cancelRegionCapture() {
		showRegionSelector = false;
	}

	async function copyToClipboard(capture: CaptureResult) {
		try {
			await invoke('copy_capture_to_clipboard', { dataBase64: capture.data_base64 });
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function openSaveDialog(capture: CaptureResult) {
		captureToSave = capture;
		showSaveDialog = true;
	}

	async function saveCapture() {
		if (!captureToSave) return;

		try {
			const filePath = await invoke<string>('save_capture', {
				dataBase64: captureToSave.data_base64,
				options: {
					scope: saveScope,
					project_id: saveScope === 'project' ? projectsStore.selected?.id : null,
					filename: null
				}
			});

			// Update the capture with file path
			captureToSave.file_path = filePath;

			// Refresh saved captures list
			await loadSavedCaptures();

			showSaveDialog = false;
			captureToSave = null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function analyzeCapture(capture: CaptureResult) {
		isAnalyzing = true;

		try {
			// Send to AI for analysis via chat
			const result = await invoke<{ message: string }>('chat', {
				message: `[Image Analysis Request]\nPlease analyze this screenshot and describe what you see. The image is ${capture.width}x${capture.height} pixels.`
			});

			analysisResults.set(capture.id, result.message);
			analysisResults = new Map(analysisResults); // Trigger reactivity
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			isAnalyzing = false;
		}
	}

	async function loadSavedCapture(saved: SavedCapture) {
		try {
			const result = await invoke<CaptureResult>('load_capture', { path: saved.path });
			selectedCapture = result;
			showPreview = true;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function deleteSavedCapture(saved: SavedCapture) {
		try {
			await invoke('delete_capture', { path: saved.path });
			await loadSavedCaptures();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function formatTimestamp(ts: number): string {
		return new Date(ts).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function closePreview() {
		showPreview = false;
		selectedCapture = null;
	}

	function openEditor(capture: CaptureResult) {
		captureToEdit = capture;
		showImageEditor = true;
		showPreview = false;
	}

	function handleEditorSave(editedBase64: string) {
		if (!captureToEdit) return;

		// Update the capture with edited data
		const newCapture: CaptureResult = {
			...captureToEdit,
			data_base64: editedBase64,
			id: captureToEdit.id + '_edited'
		};

		// Add as new capture
		captures = [newCapture, ...captures];
		selectedCapture = newCapture;
		showImageEditor = false;
		captureToEdit = null;
		showPreview = true;
	}

	function closeEditor() {
		showImageEditor = false;
		captureToEdit = null;
	}
</script>

<div class="gallery">
	<header class="gallery-header">
		<h1>Gallery</h1>
		<p class="subtitle">Screen captures with AI vision</p>
	</header>

	{#if error}
		<div class="error-banner">
			<span>{error}</span>
			<button onclick={() => (error = null)}>Dismiss</button>
		</div>
	{/if}

	<div class="capture-actions">
		<button class="capture-btn glass" onclick={captureScreen} disabled={isCapturing}>
			<span class="btn-icon">📸</span>
			<span>Full Screen</span>
			<kbd>Ctrl+Shift+S</kbd>
		</button>
		<button class="capture-btn glass" onclick={startRegionCapture} disabled={isCapturing}>
			<span class="btn-icon">✂️</span>
			<span>Region</span>
			<kbd>Ctrl+Shift+R</kbd>
		</button>
		<button class="capture-btn glass" disabled>
			<span class="btn-icon">🪟</span>
			<span>Window</span>
			<kbd>Ctrl+Shift+W</kbd>
		</button>
	</div>

	<!-- Recent Captures (in-memory) -->
	{#if captures.length > 0}
		<section class="section">
			<h2>Recent Captures</h2>
			<div class="gallery-grid">
				{#each captures as capture (capture.id)}
					<div class="capture-card glass">
						<div class="capture-thumbnail">
							<img src="data:image/png;base64,{capture.data_base64}" alt="Screen capture" />
							<div class="capture-overlay">
								<button
									class="overlay-btn"
									onclick={() => {
										selectedCapture = capture;
										showPreview = true;
									}}
								>
									View
								</button>
								<button class="overlay-btn" onclick={() => copyToClipboard(capture)}>
									Copy
								</button>
								<button class="overlay-btn" onclick={() => openSaveDialog(capture)}>
									Save
								</button>
							</div>
						</div>
						<div class="capture-info">
							<time>{formatTimestamp(capture.timestamp)}</time>
							<span class="dimensions">{capture.width} x {capture.height}</span>
							{#if analysisResults.has(capture.id)}
								<p class="capture-analysis">{analysisResults.get(capture.id)}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Saved Captures -->
	<section class="section">
		<h2>Saved Captures</h2>
		{#if savedCaptures.length > 0}
			<div class="gallery-grid">
				{#each savedCaptures as saved (saved.id)}
					<div class="capture-card glass saved">
						<div class="capture-thumbnail" onclick={() => loadSavedCapture(saved)}>
							<div class="file-icon">📁</div>
							<div class="file-name">{saved.filename}</div>
						</div>
						<div class="capture-info">
							<time>{formatTimestamp(saved.created_at)}</time>
							<button class="delete-btn" onclick={() => deleteSavedCapture(saved)}>Delete</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state glass">
				<div class="empty-icon">📷</div>
				<h3>No saved captures</h3>
				<p>Take a screenshot and save it to see it here.</p>
			</div>
		{/if}
	</section>
</div>

<!-- Preview Modal -->
{#if showPreview && selectedCapture}
	<div class="preview-modal" onclick={closePreview}>
		<div class="preview-content" onclick={(e) => e.stopPropagation()}>
			<header class="preview-header">
				<h3>Capture Preview</h3>
				<button class="close-btn" onclick={closePreview}>Close</button>
			</header>
			<div class="preview-image">
				<img src="data:image/png;base64,{selectedCapture.data_base64}" alt="Preview" />
			</div>
			<footer class="preview-actions">
				<button class="action-btn" onclick={() => copyToClipboard(selectedCapture!)}>
					Copy to Clipboard
				</button>
				<button class="action-btn" onclick={() => openSaveDialog(selectedCapture!)}>
					Save to File
				</button>
				<button class="action-btn edit" onclick={() => openEditor(selectedCapture!)}>
					Edit / Annotate
				</button>
				<button
					class="action-btn analyze"
					onclick={() => analyzeCapture(selectedCapture!)}
					disabled={isAnalyzing}
				>
					{isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
				</button>
			</footer>
			{#if analysisResults.has(selectedCapture.id)}
				<div class="analysis-result">
					<h4>AI Analysis</h4>
					<p>{analysisResults.get(selectedCapture.id)}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Save Dialog -->
{#if showSaveDialog && captureToSave}
	<div class="save-dialog-overlay" onclick={() => (showSaveDialog = false)}>
		<div class="save-dialog" onclick={(e) => e.stopPropagation()}>
			<h3>Save Capture</h3>
			<div class="save-options">
				<label class="save-option">
					<input type="radio" name="scope" value="global" bind:group={saveScope} />
					<span>Global (App Data)</span>
				</label>
				<label class="save-option" class:disabled={!projectsStore.selected}>
					<input
						type="radio"
						name="scope"
						value="project"
						bind:group={saveScope}
						disabled={!projectsStore.selected}
					/>
					<span>
						Project
						{#if projectsStore.selected}
							({projectsStore.selected.name})
						{:else}
							(No project selected)
						{/if}
					</span>
				</label>
			</div>
			<div class="dialog-actions">
				<button onclick={() => (showSaveDialog = false)}>Cancel</button>
				<button class="primary" onclick={saveCapture}>Save</button>
			</div>
		</div>
	</div>
{/if}

<!-- Region Selector Overlay -->
{#if showRegionSelector}
	<RegionSelector onSelect={handleRegionSelected} onCancel={cancelRegionCapture} />
{/if}

<!-- Image Editor -->
{#if showImageEditor && captureToEdit}
	<ImageEditor
		imageData={captureToEdit.data_base64}
		width={captureToEdit.width}
		height={captureToEdit.height}
		onSave={handleEditorSave}
		onCancel={closeEditor}
	/>
{/if}

<style>
	.gallery {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		overflow-y: auto;
	}

	.gallery-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.subtitle {
		color: var(--color-text-secondary, #888);
		margin: 0.5rem 0 0;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: rgba(255, 255, 255, 0.8);
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.error-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		color: #ef4444;
	}

	.error-banner button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		text-decoration: underline;
	}

	.capture-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.capture-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border: none;
		color: var(--color-text-primary, #fff);
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
		color: var(--color-text-secondary, #888);
		margin-left: auto;
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.capture-card {
		overflow: hidden;
	}

	.capture-thumbnail {
		position: relative;
		aspect-ratio: 16 / 9;
		background: rgba(0, 0, 0, 0.3);
		cursor: pointer;
	}

	.capture-thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.capture-card.saved .capture-thumbnail {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.file-icon {
		font-size: 2rem;
	}

	.file-name {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
		max-width: 90%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.capture-info time {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #888);
	}

	.dimensions {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		margin-left: auto;
	}

	.delete-btn {
		font-size: 0.7rem;
		padding: 0.25rem 0.5rem;
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.25rem;
		color: #ef4444;
		cursor: pointer;
		margin-left: auto;
	}

	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.capture-analysis {
		width: 100%;
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-secondary, #888);
		line-height: 1.4;
	}

	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
	}

	.empty-state p {
		margin: 0;
		color: var(--color-text-secondary, #888);
		max-width: 280px;
		font-size: 0.875rem;
	}

	/* Preview Modal */
	.preview-modal {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 2rem;
	}

	.preview-content {
		background: #1a1a2e;
		border-radius: 1rem;
		max-width: 90vw;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.preview-header h3 {
		margin: 0;
		font-size: 1rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		font-size: 0.875rem;
	}

	.close-btn:hover {
		color: #fff;
	}

	.preview-image {
		flex: 1;
		overflow: auto;
		padding: 1rem;
	}

	.preview-image img {
		max-width: 100%;
		max-height: 60vh;
		display: block;
		margin: 0 auto;
	}

	.preview-actions {
		display: flex;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		justify-content: center;
	}

	.action-btn {
		padding: 0.625rem 1.25rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.5rem;
		color: #fff;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.action-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn.edit {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.3);
		color: #22c55e;
	}

	.action-btn.edit:hover {
		background: rgba(34, 197, 94, 0.3);
	}

	.action-btn.analyze {
		background: rgba(139, 92, 246, 0.2);
		border-color: rgba(139, 92, 246, 0.3);
		color: #a78bfa;
	}

	.action-btn.analyze:hover:not(:disabled) {
		background: rgba(139, 92, 246, 0.3);
	}

	.analysis-result {
		padding: 1rem 1.5rem;
		background: rgba(139, 92, 246, 0.1);
		border-top: 1px solid rgba(139, 92, 246, 0.2);
	}

	.analysis-result h4 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
		color: #a78bfa;
	}

	.analysis-result p {
		margin: 0;
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.5;
	}

	/* Save Dialog */
	.save-dialog-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
	}

	.save-dialog {
		background: #1a1a2e;
		border-radius: 1rem;
		padding: 1.5rem;
		min-width: 320px;
	}

	.save-dialog h3 {
		margin: 0 0 1rem;
		font-size: 1.125rem;
	}

	.save-options {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.save-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.save-option.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.save-option input {
		accent-color: #8b5cf6;
	}

	.dialog-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.dialog-actions button {
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.dialog-actions button:not(.primary) {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
	}

	.dialog-actions button.primary {
		background: #8b5cf6;
		border: none;
		color: #fff;
	}

	.dialog-actions button.primary:hover {
		background: #7c3aed;
	}
</style>
