<script lang="ts">
	/**
	 * SettingsView - App configuration and preferences
	 * Features: Theme, AI models, voice settings, keybindings, profiles
	 */
	import { onMount, onDestroy } from 'svelte';
	import { profileStore } from '$lib/stores/profile.svelte';
	import { modelsStore } from '$lib/stores/models.svelte';
	import {
		scanModels,
		setModelDirectory,
		getDiscoveredModels,
		selectDiscoveredModel,
		getSelectedModel,
		type DiscoveredModel
	} from '$lib/api';
	import { browseFolder } from '$lib/api';

	let activeSection = $state('general');

	// Discovery state
	let modelPath = $state('');
	let discoveredModels = $state<DiscoveredModel[]>([]);
	let selectedModel = $state<DiscoveredModel | null>(null);
	let isScanning = $state(false);
	let scanError = $state<string | null>(null);

	const sections = [
		{ id: 'general', label: 'General', icon: '⚙️' },
		{ id: 'ai', label: 'AI Models', icon: '🤖' },
		{ id: 'voice', label: 'Voice', icon: '🎤' },
		{ id: 'appearance', label: 'Appearance', icon: '🎨' },
		{ id: 'keybindings', label: 'Keybindings', icon: '⌨️' },
		{ id: 'profiles', label: 'Profiles', icon: '👤' },
		{ id: 'database', label: 'Database', icon: '🗄️' },
		{ id: 'about', label: 'About', icon: 'ℹ️' }
	];

	onMount(async () => {
		await modelsStore.init();
		// Load discovered models on mount
		try {
			discoveredModels = await getDiscoveredModels();
			selectedModel = await getSelectedModel();
		} catch {
			// No models discovered yet
		}
	});

	onDestroy(() => {
		modelsStore.destroy();
	});

	async function handleModelSelect(id: string) {
		await modelsStore.switchModel(id);
	}

	async function handleBrowseFolder() {
		const folder = await browseFolder();
		if (folder) {
			modelPath = folder;
			await handleScanModels();
		}
	}

	async function handleScanModels() {
		if (!modelPath) return;
		isScanning = true;
		scanError = null;
		try {
			discoveredModels = await setModelDirectory(modelPath);
		} catch (e) {
			scanError = e instanceof Error ? e.message : String(e);
		} finally {
			isScanning = false;
		}
	}

	async function handleSelectDiscoveredModel(id: string) {
		try {
			selectedModel = await selectDiscoveredModel(id);
		} catch (e) {
			scanError = e instanceof Error ? e.message : String(e);
		}
	}

	// Derived stats
	let vlModelCount = $derived(discoveredModels.filter((m) => m.is_vl).length);
	let textModelCount = $derived(discoveredModels.filter((m) => !m.is_vl).length);
</script>

<div class="settings">
	<header class="settings-header">
		<h1>Settings</h1>
	</header>

	<div class="settings-layout">
		<nav class="settings-nav glass">
			{#each sections as section}
				<button 
					class="nav-item" 
					class:active={activeSection === section.id}
					onclick={() => activeSection = section.id}
				>
					<span class="nav-icon">{section.icon}</span>
					<span class="nav-label">{section.label}</span>
				</button>
			{/each}
		</nav>

		<div class="settings-content glass">
			{#if activeSection === 'general'}
				<section class="settings-section">
					<h2>General Settings</h2>
					
					<div class="setting-group">
						<label class="setting-item">
							<div class="setting-info">
								<span class="setting-name">Start on boot</span>
								<span class="setting-desc">Launch DevPulse when your computer starts</span>
							</div>
							<input type="checkbox" class="toggle" />
						</label>

						<label class="setting-item">
							<div class="setting-info">
								<span class="setting-name">Minimize to tray</span>
								<span class="setting-desc">Keep running in the background when closed</span>
							</div>
							<input type="checkbox" class="toggle" checked />
						</label>

						<label class="setting-item">
							<div class="setting-info">
								<span class="setting-name">Check for updates</span>
								<span class="setting-desc">Automatically check for new versions</span>
							</div>
							<input type="checkbox" class="toggle" checked />
						</label>
					</div>
				</section>

			{:else if activeSection === 'ai'}
				<section class="settings-section">
					<h2>AI Models</h2>

					<!-- Model Directory -->
					<div class="setting-group">
						<div class="setting-item path-setting">
							<div class="setting-info">
								<span class="setting-name">Model Directory</span>
								<span class="setting-desc">Point to ANY folder containing GGUF models</span>
							</div>
							<div class="path-controls">
								<input
									type="text"
									class="path-input"
									placeholder="Select model folder..."
									bind:value={modelPath}
									onkeydown={(e) => e.key === 'Enter' && handleScanModels()}
								/>
								<button class="btn btn-secondary" onclick={handleBrowseFolder}>
									Browse
								</button>
								<button
									class="btn btn-primary"
									onclick={handleScanModels}
									disabled={!modelPath || isScanning}
								>
									{isScanning ? 'Scanning...' : 'Scan'}
								</button>
							</div>
						</div>
					</div>

					{#if scanError}
						<div class="error-message">{scanError}</div>
					{/if}

					<!-- Discovered Models -->
					{#if discoveredModels.length > 0}
						<div class="discovered-section">
							<div class="discovered-header">
								<h3>Discovered Models</h3>
								<span class="model-count">
									{vlModelCount} VL, {textModelCount} Text
								</span>
							</div>

							<div class="model-grid">
								{#each discoveredModels as model}
									<button
										class="model-card"
										class:selected={selectedModel?.id === model.id}
										class:vl={model.is_vl}
										onclick={() => handleSelectDiscoveredModel(model.id)}
									>
										<div class="model-type">
											{model.is_vl ? 'VL' : 'Text'}
										</div>
										<div class="model-name">{model.name}</div>
										<div class="model-meta">
											{#if model.params_b}
												<span class="meta-item">{model.params_b}B</span>
											{/if}
											{#if model.quantization}
												<span class="meta-item">{model.quantization}</span>
											{/if}
											<span class="meta-item">{model.size_human}</span>
										</div>
										<div class="model-vram">
											~{model.vram_gb.toFixed(1)} GB VRAM
										</div>
										{#if selectedModel?.id === model.id}
											<div class="selected-badge">Selected</div>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{:else if modelPath && !isScanning}
						<div class="no-models">
							<span class="no-models-icon">📭</span>
							<p>No GGUF models found in this directory.</p>
							<p class="hint">Models should be .gguf files. Subdirectories are scanned too.</p>
						</div>
					{:else if !modelPath}
						<div class="no-models">
							<span class="no-models-icon">📁</span>
							<p>Select a model directory to discover GGUF models.</p>
							<p class="hint">Works like Ollama/LM Studio - point at any folder.</p>
						</div>
					{/if}

					<!-- Selected Model Info -->
					{#if selectedModel}
						<div class="selected-model-info glass-inner">
							<h3>Active Model</h3>
							<div class="active-model-details">
								<div class="active-model-name">{selectedModel.name}</div>
								<div class="active-model-meta">
									{#if selectedModel.family}
										<span class="meta-badge">{selectedModel.family}</span>
									{/if}
									{#if selectedModel.is_vl}
										<span class="meta-badge vl">Vision</span>
									{/if}
									{#if selectedModel.quantization}
										<span class="meta-badge">{selectedModel.quantization}</span>
									{/if}
								</div>
								<div class="active-model-path">{selectedModel.path}</div>
							</div>
						</div>
					{/if}
				</section>

			{:else if activeSection === 'profiles'}
				<section class="settings-section">
					<h2>Profile Settings</h2>
					
					<div class="profile-info glass-inner">
						<div class="profile-avatar">
							{profileStore.displayName[0] || '?'}
						</div>
						<div class="profile-details">
							<span class="profile-name">{profileStore.displayName}</span>
							<span class="profile-type">{profileStore.tenantMode}</span>
						</div>
					</div>

					<div class="setting-group">
						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-name">Profile Type</span>
								<span class="setting-desc">Individual, team, or organization</span>
							</div>
							<select class="select">
								<option value="single">Individual</option>
								<option value="team">Team</option>
								<option value="org">Organization</option>
							</select>
						</div>
					</div>
				</section>

			{:else if activeSection === 'about'}
				<section class="settings-section">
					<h2>About DevPulse</h2>
					
					<div class="about-info">
						<div class="about-logo">🚀</div>
						<h3>DevPulse</h3>
						<p class="version">Version 0.1.0-alpha</p>
						<p class="desc">AI-powered development companion with Maestro</p>
					</div>
				</section>

			{:else}
				<section class="settings-section">
					<h2>{sections.find(s => s.id === activeSection)?.label}</h2>
					<p class="coming-soon">Settings coming soon...</p>
				</section>
			{/if}
		</div>
	</div>
</div>

<style>
	.settings {
		height: 100%;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.settings-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.glass-inner {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
	}

	.settings-layout {
		flex: 1;
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 1.5rem;
		min-height: 0;
	}

	.settings-nav {
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		height: fit-content;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		border-radius: 0.5rem;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--color-text-primary);
	}

	.nav-item.active {
		background: rgba(139, 92, 246, 0.2);
		color: var(--color-text-primary);
	}

	.nav-icon {
		font-size: 1rem;
	}

	.nav-label {
		font-size: 0.875rem;
	}

	.settings-content {
		padding: 1.5rem;
		overflow-y: auto;
	}

	.settings-section h2 {
		font-size: 1.25rem;
		font-weight: 500;
		margin: 0 0 1.5rem;
	}

	.setting-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.setting-name {
		font-weight: 500;
	}

	.setting-desc {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.toggle {
		width: 44px;
		height: 24px;
		appearance: none;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: all 0.2s;
	}

	.toggle:checked {
		background: #8b5cf6;
	}

	.toggle:checked::before {
		transform: translateX(20px);
	}

	.select {
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--color-text-primary);
		cursor: pointer;
	}

	.profile-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.profile-avatar {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.profile-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.profile-name {
		font-size: 1.25rem;
		font-weight: 500;
	}

	.profile-type {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}

	.about-info {
		text-align: center;
		padding: 2rem;
	}

	.about-logo {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.about-info h3 {
		font-size: 1.5rem;
		margin: 0 0 0.5rem;
	}

	.version {
		color: var(--color-text-secondary);
		margin: 0 0 1rem;
	}

	.desc {
		color: var(--color-text-secondary);
		margin: 0;
	}

	.coming-soon {
		color: var(--color-text-secondary);
		font-style: italic;
	}

	/* Model-specific styles */
	.loading-text {
		color: var(--color-text-secondary);
		font-style: italic;
	}

	.error-message {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.model-select-wrapper {
		min-width: 280px;
	}

	.model-loading {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 200px;
	}

	.loading-stage {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}

	progress {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		overflow: hidden;
	}

	progress::-webkit-progress-bar {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	progress::-webkit-progress-value {
		background: linear-gradient(90deg, #8b5cf6, #6366f1);
		border-radius: 3px;
	}

	.model-summary {
		margin-top: 1.5rem;
		padding: 1rem;
	}

	.model-summary h3 {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0 0 1rem;
		color: var(--color-text-secondary);
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.summary-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.summary-value {
		font-size: 1rem;
		font-weight: 500;
	}

	.summary-value.warning {
		color: #f59e0b;
	}

	.select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Model Discovery Styles */
	.path-setting {
		flex-direction: column;
		align-items: stretch;
		gap: 1rem;
	}

	.path-controls {
		display: flex;
		gap: 0.5rem;
	}

	.path-input {
		flex: 1;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: var(--color-text-primary);
		font-family: monospace;
		font-size: 0.875rem;
	}

	.path-input:focus {
		outline: none;
		border-color: rgba(139, 92, 246, 0.5);
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		background: linear-gradient(135deg, #8b5cf6, #6366f1);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-text-primary);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.discovered-section {
		margin-top: 1.5rem;
	}

	.discovered-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.discovered-header h3 {
		font-size: 1rem;
		font-weight: 500;
		margin: 0;
	}

	.model-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
	}

	.model-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.model-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		color: var(--color-text-primary);
	}

	.model-card:hover {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(139, 92, 246, 0.3);
	}

	.model-card.selected {
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
	}

	.model-card.vl {
		border-left: 3px solid #8b5cf6;
	}

	.model-type {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-secondary);
	}

	.model-card.vl .model-type {
		color: #8b5cf6;
	}

	.model-name {
		font-weight: 500;
		font-size: 0.875rem;
		line-height: 1.3;
	}

	.model-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.meta-item {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		color: var(--color-text-secondary);
	}

	.model-vram {
		font-size: 0.75rem;
		color: #f59e0b;
	}

	.selected-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		font-size: 0.625rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
		border-radius: 4px;
	}

	.no-models {
		text-align: center;
		padding: 3rem 2rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		margin-top: 1rem;
	}

	.no-models-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.no-models p {
		margin: 0 0 0.5rem;
		color: var(--color-text-secondary);
	}

	.no-models .hint {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	.selected-model-info {
		margin-top: 1.5rem;
		padding: 1rem;
	}

	.selected-model-info h3 {
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0 0 0.75rem;
		color: var(--color-text-secondary);
	}

	.active-model-name {
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.active-model-meta {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.meta-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		padding: 0.125rem 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.meta-badge.vl {
		background: rgba(139, 92, 246, 0.2);
		color: #a78bfa;
	}

	.active-model-path {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-family: monospace;
		word-break: break-all;
	}
</style>
